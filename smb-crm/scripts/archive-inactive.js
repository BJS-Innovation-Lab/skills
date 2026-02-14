#!/usr/bin/env node
/**
 * Archive Inactive Customers
 * 
 * Moves customers with no purchases in X months to archive table.
 * Helps keep main table fast when scaling beyond 1000 customers.
 * 
 * Usage:
 *   node archive-inactive.js --months 12       # Archive if no purchase in 12 months
 *   node archive-inactive.js --dry-run         # Preview without archiving
 *   node archive-inactive.js --restore <id>    # Restore archived customer
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function ensureArchiveTable() {
  // Create archive table if not exists (same schema as customers)
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS customers_archive (
        LIKE customers INCLUDING ALL,
        archived_at TIMESTAMPTZ DEFAULT NOW(),
        archive_reason TEXT
      );
    `
  }).catch(() => {});
  
  // If RPC doesn't work, table might already exist
  return true;
}

async function getInactiveCustomers(months) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  const cutoff = cutoffDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`ultima_compra.is.null,ultima_compra.lt.${cutoff}`)
    .eq('saldo_pendiente', 0); // Don't archive customers with pending balance
  
  if (error) throw error;
  return data || [];
}

async function archiveCustomers(customers, reason) {
  if (customers.length === 0) return { archived: 0 };
  
  // Insert into archive
  const toArchive = customers.map(c => ({
    ...c,
    archived_at: new Date().toISOString(),
    archive_reason: reason
  }));
  
  const { error: insertError } = await supabase
    .from('customers_archive')
    .insert(toArchive);
  
  if (insertError) throw insertError;
  
  // Delete from main table
  const ids = customers.map(c => c.id);
  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .in('id', ids);
  
  if (deleteError) throw deleteError;
  
  return { archived: customers.length };
}

async function restoreCustomer(id) {
  // Get from archive
  const { data: archived, error: getError } = await supabase
    .from('customers_archive')
    .select('*')
    .eq('id', id)
    .single();
  
  if (getError) throw new Error(`Customer ${id} not found in archive`);
  
  // Remove archive metadata
  const { archived_at, archive_reason, ...customer } = archived;
  
  // Insert back to main table
  const { error: insertError } = await supabase
    .from('customers')
    .insert(customer);
  
  if (insertError) throw insertError;
  
  // Delete from archive
  const { error: deleteError } = await supabase
    .from('customers_archive')
    .delete()
    .eq('id', id);
  
  if (deleteError) throw deleteError;
  
  return { restored: customer.nombre };
}

async function getArchiveStats() {
  const { count: activeCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });
  
  const { count: archivedCount } = await supabase
    .from('customers_archive')
    .select('*', { count: 'exact', head: true });
  
  return { active: activeCount || 0, archived: archivedCount || 0 };
}

// CLI
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { months: 12 };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--months':
        options.months = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--restore':
        options.restore = args[++i];
        break;
      case '--stats':
        options.stats = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Archive Inactive Customers

Usage:
  node archive-inactive.js [options]

Options:
  --months <n>      Archive if no purchase in n months (default: 12)
  --dry-run         Preview without archiving
  --restore <id>    Restore archived customer by ID
  --stats           Show archive statistics
  -h, --help        Show this help

Examples:
  node archive-inactive.js --months 6 --dry-run
  node archive-inactive.js --months 12
  node archive-inactive.js --restore abc123
`);
        process.exit(0);
    }
  }
  
  return options;
}

async function main() {
  const options = parseArgs();
  
  if (options.stats) {
    const stats = await getArchiveStats();
    console.log('Archive Statistics:');
    console.log(`  Active customers: ${stats.active}`);
    console.log(`  Archived: ${stats.archived}`);
    return;
  }
  
  if (options.restore) {
    console.log(`Restoring customer ${options.restore}...`);
    const result = await restoreCustomer(options.restore);
    console.log(`✓ Restored: ${result.restored}`);
    return;
  }
  
  // Archive inactive
  await ensureArchiveTable();
  
  const inactive = await getInactiveCustomers(options.months);
  console.log(`Found ${inactive.length} inactive customers (no purchase in ${options.months}+ months, no pending balance)`);
  
  if (inactive.length === 0) {
    console.log('Nothing to archive.');
    return;
  }
  
  if (options.dryRun) {
    console.log('\nWould archive:');
    for (const c of inactive.slice(0, 10)) {
      console.log(`  - ${c.nombre} (last purchase: ${c.ultima_compra || 'never'})`);
    }
    if (inactive.length > 10) {
      console.log(`  ... and ${inactive.length - 10} more`);
    }
    return;
  }
  
  const reason = `Inactive for ${options.months}+ months`;
  const result = await archiveCustomers(inactive, reason);
  console.log(`✓ Archived ${result.archived} customers`);
  
  const stats = await getArchiveStats();
  console.log(`  Active: ${stats.active}, Archived: ${stats.archived}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
