#!/usr/bin/env node
/**
 * Risk Oracle — Pre-action risk assessment
 * 
 * Checks:
 * 1. Embedding similarity to past corrections
 * 2. Whether action type is novel (never seen)
 * 3. Whether action has external effects
 * 
 * Usage: node risk-check.cjs "action description" [--type shell|api|file]
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../rag/.env') });

// Thresholds
const CORRECTION_SIMILARITY_THRESHOLD = 0.75;
const NOVELTY_THRESHOLD = 0.5; // Below this = novel

// External effect patterns
const EXTERNAL_PATTERNS = [
  /git\s+(push|commit|add)/i,
  /curl\s+.*POST|PUT|DELETE/i,
  /send.*message/i,
  /email|mail/i,
  /api.*call/i,
  /config\s*\.\s*(apply|patch)/i,
  /rm\s+-rf?/i,
  /deploy/i,
];

async function getEmbedding(text) {
  // Use Gemini embedding (same as our memory system)
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function checkCorrectionSimilarity(supabase, actionEmbedding) {
  // Search corrections table for similar entries
  const { data, error } = await supabase.rpc('match_corrections', {
    query_embedding: actionEmbedding,
    match_threshold: CORRECTION_SIMILARITY_THRESHOLD,
    match_count: 3
  });
  
  if (error || !data?.length) return null;
  
  return {
    correction_id: data[0].id,
    similarity: data[0].similarity,
    summary: data[0].summary
  };
}

async function checkNovelty(supabase, actionEmbedding) {
  // Search action history for similar past actions
  const { data, error } = await supabase.rpc('match_actions', {
    query_embedding: actionEmbedding,
    match_threshold: NOVELTY_THRESHOLD,
    match_count: 1
  });
  
  // If no similar actions found, this is novel
  return !data?.length;
}

function checkExternalEffect(action) {
  return EXTERNAL_PATTERNS.some(pattern => pattern.test(action));
}

async function assessRisk(action) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Get embedding for the proposed action
  let embedding;
  try {
    embedding = await getEmbedding(action);
  } catch (e) {
    // If embedding fails, fall back to pattern matching only
    const external = checkExternalEffect(action);
    return {
      risk: external ? 'medium' : 'low',
      reason: external ? 'External effect detected (pattern match)' : 'No risk signals',
      novel: true,
      external_effect: external,
      embedding_failed: true
    };
  }
  
  // Run all checks in parallel
  const [correctionMatch, isNovel, hasExternalEffect] = await Promise.all([
    checkCorrectionSimilarity(supabase, embedding).catch(() => null),
    checkNovelty(supabase, embedding).catch(() => true),
    Promise.resolve(checkExternalEffect(action))
  ]);
  
  // Assess risk level
  let risk = 'low';
  let reasons = [];
  
  if (correctionMatch) {
    risk = 'high';
    reasons.push(`Similar to ${correctionMatch.correction_id}: ${correctionMatch.summary}`);
  }
  
  if (isNovel && hasExternalEffect) {
    risk = risk === 'high' ? 'high' : 'medium';
    reasons.push('Novel action with external effect');
  } else if (hasExternalEffect) {
    risk = risk === 'low' ? 'medium' : risk;
    reasons.push('External effect detected');
  }
  
  return {
    risk,
    reason: reasons.join('; ') || 'No risk signals',
    correction_id: correctionMatch?.correction_id || null,
    novel: isNovel,
    external_effect: hasExternalEffect
  };
}

// CLI interface
async function main() {
  const action = process.argv[2];
  if (!action) {
    console.error('Usage: node risk-check.cjs "action description"');
    process.exit(1);
  }
  
  try {
    const result = await assessRisk(action);
    console.log(JSON.stringify(result, null, 2));
    
    // Exit code reflects risk level for shell scripting
    if (result.risk === 'high') process.exit(2);
    if (result.risk === 'medium') process.exit(1);
    process.exit(0);
  } catch (e) {
    console.error('Risk check failed:', e.message);
    process.exit(3);
  }
}

main();

module.exports = { assessRisk };
