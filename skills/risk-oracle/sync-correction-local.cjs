#!/usr/bin/env node
/**
 * Sync Corrections to Local Database
 * 
 * Reads corrections from markdown, embeds them, stores locally.
 * 
 * Usage: 
 *   node sync-correction-local.cjs path/to/correction.md
 *   node sync-correction-local.cjs --all
 */

const fs = require('fs');
const path = require('path');
const { upsertCorrection, getStats } = require('./local-db.cjs');

const CORRECTIONS_DIR = path.join(process.env.HOME, '.openclaw/workspace/memory/learning/corrections');

// Parse YAML-ish frontmatter from markdown
function parseCorrection(content) {
  // Handle multiple corrections in one file (separated by ---)
  const sections = content.split(/\n---\n/).filter(s => s.includes('type: correction') || s.includes('type:correction'));
  
  return sections.map(section => {
    const correction = {};
    const lines = section.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (match) {
        correction[match[1]] = match[2].trim();
      }
    }
    
    return correction;
  }).filter(c => c.type === 'correction' || c.corrected_to);
}

// Generate embedding using Gemini
async function getEmbedding(text) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  // Try to load API key from various locations
  let apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Try loading from research-intelligence .env
    const envPath = path.join(process.env.HOME, '.openclaw/workspace/skills/research-intelligence/.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim();
    }
  }
  
  if (!apiKey) {
    throw new Error('No GOOGLE_API_KEY found');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Create searchable text from correction
function correctionToText(correction) {
  const parts = [
    correction.prior_belief && `Prior belief: ${correction.prior_belief}`,
    correction.corrected_to && `Corrected to: ${correction.corrected_to}`,
    correction.context && `Context: ${correction.context}`,
    correction.behavioral_change && `Behavioral change: ${correction.behavioral_change}`,
  ].filter(Boolean);
  
  return parts.join('\n');
}

async function syncFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const corrections = parseCorrection(content);
  
  if (corrections.length === 0) {
    console.log('  No corrections found in file');
    return [];
  }
  
  const results = [];
  
  for (const correction of corrections) {
    const id = correction.id || `COR-${path.basename(filePath, '.md')}-${Date.now()}`;
    const text = correctionToText(correction);
    
    if (!text || text.length < 10) {
      console.log(`  Skipping ${id}: no meaningful text`);
      continue;
    }
    
    try {
      console.log(`  Embedding ${id}...`);
      const embedding = await getEmbedding(text);
      
      upsertCorrection({
        id,
        summary: correction.corrected_to || text.slice(0, 200),
        prior_belief: correction.prior_belief,
        corrected_to: correction.corrected_to,
        context: correction.context,
        stakes: correction.stakes || 'medium',
        source_file: filePath,
        embedding
      });
      
      console.log(`  ✅ Synced: ${id}`);
      results.push({ id, status: 'synced' });
    } catch (e) {
      console.error(`  ❌ Failed ${id}:`, e.message);
      results.push({ id, status: 'failed', error: e.message });
    }
  }
  
  return results;
}

async function syncAll() {
  const files = fs.readdirSync(CORRECTIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(CORRECTIONS_DIR, f));
  
  console.log(`Found ${files.length} correction files\n`);
  
  const allResults = [];
  for (const file of files) {
    const results = await syncFile(file);
    allResults.push(...results);
  }
  
  const synced = allResults.filter(r => r.status === 'synced').length;
  const failed = allResults.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Summary: ${synced} synced, ${failed} failed`);
  console.log(getStats());
  
  return allResults;
}

async function main() {
  const arg = process.argv[2];
  
  if (!arg) {
    console.error('Usage: node sync-correction-local.cjs <file.md | --all>');
    process.exit(1);
  }
  
  if (arg === '--all') {
    await syncAll();
  } else {
    await syncFile(arg);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
