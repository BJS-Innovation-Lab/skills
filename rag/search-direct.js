#!/usr/bin/env node
/**
 * RAG Search Script (Direct SQL) for Sybil
 * Searches indexed documents using semantic similarity via direct PostgreSQL
 * Bypasses REST API schema cache issues
 */

import pg from 'pg';
import OpenAI from 'openai';

const AGENT_ID = '5fae1839-ab85-412c-acc0-033cbbbbd15b';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate embedding for query
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

// Search documents via direct SQL
async function searchDocuments(client, query, options = {}) {
  const { limit = 5, docType = null } = options;
  
  console.log(`\n🔍 Searching for: "${query}"\n`);
  
  // Generate query embedding
  const embedding = await generateEmbedding(query);
  const embeddingStr = `[${embedding.join(',')}]`;
  
  // Build query
  let sql = `
    SELECT 
      id, title, content, doc_type, file_path,
      1 - (embedding <=> $1::vector) as similarity
    FROM documents
    WHERE agent_id = $2
  `;
  const params = [embeddingStr, AGENT_ID];
  
  if (docType) {
    sql += ` AND doc_type = $3`;
    params.push(docType);
  }
  
  sql += ` ORDER BY embedding <=> $1::vector LIMIT ${limit}`;
  
  const res = await client.query(sql, params);
  return res.rows;
}

// Format and display results
function displayResults(results) {
  if (results.length === 0) {
    console.log('No matching documents found.\n');
    return;
  }
  
  console.log(`📚 Found ${results.length} results:\n`);
  console.log('─'.repeat(60));
  
  for (const doc of results) {
    const similarity = (doc.similarity * 100).toFixed(1);
    console.log(`\n📄 ${doc.title} (${doc.doc_type})`);
    console.log(`   Path: ${doc.file_path}`);
    console.log(`   Similarity: ${similarity}%`);
    console.log(`   Preview: ${doc.content.slice(0, 200).replace(/\n/g, ' ')}...`);
    console.log('─'.repeat(60));
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.DB_PASS || !process.env.OPENAI_API_KEY) {
    console.error('❌ Missing environment variables. Need: DB_PASS, OPENAI_API_KEY');
    process.exit(1);
  }
  
  const client = new pg.Client({
    host: 'db.fcgiuzmmvcnovaciykbx.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_PASS,
    ssl: { rejectUnauthorized: false }
  });
  
  // Parse args
  let query = '';
  let limit = 5;
  let docType = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      docType = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      query = args[i];
    }
  }
  
  if (!query) {
    console.error('Usage: node search-direct.js "your query" [--limit 5] [--type report]');
    process.exit(1);
  }
  
  try {
    await client.connect();
    const results = await searchDocuments(client, query, { limit, docType });
    displayResults(results);
    
    // Output JSON for programmatic use
    if (process.env.OUTPUT_JSON) {
      console.log('\n📋 JSON Output:');
      console.log(JSON.stringify(results, null, 2));
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
