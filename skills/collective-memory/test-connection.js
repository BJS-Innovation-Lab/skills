const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'process.env.SUPABASE_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  const sqlPath = path.join(__dirname, 'migrations/001_create_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  console.log('🚀 Starting Hive Mind migration...');
  
  // We have to run the SQL commands. Since Supabase-js doesn't have a raw SQL method
  // for migrations via the client easily without an RPC, we will try to use the REST API 
  // or specialized calls if possible. 
  // Actually, the most reliable way for me right now is to attempt to create the 
  // 'agents' table as a test of connectivity.
  
  const { data, error } = await supabase.from('agents').select('*').limit(1);
  
  if (error && error.code === 'PGRST116' || error === null) {
      console.log('✅ Connected to Supabase!');
      if (error) {
          console.log('Table "agents" does not exist yet (as expected).');
      } else {
          console.log('Table "agents" already exists.');
      }
  } else {
      console.error('❌ Connection failed:', error);
      return;
  }

  console.log('⚠️  Note: I cannot execute raw SQL files directly through the JS client.');
  console.log('Please paste the contents of 001_create_tables.sql into the Supabase SQL Editor.');
}

runMigration();
