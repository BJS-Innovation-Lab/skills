#!/usr/bin/env node
/**
 * Risk Check (Local Version)
 * 
 * Checks if a proposed action is similar to past corrections.
 * Uses local JSON database instead of Supabase.
 * 
 * Usage: node risk-check-local.cjs "git push origin main"
 * 
 * Exit codes:
 *   0 = low risk
 *   1 = medium risk
 *   2 = high risk
 *   3 = error
 */

const fs = require('fs');
const path = require('path');
const { searchCorrections, getStats } = require('./local-db.cjs');

// Thresholds
const HIGH_RISK_THRESHOLD = 0.75;
const MEDIUM_RISK_THRESHOLD = 0.5;

// External effect patterns
const EXTERNAL_PATTERNS = [
  /git\s+(push|add\s+\.)/i,
  /curl\s+.*-X\s*(POST|PUT|DELETE|PATCH)/i,
  /send.*message/i,
  /email|mail\s+send/i,
  /api.*call/i,
  /config\s*\.\s*(apply|patch)/i,
  /rm\s+-rf?/i,
  /deploy/i,
  /publish/i,
  /release/i,
];

// Generate embedding using Gemini
async function getEmbedding(text) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  let apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
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

function checkExternalEffect(action) {
  return EXTERNAL_PATTERNS.some(pattern => pattern.test(action));
}

async function assessRisk(action) {
  const stats = getStats();
  
  // If no corrections in DB, fall back to pattern matching only
  if (stats.with_embeddings === 0) {
    const external = checkExternalEffect(action);
    return {
      risk: external ? 'medium' : 'low',
      reason: external ? 'External effect detected (no corrections in DB yet)' : 'No corrections in database',
      correction_id: null,
      similarity: null,
      external_effect: external,
      db_empty: true
    };
  }
  
  let embedding;
  try {
    embedding = await getEmbedding(action);
  } catch (e) {
    // Fall back to pattern matching
    const external = checkExternalEffect(action);
    return {
      risk: external ? 'medium' : 'low',
      reason: `Embedding failed: ${e.message}`,
      external_effect: external,
      embedding_failed: true
    };
  }
  
  // Search for similar corrections
  const matches = searchCorrections(embedding, MEDIUM_RISK_THRESHOLD, 3);
  const hasExternalEffect = checkExternalEffect(action);
  
  // Assess risk
  let risk = 'low';
  let reasons = [];
  let topMatch = null;
  
  if (matches.length > 0) {
    topMatch = matches[0];
    
    if (topMatch.similarity >= HIGH_RISK_THRESHOLD) {
      risk = 'high';
      reasons.push(`Very similar to ${topMatch.id} (${(topMatch.similarity * 100).toFixed(0)}%): ${topMatch.summary?.slice(0, 80)}`);
    } else {
      risk = 'medium';
      reasons.push(`Somewhat similar to ${topMatch.id} (${(topMatch.similarity * 100).toFixed(0)}%)`);
    }
  }
  
  if (hasExternalEffect && risk === 'low') {
    risk = 'medium';
    reasons.push('External effect detected');
  }
  
  return {
    risk,
    reason: reasons.join('; ') || 'No risk signals detected',
    correction_id: topMatch?.id || null,
    similarity: topMatch?.similarity || null,
    external_effect: hasExternalEffect,
    matches_found: matches.length
  };
}

// Format output for injection into agent context
function formatWarning(result) {
  if (result.risk === 'high') {
    return `⚠️ HIGH RISK: ${result.reason}. Review correction before proceeding.`;
  } else if (result.risk === 'medium') {
    return `⚡ Caution: ${result.reason}`;
  }
  return null;
}

async function main() {
  const action = process.argv[2];
  
  if (!action) {
    console.error('Usage: node risk-check-local.cjs "action description"');
    console.error('\nExample: node risk-check-local.cjs "git push to shared repo"');
    process.exit(3);
  }
  
  try {
    const result = await assessRisk(action);
    
    // Output JSON result
    console.log(JSON.stringify(result, null, 2));
    
    // Also output human-readable warning if applicable
    const warning = formatWarning(result);
    if (warning) {
      console.error('\n' + warning);
    }
    
    // Exit code reflects risk level
    if (result.risk === 'high') process.exit(2);
    if (result.risk === 'medium') process.exit(1);
    process.exit(0);
  } catch (e) {
    console.error('Risk check failed:', e.message);
    process.exit(3);
  }
}

main();

module.exports = { assessRisk, formatWarning };
