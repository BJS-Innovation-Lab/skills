#!/usr/bin/env node
/**
 * Daily Consolidation
 * 
 * Runs at end of day to:
 * 1. Summarize raw decisions into episodic memory
 * 2. Identify patterns (3+ similar decisions = procedure candidate)
 * 3. Update metrics
 * 
 * Usage: node daily-consolidate.js [--date YYYY-MM-DD]
 */

const fs = require('fs');
const path = require('path');

const LEARNING_DIR = path.join(process.env.HOME, '.openclaw', 'workspace', 'learning');

function safeParseJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultValue;
  }
}

function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Write error:', e.message);
    return false;
  }
}

function getTargetDate() {
  const args = process.argv.slice(2);
  const dateIdx = args.indexOf('--date');
  if (dateIdx !== -1 && args[dateIdx + 1]) {
    return args[dateIdx + 1];
  }
  // Default to yesterday (consolidate previous day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function consolidateDay(date) {
  const decisionsFile = path.join(LEARNING_DIR, 'decisions', `${date}.json`);
  const decisions = safeParseJSON(decisionsFile, []);
  
  if (decisions.length === 0) {
    return { date, decisions: 0, episodic: null, patterns: [] };
  }

  // Group by type
  const byType = {};
  const byTag = {};
  
  for (const dec of decisions) {
    // By type
    byType[dec.type] = byType[dec.type] || [];
    byType[dec.type].push(dec);
    
    // By tag
    if (dec.tags) {
      for (const tag of dec.tags) {
        byTag[tag] = byTag[tag] || [];
        byTag[tag].push(dec);
      }
    }
  }

  // Create episodic summary
  const episodic = {
    id: `ep_${date.replace(/-/g, '')}`,
    date,
    decision_count: decisions.length,
    summary: {
      by_type: Object.fromEntries(
        Object.entries(byType).map(([k, v]) => [k, v.length])
      ),
      by_tag: Object.fromEntries(
        Object.entries(byTag).map(([k, v]) => [k, v.length])
      )
    },
    highlights: decisions
      .filter(d => d.reasoning || d.type === 'learning')
      .slice(0, 5)
      .map(d => ({
        type: d.type,
        context: d.context,
        reasoning: d.reasoning
      })),
    consolidated_at: new Date().toISOString()
  };

  // Save episodic memory
  const episodicDir = path.join(LEARNING_DIR, 'memory', 'episodic');
  const episodicFile = path.join(episodicDir, `${date}.json`);
  safeWriteJSON(episodicFile, episodic);

  // Detect patterns (tags appearing 3+ times)
  const patterns = Object.entries(byTag)
    .filter(([_, v]) => v.length >= 3)
    .map(([tag, items]) => ({
      tag,
      count: items.length,
      contexts: items.map(i => i.context).slice(0, 3)
    }));

  // If patterns found, add to procedure candidates
  if (patterns.length > 0) {
    const candidatesFile = path.join(LEARNING_DIR, 'procedures', 'candidates.json');
    const candidates = safeParseJSON(candidatesFile, []);
    
    for (const pattern of patterns) {
      const existing = candidates.find(c => c.tag === pattern.tag);
      if (existing) {
        existing.occurrences += pattern.count;
        existing.last_seen = date;
        existing.examples = [...new Set([...existing.examples, ...pattern.contexts])].slice(0, 5);
      } else {
        candidates.push({
          tag: pattern.tag,
          occurrences: pattern.count,
          first_seen: date,
          last_seen: date,
          examples: pattern.contexts,
          status: 'candidate'
        });
      }
    }
    
    safeWriteJSON(candidatesFile, candidates);
  }

  return { date, decisions: decisions.length, episodic: episodic.id, patterns };
}

function updateStatus(result) {
  const statusFile = path.join(LEARNING_DIR, 'status.json');
  const status = safeParseJSON(statusFile, { metrics: {} });
  status.metrics = status.metrics || {};
  status.last_consolidation = result.date;
  status.last_updated = new Date().toISOString();
  safeWriteJSON(statusFile, status);
}

function main() {
  const date = getTargetDate();
  console.log(`Consolidating ${date}...`);
  
  const result = consolidateDay(date);
  updateStatus(result);
  
  console.log(JSON.stringify(result, null, 2));
}

main();
