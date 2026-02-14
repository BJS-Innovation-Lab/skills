#!/usr/bin/env node
/**
 * Import customers from Excel/CSV files
 * Handles various formats and column names
 */

const fs = require('fs');
const path = require('path');
const { upsertCustomers } = require('../lib/supabase');

// Common column name variations (Spanish + English)
const COLUMN_MAPPINGS = {
  nombre: ['nombre', 'name', 'cliente', 'customer', 'client', 'razón social', 'razon social'],
  telefono: ['telefono', 'teléfono', 'phone', 'tel', 'celular', 'móvil', 'movil', 'whatsapp'],
  email: ['email', 'correo', 'e-mail', 'mail', 'correo electrónico'],
  direccion: ['direccion', 'dirección', 'address', 'domicilio', 'ubicación', 'ubicacion'],
  notas: ['notas', 'notes', 'comentarios', 'observaciones', 'comments'],
  ultima_compra: ['ultima_compra', 'última compra', 'last_purchase', 'fecha', 'last order'],
  total_ventas: ['total_ventas', 'total ventas', 'total', 'ventas', 'sales', 'revenue'],
  saldo_pendiente: ['saldo_pendiente', 'saldo pendiente', 'saldo', 'debe', 'adeudo', 'balance', 'owed']
};

function normalizeColumnName(name) {
  const normalized = name.toLowerCase().trim();
  
  for (const [key, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.includes(normalized)) {
      return key;
    }
  }
  
  return null; // Unknown column
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : 
                    firstLine.includes(';') ? ';' : ',';
  
  const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
  const columnMap = {};
  
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    if (normalized) {
      columnMap[index] = normalized;
    }
  });
  
  console.log('Detected columns:', Object.values(columnMap).join(', '));
  
  const customers = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.replace(/"/g, '').trim());
    const customer = {};
    
    for (const [index, key] of Object.entries(columnMap)) {
      const value = values[parseInt(index)];
      if (value) {
        if (key === 'total_ventas' || key === 'saldo_pendiente') {
          customer[key] = parseFloat(value.replace(/[$,]/g, '')) || 0;
        } else {
          customer[key] = value;
        }
      }
    }
    
    if (customer.nombre) {
      customers.push(customer);
    }
  }
  
  return customers;
}

async function parseExcel(filePath) {
  // Try to use xlsx if available
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Parsed ${data.length} rows from Excel`);
    
    // Map columns
    return data.map(row => {
      const customer = {};
      for (const [key, value] of Object.entries(row)) {
        const normalized = normalizeColumnName(key);
        if (normalized && value) {
          if (normalized === 'total_ventas' || normalized === 'saldo_pendiente') {
            customer[normalized] = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
          } else {
            customer[normalized] = String(value);
          }
        }
      }
      return customer;
    }).filter(c => c.nombre);
  } catch (e) {
    console.error('xlsx not installed. Install with: npm install xlsx');
    console.error('Or convert to CSV first.');
    process.exit(1);
  }
}

async function importFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let customers;
  
  console.log(`Importing from: ${filePath}`);
  
  if (ext === '.csv' || ext === '.txt') {
    const content = fs.readFileSync(filePath, 'utf8');
    customers = parseCSV(content);
  } else if (ext === '.xlsx' || ext === '.xls') {
    customers = await parseExcel(filePath);
  } else {
    console.error(`Unsupported file type: ${ext}`);
    console.error('Supported: .csv, .txt, .xlsx, .xls');
    process.exit(1);
  }
  
  console.log(`Found ${customers.length} customers`);
  
  if (customers.length === 0) {
    console.log('No customers to import.');
    return;
  }
  
  // Preview first 3
  console.log('\nPreview:');
  customers.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.nombre} - ${c.telefono || 'sin tel'}`);
  });
  
  // Import to Supabase
  console.log('\nImporting to Supabase...');
  const imported = await upsertCustomers(customers);
  console.log(`✓ Imported ${imported.length} customers`);
  
  return imported;
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: import-customers.js <file.csv|file.xlsx>');
  console.log('\nSupported formats:');
  console.log('  - CSV (comma, semicolon, or tab delimited)');
  console.log('  - Excel (.xlsx, .xls)');
  console.log('\nColumn names auto-detected (Spanish/English):');
  console.log('  nombre, telefono, email, direccion, notas,');
  console.log('  ultima_compra, total_ventas, saldo_pendiente');
  process.exit(0);
}

importFile(args[0]).catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
