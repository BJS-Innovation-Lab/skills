#!/usr/bin/env node
/**
 * Export customers to CSV for offline use
 * 
 * Usage:
 *   node export-csv.js                    # Export all to stdout
 *   node export-csv.js -o customers.csv   # Export to file
 *   node export-csv.js --deudores         # Only customers with debt
 *   node export-csv.js --query "Juan"     # Search filter
 */

const { listCustomers, searchCustomers, getDeudores } = require('../lib/supabase');
const fs = require('fs');
const path = require('path');

const COLUMNS = [
  'nombre',
  'telefono', 
  'email',
  'direccion',
  'notas',
  'ultima_compra',
  'total_ventas',
  'saldo_pendiente'
];

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(customers) {
  const header = COLUMNS.join(',');
  const rows = customers.map(c => 
    COLUMNS.map(col => escapeCSV(c[col])).join(',')
  );
  return [header, ...rows].join('\n');
}

async function exportCSV(options = {}) {
  const { output, deudores, query, limit } = options;
  
  let customers;
  
  if (query) {
    console.error(`Searching for "${query}"...`);
    customers = await searchCustomers(query);
  } else if (deudores) {
    console.error('Fetching deudores (customers with debt)...');
    customers = await getDeudores();
  } else {
    console.error('Fetching all customers...');
    customers = await listCustomers({ limit: limit || 5000 });
  }
  
  console.error(`Found ${customers.length} customers`);
  
  const csv = toCSV(customers);
  
  if (output) {
    const outPath = path.resolve(output);
    fs.writeFileSync(outPath, csv, 'utf-8');
    console.error(`✓ Exported to ${outPath}`);
    return { file: outPath, count: customers.length };
  } else {
    // Output to stdout
    console.log(csv);
    return { count: customers.length };
  }
}

// CLI
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '--deudores':
        options.deudores = true;
        break;
      case '--query':
      case '-q':
        options.query = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
Export customers to CSV

Usage:
  node export-csv.js [options]

Options:
  -o, --output <file>   Write to file (default: stdout)
  --deudores            Only customers with saldo_pendiente > 0
  -q, --query <text>    Search filter
  --limit <n>           Max records (default: 5000)
  -h, --help            Show this help

Examples:
  node export-csv.js -o backup.csv
  node export-csv.js --deudores -o deudores.csv
  node export-csv.js -q "García" > garcia.csv
`);
        process.exit(0);
    }
  }
  
  return options;
}

const options = parseArgs();
exportCSV(options).catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
