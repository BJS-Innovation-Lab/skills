-- SMB CRM Database Schema
-- Run this in Supabase SQL Editor to create tables

-- Customers table
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
  
  CONSTRAINT customers_nombre_check CHECK (char_length(nombre) > 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre);
CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
CREATE INDEX IF NOT EXISTS idx_customers_saldo ON customers(saldo_pendiente) WHERE saldo_pendiente > 0;
CREATE INDEX IF NOT EXISTS idx_customers_ultima_compra ON customers(ultima_compra);
CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_id);

-- Full-text search on nombre
CREATE INDEX IF NOT EXISTS idx_customers_nombre_trgm ON customers USING gin(nombre gin_trgm_ops);

-- Auto-update updated_at trigger
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

-- Row Level Security (optional, for multi-tenant)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies: Users see only their own customers (when owner_id is set)
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = owner_id OR owner_id IS NULL);

-- Grant access to service role (for agent operations)
GRANT ALL ON customers TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon, authenticated;
