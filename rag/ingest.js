#!/usr/bin/env node
/**
 * RAG Ingestion Script for Sybil
 * Indexes workspace markdown files into Supabase pgvector
 * 
 * Usage: node ingest.js [--file path] [--all]
 * 
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service role key
 *   OPENAI_API_KEY - OpenAI API key for embeddings
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import crypto from 'crypto';

// Config
const WORKSPACE = process.env.WORKSPACE || require('path').resolve(__dirname, '..');
const AGENT_ID = '5fae1839-ab85-412c-acc0-033cbbbbd15b';
const AGENT_NAME = 'Sybil';
const MAX_CONTENT_LENGTH = 8000; // Token-safe limit

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Determine doc type from path
function getDocType(filePath) {
  const relativePath = path.relative(WORKSPACE, filePath);
  
  if (relativePath.startsWith('memory/')) return 'memory';
  if (relativePath.startsWith('.learnings/')) return 'learning';
  if (relativePath.startsWith('notes/')) return 'note';
  if (relativePath.includes('research')) return 'research';
  if (relativePath.includes('report')) return 'report';
  if (relativePath.endsWith('MEMORY.md')) return 'core_memory';
  
  return 'document';
}

// Generate embedding
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, MAX_CONTENT_LENGTH)
  });
  return response.data[0].embedding;
}

// Ingest a single document
async function ingestDocument(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = path.basename(filePath);
    const docType = getDocType(filePath);
    const relativePath = path.relative(WORKSPACE, filePath);
    
    console.log(`📄 Ingesting: ${relativePath} (${docType})`);
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Upsert to Supabase (use file_path as unique key)
    const { data, error } = await supabase
      .from('documents')
      .upsert({
        title,
        content,
        doc_type: docType,
        file_path: relativePath,
        agent_id: AGENT_ID,
        agent_name: AGENT_NAME,
        embedding,
        metadata: {
          size: content.length,
          hash: crypto.createHash('md5').update(content).digest('hex')
        }
      }, {
        onConflict: 'file_path'
      });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Indexed: ${relativePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to ingest ${filePath}: ${err.message}`);
    return false;
  }
}

// Ingest all markdown files
async function ingestAll() {
  const patterns = [
    `${WORKSPACE}/*.md`,
    `${WORKSPACE}/memory/*.md`,
    `${WORKSPACE}/notes/*.md`,
    `${WORKSPACE}/.learnings/*.md`
  ];
  
  let files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    files = files.concat(matches);
  }
  
  // Filter out excluded paths
  files = files.filter(f => {
    const rel = path.relative(WORKSPACE, f);
    return !rel.startsWith('rag/') && 
           !rel.startsWith('node_modules/') && 
           !rel.startsWith('lie-detector/');
  });
  
  console.log(`\n🔍 Found ${files.length} files to ingest\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const result = await ingestDocument(file);
    if (result) success++;
    else failed++;
  }
  
  console.log(`\n📊 Done! Success: ${success}, Failed: ${failed}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ Missing environment variables. Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
    process.exit(1);
  }
  
  if (args.includes('--file')) {
    const fileIdx = args.indexOf('--file');
    const filePath = args[fileIdx + 1];
    if (!filePath) {
      console.error('❌ --file requires a path');
      process.exit(1);
    }
    await ingestDocument(path.resolve(filePath));
  } else {
    await ingestAll();
  }
}

main().catch(console.error);
