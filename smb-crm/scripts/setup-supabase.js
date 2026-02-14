#!/usr/bin/env node
/**
 * Setup Supabase tables for SMB CRM
 * Run once to create the customers table
 */

const { getClient } = require('../lib/supabase');

const SCHEMA = `
-- Customers table for SMB CRM
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  notas TEXT,
  ultima_compra DATE,
  total_ventas NUMERIC(12,2) DEFAULT 0,
  saldo_pendiente NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For multi-tenant support (optional)
  owner_id UUID,
  
  -- Indexes
  CONSTRAINT customers_nombre_check CHECK (char_length(nombre) > 0)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre);
CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
CREATE INDEX IF NOT EXISTS idx_customers_saldo ON customers(saldo_pendiente) WHERE saldo_pendiente > 0;
CREATE INDEX IF NOT EXISTS idx_customers_ultima_compra ON customers(ultima_compra);
CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (if using Supabase Auth)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own customers
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = owner_id OR owner_id IS NULL);
`;

async function setup() {
  console.log('Setting up SMB CRM tables in Supabase...\n');
  
  const supabase = getClient();
  
  // Check if table exists
  const { data: existing, error: checkError } = await supabase
    .from('customers')
    .select('id')
    .limit(1);
  
  if (!checkError) {
    console.log('✓ customers table already exists');
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    console.log(`  Current row count: ${count || 0}`);
    return;
  }
  
  // Table doesn't exist - need to create via SQL
  console.log('Table does not exist. To create it:\n');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Open SQL Editor');
  console.log('3. Run this SQL:\n');
  console.log('------- SQL START -------');
  console.log(SCHEMA);
  console.log('------- SQL END -------\n');
  console.log('Or save to file and run:');
  console.log('  cat references/schema.sql | psql $DATABASE_URL');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
