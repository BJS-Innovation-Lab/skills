#!/usr/bin/env node
/**
 * Local Risk Oracle Database
 * 
 * Simple JSON-based storage with in-memory similarity search.
 * For small correction sets (<100), this is faster than SQLite+vss.
 * 
 * Data stored in: ~/.openclaw/workspace/data/risk-oracle/corrections.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.env.HOME, '.openclaw/workspace/data/risk-oracle');
const DB_FILE = path.join(DATA_DIR, 'corrections.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load database
function loadDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    return { corrections: [], version: 1 };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

// Save database
function saveDB(db) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Add or update a correction
function upsertCorrection(correction) {
  const db = loadDB();
  const existing = db.corrections.findIndex(c => c.id === correction.id);
  
  if (existing >= 0) {
    db.corrections[existing] = { ...db.corrections[existing], ...correction, updated_at: new Date().toISOString() };
  } else {
    db.corrections.push({ ...correction, created_at: new Date().toISOString() });
  }
  
  saveDB(db);
  return correction.id;
}

// Search for similar corrections
function searchCorrections(queryEmbedding, threshold = 0.7, limit = 5) {
  const db = loadDB();
  
  const results = db.corrections
    .filter(c => c.embedding && c.embedding.length > 0)
    .map(c => ({
      ...c,
      similarity: cosineSimilarity(queryEmbedding, c.embedding)
    }))
    .filter(c => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  
  return results;
}

// Get all corrections
function getAllCorrections() {
  const db = loadDB();
  return db.corrections;
}

// Get correction by ID
function getCorrection(id) {
  const db = loadDB();
  return db.corrections.find(c => c.id === id);
}

// Delete correction
function deleteCorrection(id) {
  const db = loadDB();
  db.corrections = db.corrections.filter(c => c.id !== id);
  saveDB(db);
}

// Get stats
function getStats() {
  const db = loadDB();
  return {
    total: db.corrections.length,
    with_embeddings: db.corrections.filter(c => c.embedding).length,
    version: db.version
  };
}

module.exports = {
  upsertCorrection,
  searchCorrections,
  getAllCorrections,
  getCorrection,
  deleteCorrection,
  getStats,
  cosineSimilarity,
  DATA_DIR,
  DB_FILE
};

// CLI interface
if (require.main === module) {
  const cmd = process.argv[2];
  
  switch (cmd) {
    case 'stats':
      console.log(JSON.stringify(getStats(), null, 2));
      break;
    case 'list':
      const all = getAllCorrections();
      all.forEach(c => console.log(`${c.id}: ${c.summary?.slice(0, 60)}...`));
      console.log(`\nTotal: ${all.length} corrections`);
      break;
    default:
      console.log('Usage: node local-db.cjs [stats|list]');
  }
}
