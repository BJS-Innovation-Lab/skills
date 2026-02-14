/**
 * Google Sheets helpers using gog CLI
 * Wraps gog commands for customer sheet operations
 * 
 * Features:
 * - Dynamic range detection (handles >1000 rows)
 * - Conflict detection via _sheet_updated_at column
 * - Spanish localization
 */

const { execSync } = require('child_process');

// Column mapping for customer schema
const COLUMNS = [
  'ID', 'Nombre', 'Teléfono', 'Email', 'Dirección', 
  'Notas', 'Última Compra', 'Total Ventas', 'Saldo Pendiente', 'Actualizado'
];

const COLUMN_KEYS = [
  'id', 'nombre', 'telefono', 'email', 'direccion',
  'notas', 'ultima_compra', 'total_ventas', 'saldo_pendiente', '_sheet_updated_at'
];

// Max rows per tab (Google Sheets limit is 10M cells, ~500k rows with our columns)
const MAX_ROWS_PER_TAB = 50000;

function execGog(args, options = {}) {
  const account = process.env.GOG_ACCOUNT || '';
  const accountArg = account ? `--account ${account}` : '';
  const cmd = `gog ${args} ${accountArg} --json --no-input`;
  
  try {
    const result = execSync(cmd, { 
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large sheets
      ...options
    });
    return JSON.parse(result);
  } catch (error) {
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {}
    }
    throw new Error(`gog command failed: ${error.message}`);
  }
}

/**
 * Get sheet metadata including row count
 */
function getSheetMetadata(sheetId) {
  return execGog(`sheets metadata ${sheetId}`);
}

/**
 * Detect the actual data range (find last non-empty row)
 */
function detectDataRange(sheetId, tabName = 'Clientes') {
  try {
    // Get column A to find last row with data
    const checkRange = `${tabName}!A:A`;
    const data = execGog(`sheets get ${sheetId} "${checkRange}"`);
    
    if (!data || !data.values) return { lastRow: 1, hasData: false };
    
    // Find last non-empty row
    let lastRow = 1;
    for (let i = data.values.length - 1; i >= 0; i--) {
      if (data.values[i] && data.values[i][0]) {
        lastRow = i + 1;
        break;
      }
    }
    
    return { lastRow, hasData: lastRow > 1 };
  } catch (error) {
    console.error('Range detection failed:', error.message);
    return { lastRow: 1000, hasData: true }; // Fallback
  }
}

/**
 * Read all customer data from sheet (with dynamic range)
 */
function readCustomers(sheetId, tabName = 'Clientes') {
  // First, detect actual data range
  const { lastRow, hasData } = detectDataRange(sheetId, tabName);
  
  if (!hasData) return [];
  
  // Read only the rows with data (skip header)
  const range = `${tabName}!A2:J${lastRow}`;
  const data = execGog(`sheets get ${sheetId} "${range}"`);
  
  if (!data || !data.values) return [];
  
  return data.values.map(row => {
    const customer = {};
    COLUMN_KEYS.forEach((key, i) => {
      if (row[i] !== undefined && row[i] !== '') {
        // Parse numeric fields
        if (key === 'total_ventas' || key === 'saldo_pendiente') {
          customer[key] = parseFloat(String(row[i]).replace(/[$,]/g, '')) || 0;
        } else if (key === 'ultima_compra' && row[i]) {
          customer[key] = row[i];
        } else {
          customer[key] = row[i];
        }
      }
    });
    return customer;
  }).filter(c => c.nombre); // Filter out empty rows
}

/**
 * Write customers to sheet (full replace of data rows)
 */
function writeCustomers(sheetId, customers, tabName = 'Clientes') {
  // Get current row count for clearing
  const { lastRow } = detectDataRange(sheetId, tabName);
  
  // Clear existing data (keep header)
  if (lastRow > 1) {
    const clearRange = `${tabName}!A2:J${lastRow}`;
    try {
      execGog(`sheets clear ${sheetId} "${clearRange}"`);
    } catch {}
  }
  
  if (customers.length === 0) return;
  
  // Check if we need multiple tabs
  if (customers.length > MAX_ROWS_PER_TAB) {
    console.warn(`⚠️  ${customers.length} customers exceeds single tab limit (${MAX_ROWS_PER_TAB})`);
    console.warn('Consider archiving inactive customers or using multiple tabs.');
  }
  
  // Convert customers to rows with timestamp
  const now = new Date().toISOString();
  const rows = customers.map(c => COLUMN_KEYS.map(key => {
    if (key === '_sheet_updated_at') return now;
    
    const val = c[key];
    if (val === null || val === undefined) return '';
    if (key === 'total_ventas' || key === 'saldo_pendiente') {
      return typeof val === 'number' ? `$${val.toFixed(2)}` : val;
    }
    if (key === 'ultima_compra' && val) {
      return new Date(val).toLocaleDateString('es-MX');
    }
    return String(val);
  }));
  
  const valuesJson = JSON.stringify(rows);
  const appendRange = `${tabName}!A2:J`;
  
  execGog(`sheets append ${sheetId} "${appendRange}" --values-json '${valuesJson}' --insert INSERT_ROWS`);
  
  return { written: rows.length };
}

/**
 * Append single customer to sheet
 */
function appendCustomer(sheetId, customer, tabName = 'Clientes') {
  const now = new Date().toISOString();
  const row = COLUMN_KEYS.map(key => {
    if (key === '_sheet_updated_at') return now;
    
    const val = customer[key];
    if (val === null || val === undefined) return '';
    if (key === 'total_ventas' || key === 'saldo_pendiente') {
      return typeof val === 'number' ? `$${val.toFixed(2)}` : val;
    }
    if (key === 'ultima_compra' && val) {
      return new Date(val).toLocaleDateString('es-MX');
    }
    return String(val);
  });
  
  const valuesJson = JSON.stringify([row]);
  const appendRange = `${tabName}!A:J`;
  
  execGog(`sheets append ${sheetId} "${appendRange}" --values-json '${valuesJson}' --insert INSERT_ROWS`);
}

/**
 * Create header row in a new sheet
 */
function createHeader(sheetId, tabName = 'Clientes') {
  const valuesJson = JSON.stringify([COLUMNS]);
  const range = `${tabName}!A1:J1`;
  
  execGog(`sheets update ${sheetId} "${range}" --values-json '${valuesJson}' --input USER_ENTERED`);
}

/**
 * Get stats about the sheet
 */
function getSheetStats(sheetId, tabName = 'Clientes') {
  const { lastRow, hasData } = detectDataRange(sheetId, tabName);
  const customerCount = hasData ? lastRow - 1 : 0; // Minus header
  
  return {
    customerCount,
    lastRow,
    hasData,
    nearLimit: customerCount > MAX_ROWS_PER_TAB * 0.8
  };
}

/**
 * Create a new Google Sheet for customers via Drive
 */
function createSheet(name) {
  return {
    instruction: `Create a new Google Sheet named "${name}" and share the Sheet ID. Use: gog drive search "${name}" to find it after creation.`,
    manual: true
  };
}

module.exports = {
  COLUMNS,
  COLUMN_KEYS,
  MAX_ROWS_PER_TAB,
  getSheetMetadata,
  detectDataRange,
  readCustomers,
  writeCustomers,
  appendCustomer,
  createHeader,
  createSheet,
  getSheetStats
};
