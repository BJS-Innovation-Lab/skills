#!/usr/bin/env node
/**
 * surprise-score.cjs — Computes a 0.0–1.0 surprise score for new learning entries
 * 
 * Determines if an insight/correction is novel enough to store in the learning system.
 * Uses four weighted signals:
 *   - Semantic novelty (30%) — Embedding distance from existing entries
 *   - Contradiction detection (30%) — Conflicts with existing knowledge
 *   - Topic novelty (20%) — New subject not seen before
 *   - Correction signal (20%) — Language patterns indicating correction
 * 
 * Usage:
 *   node surprise-score.cjs "Your insight text here"
 *   node surprise-score.cjs --text "Your insight text here"
 *   node surprise-score.cjs --file path/to/entry.md
 *   node surprise-score.cjs --json "Your insight text here"   # JSON output
 *   echo "insight text" | node surprise-score.cjs --stdin
 * 
 * Thresholds (from agentic-learning SKILL.md):
 *   ≥ 0.7  → Always store (genuinely novel)
 *   0.4–0.7 → Store as related-but-distinct, auto-link
 *   < 0.4  → Likely duplicate or evolution of existing — merge or skip
 * 
 * Env (via ../rag/.env):
 *   OPENAI_API_KEY
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Config ──────────────────────────────────────────────────────────
const WORKSPACE = process.env.WORKSPACE || '/Users/sybil/.openclaw/workspace';
const LEARNING_DIR = path.join(WORKSPACE, 'memory/learning');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMS = 1536;

// Signal weights (must sum to 1.0)
const WEIGHTS = {
  semanticNovelty: 0.30,
  contradiction: 0.30,
  topicNovelty: 0.20,
  correctionSignal: 0.20,
};

// Similarity thresholds for classification
const THRESHOLDS = {
  duplicate: 0.85,    // > this = likely duplicate
  evolution: 0.70,    // 0.70–0.85 = same idea evolving
  related: 0.40,      // 0.40–0.70 = related but distinct
  // < 0.40 = genuinely novel
};

// Correction language patterns
const CORRECTION_PATTERNS = [
  /\bno[,.]?\s+(that'?s|it'?s)\s+(not|wrong|incorrect)/i,
  /\bactually[,.]?\s/i,
  /\bthat'?s\s+(wrong|incorrect|outdated|not right)/i,
  /\byou'?re\s+wrong/i,
  /\bi\s+already\s+told\s+you/i,
  /\bnot\s+what\s+I\s+(said|meant|asked)/i,
  /\bcontrary\s+to/i,
  /\bin\s+fact[,.]?\s/i,
  /\bpreviously\s+(believed|thought|assumed)/i,
  /\bmisunderstood/i,
  /\bcorrect(ion|ed)\b/i,
  /\bwas\s+wrong\s+about/i,
  /\bturns?\s+out/i,
  /\bnot\s+true/i,
  /\bopposite\s+of\s+what/i,
];

// Contradiction indicators (negation + assertion patterns)
const CONTRADICTION_PATTERNS = [
  /\bnot\b.*\bshould\b/i,
  /\bdon'?t\b.*\binstead\b/i,
  /\brather\s+than\b/i,
  /\binstead\s+of\b/i,
  /\bwrong\s+approach/i,
  /\bopposite/i,
  /\bcontradicts?\b/i,
  /\bconflicts?\s+with\b/i,
  /\boverwrites?\b/i,
  /\breplaces?\b/i,
  /\bsupersedes?\b/i,
  /\binvalidates?\b/i,
  /\bdisproves?\b/i,
];

// ── Env Loading ─────────────────────────────────────────────────────
function loadEnv() {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}

// ── Embedding API ───────────────────────────────────────────────────
function getEmbedding(text) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return reject(new Error('OPENAI_API_KEY not set'));

    const body = JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // limit input
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.data[0].embedding);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Math Helpers ────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// ── Load Existing Learning Entries ──────────────────────────────────
function loadExistingEntries() {
  const entries = [];
  const dirs = ['corrections', 'insights', 'outcomes'];
  
  for (const dir of dirs) {
    const dirPath = path.join(LEARNING_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      // Split by --- separators to get individual entries
      const blocks = content.split(/^---$/m).filter(b => b.trim());
      
      for (const block of blocks) {
        // Skip header lines (# Corrections — ...)
        if (/^#\s/.test(block.trim())) continue;
        
        // Extract key fields
        const idMatch = block.match(/^id:\s*(.+)$/m);
        const typeMatch = block.match(/^type:\s*(.+)$/m);
        const insightMatch = block.match(/^insight:\s*"?(.+?)"?$/m);
        const correctedMatch = block.match(/^corrected_to:\s*"?(.+?)"?$/m);
        const resultMatch = block.match(/^result:\s*"?(.+?)"?$/m);
        const priorMatch = block.match(/^prior_belief:\s*"?(.+?)"?$/m);
        const tagsMatch = block.match(/^tags:\s*\[(.+)\]$/m);
        const domainMatch = block.match(/^domain:\s*(.+)$/m);
        
        // Build searchable text from the entry
        const searchText = [
          insightMatch?.[1],
          correctedMatch?.[1],
          resultMatch?.[1],
          priorMatch?.[1],
        ].filter(Boolean).join(' ');
        
        if (searchText.length < 10) continue; // skip empty/tiny entries
        
        entries.push({
          id: idMatch?.[1]?.trim() || 'unknown',
          type: typeMatch?.[1]?.trim() || 'unknown',
          text: searchText,
          tags: tagsMatch?.[1]?.split(',').map(t => t.trim().replace(/['"]/g, '')) || [],
          domain: domainMatch?.[1]?.trim() || '',
          raw: block.trim(),
        });
      }
    }
  }
  return entries;
}

// ── Signal 1: Semantic Novelty (30%) ────────────────────────────────
// How different is this from all existing entries?
// 1.0 = completely novel, 0.0 = exact duplicate
function computeSemanticNovelty(inputEmbedding, existingEmbeddings) {
  if (existingEmbeddings.length === 0) return 1.0; // nothing to compare = fully novel
  
  // Find max similarity (closest existing entry)
  let maxSim = 0;
  let closestIdx = -1;
  for (let i = 0; i < existingEmbeddings.length; i++) {
    const sim = cosineSimilarity(inputEmbedding, existingEmbeddings[i].embedding);
    if (sim > maxSim) {
      maxSim = sim;
      closestIdx = i;
    }
  }
  
  // Novelty = 1 - maxSimilarity (inverted: high similarity = low novelty)
  return {
    score: Math.max(0, 1 - maxSim),
    maxSimilarity: maxSim,
    closestEntry: closestIdx >= 0 ? existingEmbeddings[closestIdx].id : null,
  };
}

// ── Signal 2: Contradiction Detection (30%) ─────────────────────────
// Does this contradict existing knowledge?
// Uses both pattern matching and embedding comparison
function computeContradiction(text, inputEmbedding, existingEntries, existingEmbeddings) {
  let patternScore = 0;
  
  // Pattern-based contradiction detection
  let matchCount = 0;
  for (const pattern of CONTRADICTION_PATTERNS) {
    if (pattern.test(text)) matchCount++;
  }
  patternScore = Math.min(1.0, matchCount / 3); // 3+ patterns = max score
  
  // Embedding-based: check if high similarity + negation language
  // High similarity + contradiction patterns = contradicting existing knowledge
  let embeddingContradiction = 0;
  if (existingEmbeddings.length > 0) {
    for (let i = 0; i < existingEmbeddings.length; i++) {
      const sim = cosineSimilarity(inputEmbedding, existingEmbeddings[i].embedding);
      // High similarity (same topic) + contradiction language = likely contradiction
      if (sim > 0.6 && patternScore > 0) {
        embeddingContradiction = Math.max(embeddingContradiction, sim * patternScore);
      }
    }
  }
  
  // Combine: pattern-based (40%) + embedding-based (60%)
  const score = (patternScore * 0.4) + (embeddingContradiction * 0.6);
  
  return {
    score: Math.min(1.0, score),
    patternMatches: matchCount,
    embeddingContradiction,
  };
}

// ── Signal 3: Topic Novelty (20%) ───────────────────────────────────
// Is this about a subject we haven't seen before?
// Compares domain/tags against existing entries
function computeTopicNovelty(text, existingEntries) {
  if (existingEntries.length === 0) return { score: 1.0, reason: 'no existing entries' };
  
  // Extract potential topics from text (simple keyword extraction)
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4); // only meaningful words
  
  // Collect all existing topics
  const existingTopics = new Set();
  for (const entry of existingEntries) {
    for (const tag of entry.tags) existingTopics.add(tag.toLowerCase());
    if (entry.domain) existingTopics.add(entry.domain.toLowerCase());
    // Add significant words from existing entries
    const entryWords = entry.text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4);
    for (const w of entryWords) existingTopics.add(w);
  }
  
  // Count how many input words are NOT in existing topics
  const novelWords = words.filter(w => !existingTopics.has(w));
  const novelRatio = words.length > 0 ? novelWords.length / words.length : 1.0;
  
  return {
    score: Math.min(1.0, novelRatio * 1.5), // scale up slightly (50% novel words = 0.75 score)
    novelWords: novelWords.slice(0, 5),
    totalWords: words.length,
  };
}

// ── Signal 4: Correction Signal (20%) ───────────────────────────────
// Does the text contain correction language?
// Corrections bypass the surprise filter entirely, but the signal still contributes to score
function computeCorrectionSignal(text) {
  let matchCount = 0;
  const matched = [];
  
  for (const pattern of CORRECTION_PATTERNS) {
    if (pattern.test(text)) {
      matchCount++;
      matched.push(pattern.source.slice(0, 30));
    }
  }
  
  // 1 match = 0.5, 2 matches = 0.75, 3+ = 1.0
  const score = matchCount === 0 ? 0 : Math.min(1.0, 0.25 + (matchCount * 0.25));
  
  return {
    score,
    matchCount,
    patterns: matched.slice(0, 3),
    isCorrection: matchCount >= 2, // strong correction signal
  };
}

// ── Classification ──────────────────────────────────────────────────
function classify(surpriseScore, maxSimilarity) {
  if (maxSimilarity > THRESHOLDS.duplicate) {
    return { action: 'skip_or_merge', label: 'DUPLICATE', detail: 'Likely duplicate. Check if it adds new evidence — if yes, merge; if no, skip.' };
  }
  if (maxSimilarity > THRESHOLDS.evolution) {
    return { action: 'merge', label: 'EVOLUTION', detail: 'Same idea evolving. Merge into existing entry\'s evolution field with timestamp.' };
  }
  if (maxSimilarity > THRESHOLDS.related) {
    return { action: 'store_and_link', label: 'RELATED', detail: 'Related but distinct. Store as new entry + auto-link to similar entries.' };
  }
  return { action: 'store', label: 'NOVEL', detail: 'Genuinely novel. Store as new entry.' };
}

// ── Main ────────────────────────────────────────────────────────────
async function computeSurpriseScore(inputText) {
  // 1. Load existing entries
  const existingEntries = loadExistingEntries();
  
  // 2. Get embeddings for input + all existing entries
  const textsToEmbed = [inputText, ...existingEntries.map(e => e.text)];
  
  // Batch embed (max ~20 at a time to avoid API limits)
  const allEmbeddings = [];
  const batchSize = 20;
  for (let i = 0; i < textsToEmbed.length; i += batchSize) {
    const batch = textsToEmbed.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(batch.map(t => getEmbedding(t)));
    allEmbeddings.push(...batchEmbeddings);
  }
  
  const inputEmbedding = allEmbeddings[0];
  const existingEmbeddings = existingEntries.map((e, i) => ({
    ...e,
    embedding: allEmbeddings[i + 1],
  }));
  
  // 3. Compute signals
  const semanticResult = computeSemanticNovelty(inputEmbedding, existingEmbeddings);
  const contradictionResult = computeContradiction(inputText, inputEmbedding, existingEntries, existingEmbeddings);
  const topicResult = computeTopicNovelty(inputText, existingEntries);
  const correctionResult = computeCorrectionSignal(inputText);
  
  // 4. Weighted combination
  const surpriseScore = 
    (semanticResult.score * WEIGHTS.semanticNovelty) +
    (contradictionResult.score * WEIGHTS.contradiction) +
    (topicResult.score * WEIGHTS.topicNovelty) +
    (correctionResult.score * WEIGHTS.correctionSignal);
  
  // 5. Classification
  const classification = classify(surpriseScore, semanticResult.maxSimilarity);
  
  return {
    score: Math.round(surpriseScore * 1000) / 1000,
    classification,
    signals: {
      semanticNovelty: {
        score: Math.round(semanticResult.score * 1000) / 1000,
        weight: WEIGHTS.semanticNovelty,
        maxSimilarity: Math.round(semanticResult.maxSimilarity * 1000) / 1000,
        closestEntry: semanticResult.closestEntry,
      },
      contradiction: {
        score: Math.round(contradictionResult.score * 1000) / 1000,
        weight: WEIGHTS.contradiction,
        patternMatches: contradictionResult.patternMatches,
      },
      topicNovelty: {
        score: Math.round(topicResult.score * 1000) / 1000,
        weight: WEIGHTS.topicNovelty,
        novelWords: topicResult.novelWords,
      },
      correctionSignal: {
        score: Math.round(correctionResult.score * 1000) / 1000,
        weight: WEIGHTS.correctionSignal,
        isCorrection: correctionResult.isCorrection,
        matchCount: correctionResult.matchCount,
      },
    },
    meta: {
      existingEntries: existingEntries.length,
      thresholds: THRESHOLDS,
      model: EMBEDDING_MODEL,
    },
  };
}

// ── CLI ─────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const stdinMode = args.includes('--stdin');
  const fileIdx = args.indexOf('--file');
  const textIdx = args.indexOf('--text');
  
  let inputText = '';
  
  if (stdinMode) {
    inputText = fs.readFileSync('/dev/stdin', 'utf8').trim();
  } else if (fileIdx >= 0 && args[fileIdx + 1]) {
    inputText = fs.readFileSync(args[fileIdx + 1], 'utf8').trim();
  } else if (textIdx >= 0 && args[textIdx + 1]) {
    inputText = args[textIdx + 1];
  } else {
    // Take first non-flag argument
    inputText = args.filter(a => !a.startsWith('--')).join(' ');
  }
  
  if (!inputText) {
    console.error('Usage: node surprise-score.cjs "Your insight text here"');
    console.error('       node surprise-score.cjs --file path/to/entry.md');
    console.error('       echo "text" | node surprise-score.cjs --stdin');
    process.exit(1);
  }
  
  try {
    const result = await computeSurpriseScore(inputText);
    
    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Human-readable output
      const { score, classification, signals } = result;
      console.log(`\n# Surprise Score: ${score.toFixed(3)} — ${classification.label}`);
      console.log(`${classification.detail}\n`);
      console.log('## Signals');
      console.log(`  Semantic Novelty:    ${signals.semanticNovelty.score.toFixed(3)} (×${signals.semanticNovelty.weight}) | closest sim: ${signals.semanticNovelty.maxSimilarity.toFixed(3)}${signals.semanticNovelty.closestEntry ? ` [${signals.semanticNovelty.closestEntry}]` : ''}`);
      console.log(`  Contradiction:       ${signals.contradiction.score.toFixed(3)} (×${signals.contradiction.weight}) | ${signals.contradiction.patternMatches} pattern matches`);
      console.log(`  Topic Novelty:       ${signals.topicNovelty.score.toFixed(3)} (×${signals.topicNovelty.weight})${signals.topicNovelty.novelWords.length > 0 ? ` | novel: ${signals.topicNovelty.novelWords.join(', ')}` : ''}`);
      console.log(`  Correction Signal:   ${signals.correctionSignal.score.toFixed(3)} (×${signals.correctionSignal.weight}) | ${signals.correctionSignal.isCorrection ? '⚠️ CORRECTION DETECTED' : 'no correction'}`);
      console.log(`\nCompared against ${result.meta.existingEntries} existing entries.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
}

main();
