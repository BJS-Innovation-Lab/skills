#!/usr/bin/env node
/**
 * Frustration Detector
 * 
 * Tracks failed actions and warns when attempting something that failed before.
 * Implements the "frustration" emotional trigger for memory.
 * 
 * Usage:
 *   Log a failure:  node frustration-detector.cjs log "action" "error message"
 *   Check action:   node frustration-detector.cjs check "proposed action"
 *   List failures:  node frustration-detector.cjs list
 *   Stats:          node frustration-detector.cjs stats
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DATA_DIR = path.join(process.env.HOME, '.openclaw/workspace/data/risk-oracle');
const FAILURES_FILE = path.join(DATA_DIR, 'failures.json');

// Load API key
function getApiKey() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/GOOGLE_API_KEY=(.+)/);
    if (match) return match[1].trim();
  }
  return process.env.GOOGLE_API_KEY;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load failures database
function loadFailures() {
  ensureDataDir();
  if (!fs.existsSync(FAILURES_FILE)) {
    return { failures: [], version: 1 };
  }
  return JSON.parse(fs.readFileSync(FAILURES_FILE, 'utf-8'));
}

// Save failures database
function saveFailures(db) {
  ensureDataDir();
  fs.writeFileSync(FAILURES_FILE, JSON.stringify(db, null, 2));
}

// Cosine similarity
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Get embedding
async function getEmbedding(text) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No GOOGLE_API_KEY found');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Log a failed action
async function logFailure(action, error) {
  const db = loadFailures();
  
  console.log('Embedding failure...');
  const embedding = await getEmbedding(`Action: ${action}\nError: ${error}`);
  
  const failure = {
    id: `FAIL-${Date.now()}`,
    action,
    error,
    embedding,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  db.failures.push(failure);
  
  // Keep last 100 failures
  if (db.failures.length > 100) {
    db.failures = db.failures.slice(-100);
  }
  
  saveFailures(db);
  
  // Check if this is a repeat failure
  const similar = findSimilarFailures(db, embedding, failure.id);
  
  if (similar.length > 0) {
    console.log(`\n⚠️ REPEAT FAILURE DETECTED!`);
    console.log(`You've failed at similar actions ${similar.length} time(s) before:`);
    similar.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.action.slice(0, 60)}... (${f.similarity.toFixed(0)}% similar)`);
      console.log(`     Error: ${f.error.slice(0, 80)}...`);
    });
    console.log(`\n💡 Consider a different approach before retrying.`);
    return { repeat: true, count: similar.length + 1, similar };
  }
  
  console.log(`✅ Failure logged: ${failure.id}`);
  return { repeat: false, id: failure.id };
}

// Find similar past failures
function findSimilarFailures(db, embedding, excludeId = null, threshold = 0.7) {
  return db.failures
    .filter(f => f.id !== excludeId && f.embedding)
    .map(f => ({
      ...f,
      similarity: cosineSimilarity(embedding, f.embedding)
    }))
    .filter(f => f.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

// Check if proposed action is similar to past failures
async function checkAction(action) {
  const db = loadFailures();
  
  if (db.failures.length === 0) {
    console.log(JSON.stringify({ 
      frustrated: false, 
      reason: 'No failure history yet',
      failures_count: 0 
    }, null, 2));
    return { frustrated: false };
  }
  
  console.error('Checking against failure history...');
  const embedding = await getEmbedding(`Action: ${action}`);
  
  const similar = findSimilarFailures(db, embedding);
  
  if (similar.length > 0) {
    const result = {
      frustrated: true,
      reason: `Similar to ${similar.length} past failure(s)`,
      failures: similar.map(f => ({
        action: f.action.slice(0, 100),
        error: f.error.slice(0, 100),
        similarity: Math.round(f.similarity * 100),
        when: f.timestamp
      }))
    };
    
    console.log(JSON.stringify(result, null, 2));
    
    // Human readable warning to stderr
    console.error(`\n😤 FRUSTRATION WARNING`);
    console.error(`This action is similar to ${similar.length} past failure(s).`);
    console.error(`Top match (${Math.round(similar[0].similarity * 100)}%): ${similar[0].action.slice(0, 60)}...`);
    console.error(`Error was: ${similar[0].error.slice(0, 80)}...`);
    console.error(`\n💡 Try a different approach or review what went wrong.`);
    
    return result;
  }
  
  const result = { 
    frustrated: false, 
    reason: 'No similar past failures',
    failures_checked: db.failures.length 
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// List recent failures
function listFailures(limit = 10) {
  const db = loadFailures();
  const recent = db.failures.slice(-limit).reverse();
  
  console.log(`Recent failures (${recent.length} of ${db.failures.length} total):\n`);
  
  recent.forEach((f, i) => {
    const age = Math.round((Date.now() - new Date(f.timestamp).getTime()) / (1000 * 60 * 60));
    console.log(`${i + 1}. [${f.id}] ${age}h ago`);
    console.log(`   Action: ${f.action.slice(0, 70)}...`);
    console.log(`   Error: ${f.error.slice(0, 70)}...`);
    console.log('');
  });
}

// Get stats
function getStats() {
  const db = loadFailures();
  const now = Date.now();
  
  const last24h = db.failures.filter(f => 
    now - new Date(f.timestamp).getTime() < 24 * 60 * 60 * 1000
  ).length;
  
  const last7d = db.failures.filter(f => 
    now - new Date(f.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;
  
  console.log(JSON.stringify({
    total_failures: db.failures.length,
    last_24h: last24h,
    last_7d: last7d,
    oldest: db.failures[0]?.timestamp || null,
    newest: db.failures[db.failures.length - 1]?.timestamp || null
  }, null, 2));
}

// Main CLI
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  switch (cmd) {
    case 'log':
      if (args.length < 2) {
        console.error('Usage: node frustration-detector.cjs log "action" "error"');
        process.exit(1);
      }
      await logFailure(args[0], args[1]);
      break;
      
    case 'check':
      if (args.length < 1) {
        console.error('Usage: node frustration-detector.cjs check "proposed action"');
        process.exit(1);
      }
      const result = await checkAction(args[0]);
      process.exit(result.frustrated ? 1 : 0);
      break;
      
    case 'list':
      listFailures(parseInt(args[0]) || 10);
      break;
      
    case 'stats':
      getStats();
      break;
      
    default:
      console.log(`Frustration Detector - Track and warn about repeated failures

Usage:
  node frustration-detector.cjs log "action" "error"   Log a failure
  node frustration-detector.cjs check "action"         Check before retrying
  node frustration-detector.cjs list [n]               List recent failures
  node frustration-detector.cjs stats                  Show statistics

Exit codes for 'check':
  0 = No similar failures (proceed)
  1 = Similar past failures found (frustrated)
`);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(2);
});

module.exports = { logFailure, checkAction, findSimilarFailures };
