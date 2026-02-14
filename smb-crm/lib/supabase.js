/**
 * Supabase client for SMB CRM
 * Uses the same Supabase instance as A2A (team database)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load config from A2A config or environment
function getConfig() {
  const configPath = path.join(process.env.HOME, '.openclaw/a2a/config.json');
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      url: config.supabase_url || config.supabaseUrl,
      key: process.env.SUPABASE_KEY || config.supabase_anon_key || config.supabaseKey
    };
  }
  
  // Fallback to environment
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  };
}

let client = null;

function getClient() {
  if (!client) {
    const config = getConfig();
    if (!config.url || !config.key) {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY or configure ~/.openclaw/a2a/config.json');
    }
    client = createClient(config.url, config.key);
  }
  return client;
}

// Customer operations
async function listCustomers(options = {}) {
  const { limit = 100, orderBy = 'nombre', ascending = true } = options;
  const supabase = getClient();
  
  let query = supabase
    .from('customers')
    .select('*')
    .order(orderBy, { ascending })
    .limit(limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getDeudores() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .gt('saldo_pendiente', 0)
    .order('saldo_pendiente', { ascending: false });
  
  if (error) throw error;
  return data;
}

async function getTopCustomers(limit = 10) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('total_ventas', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

async function getInactiveCustomers(days = 90) {
  const supabase = getClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`ultima_compra.is.null,ultima_compra.lt.${cutoffDate.toISOString()}`);
  
  if (error) throw error;
  return data;
}

async function searchCustomers(query) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`);
  
  if (error) throw error;
  return data;
}

async function getRecentPurchases(days = 30) {
  const supabase = getClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .gte('ultima_compra', cutoffDate.toISOString())
    .order('ultima_compra', { ascending: false });
  
  if (error) throw error;
  return data;
}

async function upsertCustomer(customer) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .upsert(customer, { onConflict: 'id' })
    .select();
  
  if (error) throw error;
  return data[0];
}

async function upsertCustomers(customers) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .upsert(customers, { onConflict: 'id' })
    .select();
  
  if (error) throw error;
  return data;
}

async function deleteCustomer(id) {
  const supabase = getClient();
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

async function updateCustomer(id, updates) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
}

module.exports = {
  getClient,
  listCustomers,
  getDeudores,
  getTopCustomers,
  getInactiveCustomers,
  searchCustomers,
  getRecentPurchases,
  upsertCustomer,
  upsertCustomers,
  updateCustomer,
  deleteCustomer
};
