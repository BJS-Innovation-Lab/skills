#!/usr/bin/env node
/**
 * Sync Google Sheet → Supabase (with conflict detection)
 * Use when user has edited the sheet directly
 */

const { readCustomers } = require('../lib/sheets');
const { upsertCustomers, listCustomers } = require('../lib/supabase');

async function syncToSupabase(sheetId, options = {}) {
  const { force = false, dryRun = false } = options;
  
  console.log(`Syncing Sheet ${sheetId} → Supabase...`);
  if (dryRun) console.log('(DRY RUN - no changes will be made)');
  
  // Read from sheet
  const sheetCustomers = readCustomers(sheetId);
  console.log(`Read ${sheetCustomers.length} customers from Sheet`);
  
  if (sheetCustomers.length === 0) {
    console.log('No customers in sheet.');
    return { synced: 0, conflicts: [] };
  }
  
  // Get existing from Supabase with timestamps
  const existingCustomers = await listCustomers({ limit: 5000 });
  const existingByName = new Map(existingCustomers.map(c => [c.nombre.toLowerCase(), c]));
  
  const toUpsert = [];
  const conflicts = [];
  const newRecords = [];
  
  for (const sc of sheetCustomers) {
    const existing = existingByName.get(sc.nombre?.toLowerCase());
    
    if (existing) {
      // Check for conflicts - if Supabase was updated after sheet was last synced
      const sheetUpdated = sc._sheet_updated_at ? new Date(sc._sheet_updated_at) : null;
      const dbUpdated = existing.updated_at ? new Date(existing.updated_at) : null;
      
      if (dbUpdated && sheetUpdated && dbUpdated > sheetUpdated && !force) {
        // Conflict! DB was modified after this sheet row
        conflicts.push({
          nombre: sc.nombre,
          sheet_data: sc,
          db_data: existing,
          db_updated: existing.updated_at,
          reason: 'Database record newer than sheet'
        });
        continue;
      }
      
      // Safe to update
      toUpsert.push({ ...existing, ...sc, id: existing.id });
    } else {
      // New record
      newRecords.push(sc);
      toUpsert.push(sc);
    }
  }
  
  // Report conflicts
  if (conflicts.length > 0) {
    console.log(`\n⚠️  ${conflicts.length} CONFLICTS DETECTED:`);
    for (const c of conflicts) {
      console.log(`  - ${c.nombre}: ${c.reason}`);
      console.log(`    DB updated: ${c.db_updated}`);
    }
    console.log('\nUse --force to overwrite, or resolve manually.');
  }
  
  if (dryRun) {
    console.log(`\nDry run summary:`);
    console.log(`  Would sync: ${toUpsert.length}`);
    console.log(`  New: ${newRecords.length}`);
    console.log(`  Conflicts: ${conflicts.length}`);
    return { synced: 0, conflicts, dryRun: true };
  }
  
  // Upsert to Supabase
  if (toUpsert.length > 0) {
    const result = await upsertCustomers(toUpsert);
    console.log(`\n✓ Synced ${result.length} customers to Supabase`);
    console.log(`  New: ${newRecords.length}, Updated: ${toUpsert.length - newRecords.length}`);
    return { synced: result.length, conflicts, new: newRecords.length };
  }
  
  return { synced: 0, conflicts };
}

// CLI
const args = process.argv.slice(2);
const sheetId = args.find(a => !a.startsWith('--'));
const force = args.includes('--force');
const dryRun = args.includes('--dry-run');

if (!sheetId) {
  console.log(`Usage: sync-to-supabase.js <sheetId> [--force] [--dry-run]

Syncs customer data from Google Sheet to Supabase.

Options:
  --force    Overwrite conflicts (DB wins by default)
  --dry-run  Preview changes without syncing

Conflict Detection:
  If a Supabase record was updated after the corresponding
  Sheet row, it's flagged as a conflict. Use --force to override.
`);
  process.exit(0);
}

syncToSupabase(sheetId, { force, dryRun }).catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
