#!/usr/bin/env node
/**
 * Sync Supabase → Google Sheet
 * Use when agent has made changes via queries/imports
 */

const { writeCustomers, createHeader, getSheetMetadata } = require('../lib/sheets');
const { listCustomers } = require('../lib/supabase');

async function syncToSheet(sheetId) {
  console.log(`Syncing Supabase → Sheet ${sheetId}...`);
  
  // Verify sheet exists
  try {
    const metadata = getSheetMetadata(sheetId);
    console.log(`Sheet: ${metadata.properties?.title || 'Unknown'}`);
  } catch (e) {
    console.error('Cannot access sheet. Verify Sheet ID and permissions.');
    process.exit(1);
  }
  
  // Get all customers from Supabase
  const customers = await listCustomers({ limit: 1000, orderBy: 'nombre' });
  console.log(`Found ${customers.length} customers in Supabase`);
  
  if (customers.length === 0) {
    console.log('No customers to sync.');
    return;
  }
  
  // Write to sheet
  writeCustomers(sheetId, customers);
  console.log(`✓ Wrote ${customers.length} customers to Sheet`);
  
  return customers;
}

async function initSheet(sheetId) {
  console.log(`Initializing sheet ${sheetId} with headers...`);
  createHeader(sheetId);
  console.log('✓ Headers created');
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: sync-to-sheet.js <sheetId> [--init]');
  console.log('\nSyncs customer data from Supabase to Google Sheet.');
  console.log('\nOptions:');
  console.log('  --init  Create header row (for new sheets)');
  process.exit(0);
}

const sheetId = args[0];
const init = args.includes('--init');

(async () => {
  if (init) {
    await initSheet(sheetId);
  }
  await syncToSheet(sheetId);
})().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
