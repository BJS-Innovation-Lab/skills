#!/usr/bin/env node
/**
 * Weekly Pattern Extraction
 * 
 * Runs weekly to:
 * 1. Analyze procedure candidates
 * 2. Promote proven patterns to semantic memory
 * 3. Clean up stale candidates
 * 4. Archive old daily logs
 * 
 * Usage: node weekly-patterns.js
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

function analyzePatterns() {
  const candidatesFile = path.join(LEARNING_DIR, 'procedures', 'candidates.json');
  const candidates = safeParseJSON(candidatesFile, []);
  
  const promoted = [];
  const stale = [];
  const active = [];
  
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  for (const candidate of candidates) {
    // Promote if 10+ occurrences
    if (candidate.occurrences >= 10 && candidate.status === 'candidate') {
      candidate.status = 'promoted';
      candidate.promoted_at = today.toISOString();
      promoted.push(candidate);
    }
    // Mark stale if not seen in a week
    else if (candidate.last_seen < weekAgoStr && candidate.status === 'candidate') {
      candidate.status = 'stale';
      stale.push(candidate);
    }
    else {
      active.push(candidate);
    }
  }
  
  // Save updated candidates (only active ones)
  safeWriteJSON(candidatesFile, active);
  
  // Add promoted to semantic memory
  if (promoted.length > 0) {
    const semanticDir = path.join(LEARNING_DIR, 'memory', 'semantic');
    const patternsFile = path.join(semanticDir, 'patterns.json');
    const patterns = safeParseJSON(patternsFile, []);
    
    for (const p of promoted) {
      patterns.push({
        id: `pat_${p.tag}_${Date.now()}`,
        tag: p.tag,
        occurrences: p.occurrences,
        examples: p.examples,
        learned_at: today.toISOString(),
        insight: `Pattern detected: "${p.tag}" appears frequently in decisions`
      });
    }
    
    safeWriteJSON(patternsFile, patterns);
  }
  
  return { promoted: promoted.length, stale: stale.length, active: active.length };
}

function archiveOldLogs() {
  const decisionsDir = path.join(LEARNING_DIR, 'decisions');
  const archiveDir = path.join(LEARNING_DIR, 'archive', 'decisions');
  
  if (!fs.existsSync(decisionsDir)) return { archived: 0 };
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  
  const files = fs.readdirSync(decisionsDir).filter(f => f.endsWith('.json'));
  
  // Archive files older than 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  let archived = 0;
  for (const file of files) {
    const date = file.replace('.json', '');
    if (date < cutoffStr) {
      const src = path.join(decisionsDir, file);
      const dst = path.join(archiveDir, file);
      fs.renameSync(src, dst);
      archived++;
    }
  }
  
  return { archived };
}

function generateWeeklyReport() {
  // Get this week's episodic memories
  const episodicDir = path.join(LEARNING_DIR, 'memory', 'episodic');
  if (!fs.existsSync(episodicDir)) return null;
  
  const files = fs.readdirSync(episodicDir).filter(f => f.endsWith('.json'));
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  
  const thisWeek = files
    .filter(f => f.replace('.json', '') >= weekAgoStr)
    .map(f => safeParseJSON(path.join(episodicDir, f), null))
    .filter(Boolean);
  
  const totalDecisions = thisWeek.reduce((sum, ep) => sum + (ep.decision_count || 0), 0);
  const allTags = {};
  
  for (const ep of thisWeek) {
    if (ep.summary?.by_tag) {
      for (const [tag, count] of Object.entries(ep.summary.by_tag)) {
        allTags[tag] = (allTags[tag] || 0) + count;
      }
    }
  }
  
  const topTags = Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    week_ending: today.toISOString().split('T')[0],
    days_with_data: thisWeek.length,
    total_decisions: totalDecisions,
    top_tags: topTags,
    highlights: thisWeek.flatMap(ep => ep.highlights || []).slice(0, 10)
  };
}

function updateStatus(results) {
  const statusFile = path.join(LEARNING_DIR, 'status.json');
  const status = safeParseJSON(statusFile, { metrics: {} });
  status.metrics = status.metrics || {};
  status.metrics.procedures_candidates = results.patterns.active;
  status.last_weekly_run = new Date().toISOString();
  status.last_updated = new Date().toISOString();
  safeWriteJSON(statusFile, status);
}

function main() {
  console.log('Running weekly pattern extraction...\n');
  
  const patterns = analyzePatterns();
  console.log('Patterns:', patterns);
  
  const archive = archiveOldLogs();
  console.log('Archive:', archive);
  
  const report = generateWeeklyReport();
  console.log('\nWeekly Report:', JSON.stringify(report, null, 2));
  
  // Save report
  const reportsDir = path.join(LEARNING_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportFile = path.join(reportsDir, `week-${report?.week_ending || 'unknown'}.json`);
  safeWriteJSON(reportFile, { patterns, archive, report });
  
  updateStatus({ patterns });
  
  console.log('\nDone!');
}

main();
