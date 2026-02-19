#!/usr/bin/env node
import pg from 'pg';
import fs from 'fs';

const client = new pg.Client({
  host: 'db.fcgiuzmmvcnovaciykbx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node run-sql.js <file.sql>');
    process.exit(1);
  }

  try {
    const sql = fs.readFileSync(file, 'utf8');
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    console.log(`Running ${file}...`);
    await client.query(sql);
    
    console.log('✅ SQL executed successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
