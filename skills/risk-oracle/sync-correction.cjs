#!/usr/bin/env node
/**
 * Sync Correction to Supabase
 * 
 * Reads a correction from markdown, embeds it, stores in Supabase.
 * Called after writing a correction to memory/learning/corrections/
 * 
 * Usage: 
 *   node sync-correction.cjs path/to/correction.md
 *   node sync-correction.cjs --all  # sync all corrections
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../rag/.env') });

const CORRECTIONS_DIR = path.join(process.env.HOME, '.openclaw/workspace/memory/learning/corrections');

// Parse YAML frontmatter from markdown
function parseCorrection(content) {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!yamlMatch) return null;
  
  const yaml = yamlMatch[1];
  const correction = {};
  
  // Simple YAML parsing for our known fields
  const lines = yaml.split('\n');
  let currentKey = null;
  
  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value && value !== '|') {
        // Remove quotes if present
        correction[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    } else if (currentKey && line.startsWith('  ')) {
      // Multi-line value continuation
      correction[currentKey] = (correction[currentKey] || '') + ' ' + line.trim();
    }
  }
  
  return correction;
}

// Generate embedding using Gemini
async function getEmbedding(text) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
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

async function syncCorrection(filePath, supabase) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // File might have multiple corrections separated by ---
  const sections = content.split(/\n---\n/).filter(s => s.includes('type: correction'));
  
  const results = [];
  
  for (const section of sections) {
    const correction = parseCorrection('---\n' + section + '\n---');
    if (!correction || correction.type !== 'correction') continue;
    
    const id = correction.id || `COR-${path.basename(filePath, '.md')}-${Date.now()}`;
    const text = correctionToText(correction);
    
    if (!text) {
      console.warn(`Skipping ${id}: no searchable text`);
      continue;
    }
    
    try {
      const embedding = await getEmbedding(text);
      
      const { error } = await supabase
        .from('corrections')
        .upsert({
          id,
          summary: correction.corrected_to || text.slice(0, 200),
          prior_belief: correction.prior_belief,
          corrected_to: correction.corrected_to,
          context: correction.context,
          stakes: correction.stakes || 'medium',
          source_file: filePath,
          embedding,
          synced_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) throw error;
      
      console.log(`✅ Synced: ${id}`);
      results.push({ id, status: 'synced' });
    } catch (e) {
      console.error(`❌ Failed to sync ${id}:`, e.message);
      results.push({ id, status: 'failed', error: e.message });
    }
  }
  
  return results;
}

async function syncAllCorrections(supabase) {
  const files = fs.readdirSync(CORRECTIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(CORRECTIONS_DIR, f));
  
  console.log(`Found ${files.length} correction files`);
  
  const allResults = [];
  for (const file of files) {
    console.log(`\nProcessing: ${path.basename(file)}`);
    const results = await syncCorrection(file, supabase);
    allResults.push(...results);
  }
  
  const synced = allResults.filter(r => r.status === 'synced').length;
  const failed = allResults.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Summary: ${synced} synced, ${failed} failed`);
  return allResults;
}

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  const arg = process.argv[2];
  
  if (!arg) {
    console.error('Usage: node sync-correction.cjs <file.md | --all>');
    process.exit(1);
  }
  
  if (arg === '--all') {
    await syncAllCorrections(supabase);
  } else {
    await syncCorrection(arg, supabase);
  }
}

main().catch(console.error);

module.exports = { syncCorrection, parseCorrection };
