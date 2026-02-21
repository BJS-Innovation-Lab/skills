#!/usr/bin/env node
/**
 * RAG Search Script for Sybil
 * Searches indexed documents using semantic similarity
 * 
 * Usage: node search.js "your query here" [--limit 5] [--type report]
 * 
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key
 *   OPENAI_API_KEY - OpenAI API key for embeddings
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const AGENT_ID = '5fae1839-ab85-412c-acc0-033cbbbbd15b';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

// Search documents
async function searchDocuments(query, options = {}) {
  const { limit = 5, docType = null, threshold = 0.7 } = options;
  
  console.log(`\n🔍 Searching for: "${query}"\n`);
  
  // Generate query embedding
  const embedding = await generateEmbedding(query);
  
  // Call search function
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_agent_id: AGENT_ID,
    filter_doc_type: docType
  });
  
  if (error) {
    console.error(`❌ Search error: ${error.message}`);
    return [];
  }
  
  return data;
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
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ Missing environment variables. Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
    process.exit(1);
  }
  
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
    console.error('Usage: node search.js "your query" [--limit 5] [--type report]');
    process.exit(1);
  }
  
  const results = await searchDocuments(query, { limit, docType });
  displayResults(results);
  
  // Output JSON for programmatic use
  if (process.env.OUTPUT_JSON) {
    console.log('\n📋 JSON Output:');
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch(console.error);
