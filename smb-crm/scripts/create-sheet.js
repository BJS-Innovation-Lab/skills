#!/usr/bin/env node
/**
 * Create a new Google Sheet for customers
 * Note: gog CLI doesn't support direct sheet creation,
 * so this provides guidance and automation where possible
 */

const { execSync } = require('child_process');
const { createHeader } = require('../lib/sheets');

function execGog(args) {
  const account = process.env.GOG_ACCOUNT || '';
  const accountArg = account ? `--account ${account}` : '';
  const cmd = `gog ${args} ${accountArg} --json --no-input`;
  
  try {
    const result = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(result);
  } catch (error) {
    return null;
  }
}

async function findSheet(name) {
  // Search Drive for existing sheet
  const results = execGog(`drive search "name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'"`);
  return results?.files?.[0];
}

async function createSheet(name) {
  console.log(`\n📊 Setting up Google Sheet: "${name}"\n`);
  
  // Check if sheet already exists
  const existing = await findSheet(name);
  if (existing) {
    console.log(`✓ Found existing sheet: ${existing.name}`);
    console.log(`  ID: ${existing.id}`);
    console.log(`  URL: https://docs.google.com/spreadsheets/d/${existing.id}`);
    
    // Initialize headers if needed
    console.log('\nInitializing headers...');
    try {
      createHeader(existing.id);
      console.log('✓ Headers created (or already exist)');
    } catch (e) {
      console.log('⚠ Could not set headers - may already exist');
    }
    
    return existing.id;
  }
  
  // Sheet doesn't exist - provide instructions
  console.log('Sheet not found. To create:\n');
  console.log('Option 1: Create manually');
  console.log('  1. Go to https://sheets.new');
  console.log(`  2. Name it: "${name}"`);
  console.log('  3. Copy the Sheet ID from the URL');
  console.log('  4. Run: node create-sheet.js --init <sheetId>\n');
  
  console.log('Option 2: Via Google Drive (if you have drive API access)');
  console.log('  The agent can create files via Drive API\n');
  
  console.log('Option 3: Share an existing sheet');
  console.log('  Share any Google Sheet with your GOG account\n');
  
  // Try to provide a sheet URL from recent files
  const recent = execGog('drive search "mimeType=\'application/vnd.google-apps.spreadsheet\'" --max 5');
  if (recent?.files?.length > 0) {
    console.log('Your recent Google Sheets:');
    recent.files.forEach(f => {
      console.log(`  - ${f.name}: ${f.id}`);
    });
  }
  
  return null;
}

async function initExisting(sheetId) {
  console.log(`Initializing sheet ${sheetId}...`);
  
  try {
    createHeader(sheetId);
    console.log('✓ Headers created');
    console.log(`\nSheet ready at: https://docs.google.com/spreadsheets/d/${sheetId}`);
    console.log('\nColumns: ID | Nombre | Teléfono | Email | Dirección | Notas | Última Compra | Total Ventas | Saldo Pendiente');
  } catch (e) {
    console.error('Failed to initialize:', e.message);
    process.exit(1);
  }
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--init')) {
  const idx = args.indexOf('--init');
  const sheetId = args[idx + 1];
  if (!sheetId) {
    console.log('Usage: create-sheet.js --init <sheetId>');
    process.exit(1);
  }
  initExisting(sheetId);
} else if (args.length === 0) {
  console.log('Usage: create-sheet.js "Sheet Name"');
  console.log('       create-sheet.js --init <sheetId>');
  console.log('\nCreates or finds a Google Sheet for customer data.');
  process.exit(0);
} else {
  createSheet(args[0]).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
}
