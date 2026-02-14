#!/usr/bin/env node

/**
 * Weekly Learning Digest
 * 
 * Analyzes all decisions, outcomes, and events to extract patterns.
 * Writes to learning/patterns.md
 * 
 * Usage: node weekly-digest.js
 * Recommended: Run weekly via cron
 */

const fs = require('fs');
const path = require('path');

const workspaceDir = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '../../..');
const learningDir = path.join(workspaceDir, 'learning');
const decisionsDir = path.join(learningDir, 'decisions');
const eventsFile = path.join(learningDir, 'events', 'events.jsonl');
const outcomesFile = path.join(decisionsDir, 'outcomes.json');
const patternsFile = path.join(learningDir, 'patterns.md');

function loadAllDecisions() {
  const decisions = [];
  if (!fs.existsSync(decisionsDir)) return decisions;
  
  const files = fs.readdirSync(decisionsDir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort();
  
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(decisionsDir, file), 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(d => decisions.push({ ...d, _file: file }));
      }
    } catch {}
  }
  return decisions;
}

function loadOutcomes() {
  try {
    const data = JSON.parse(fs.readFileSync(outcomesFile, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadEvents() {
  const events = [];
  try {
    const lines = fs.readFileSync(eventsFile, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try { events.push(JSON.parse(line)); } catch {}
    }
  } catch {}
  return events;
}

function analyzePatterns(decisions, outcomes, events) {
  // Group decisions by type
  const byType = {};
  for (const d of decisions) {
    byType[d.type] = byType[d.type] || [];
    byType[d.type].push(d);
  }

  // Group decisions by tag
  const byTag = {};
  for (const d of decisions) {
    for (const tag of (d.tags || [])) {
      byTag[tag] = byTag[tag] || [];
      byTag[tag].push(d);
    }
  }

  // Outcome analysis by tag
  const outcomesByTag = {};
  for (const o of outcomes) {
    for (const tag of (o.decision_tags || [])) {
      outcomesByTag[tag] = outcomesByTag[tag] || [];
      outcomesByTag[tag].push(o);
    }
  }

  // Event analysis
  const eventsByType = {};
  for (const e of events) {
    eventsByType[e.type] = eventsByType[e.type] || [];
    eventsByType[e.type].push(e);
  }

  // Calculate date range
  const dates = decisions.map(d => d.timestamp?.split('T')[0]).filter(Boolean).sort();
  const firstDate = dates[0] || 'unknown';
  const lastDate = dates[dates.length - 1] || 'unknown';

  return { byType, byTag, outcomesByTag, eventsByType, firstDate, lastDate };
}

function generateDigest() {
  const decisions = loadAllDecisions();
  const outcomes = loadOutcomes();
  const events = loadEvents();
  const { byType, byTag, outcomesByTag, eventsByType, firstDate, lastDate } = analyzePatterns(decisions, outcomes, events);

  let md = `# 📊 Learning Patterns Digest\n\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Period:** ${firstDate} to ${lastDate}\n`;
  md += `**Total:** ${decisions.length} decisions, ${outcomes.length} outcomes tracked, ${events.length} events\n\n`;
  md += `---\n\n`;

  // Decision breakdown by type
  md += `## Decision Types\n\n`;
  md += `| Type | Count | % |\n|------|-------|---|\n`;
  const sortedTypes = Object.entries(byType).sort((a, b) => b[1].length - a[1].length);
  for (const [type, items] of sortedTypes) {
    md += `| ${type} | ${items.length} | ${Math.round(items.length / decisions.length * 100)}% |\n`;
  }
  md += `\n`;

  // Top tags
  md += `## Top Tags\n\n`;
  const sortedTags = Object.entries(byTag).sort((a, b) => b[1].length - a[1].length).slice(0, 15);
  md += `| Tag | Decisions | Avg Outcome |\n|-----|-----------|-------------|\n`;
  for (const [tag, items] of sortedTags) {
    const tagOutcomes = outcomesByTag[tag] || [];
    const avgScore = tagOutcomes.length > 0
      ? (tagOutcomes.reduce((s, o) => s + o.score, 0) / tagOutcomes.length).toFixed(1)
      : '—';
    md += `| ${tag} | ${items.length} | ${avgScore} |\n`;
  }
  md += `\n`;

  // Outcome patterns
  if (outcomes.length > 0) {
    md += `## Outcome Patterns\n\n`;
    
    const avgScore = (outcomes.reduce((s, o) => s + o.score, 0) / outcomes.length).toFixed(1);
    const highScorers = outcomes.filter(o => o.score >= 8);
    const lowScorers = outcomes.filter(o => o.score <= 4);
    
    md += `- **Average score:** ${avgScore}/10\n`;
    md += `- **High performers (8+):** ${highScorers.length} (${Math.round(highScorers.length / outcomes.length * 100)}%)\n`;
    md += `- **Low performers (≤4):** ${lowScorers.length} (${Math.round(lowScorers.length / outcomes.length * 100)}%)\n\n`;

    // What works
    if (highScorers.length > 0) {
      md += `### ✅ What Works\n\n`;
      for (const o of highScorers.slice(0, 5)) {
        md += `- **[${o.score}/10]** ${o.decision_context} → ${o.outcome}\n`;
      }
      md += `\n`;
    }

    // What doesn't
    if (lowScorers.length > 0) {
      md += `### ❌ What Doesn't Work\n\n`;
      for (const o of lowScorers.slice(0, 5)) {
        md += `- **[${o.score}/10]** ${o.decision_context} → ${o.outcome}\n`;
      }
      md += `\n`;
    }
  } else {
    md += `## Outcome Patterns\n\nNo outcomes tracked yet. Use \`track-outcome.js\` to score past decisions.\n\n`;
  }

  // Event patterns
  if (events.length > 0) {
    md += `## Event Patterns\n\n`;
    md += `| Type | Count |\n|------|-------|\n`;
    for (const [type, items] of Object.entries(eventsByType).sort((a, b) => b[1].length - a[1].length)) {
      md += `| ${type} | ${items.length} |\n`;
    }
    md += `\n`;
  }

  // Insights (auto-generated)
  md += `## 🧠 Auto-Generated Insights\n\n`;
  
  if (decisions.length < 30) {
    md += `- Still in early data collection (${decisions.length}/30 minimum for pattern detection)\n`;
  }
  
  if (outcomes.length === 0) {
    md += `- **No outcomes tracked!** Start scoring past decisions to enable pattern learning\n`;
  } else if (outcomes.length < decisions.length * 0.3) {
    md += `- Only ${Math.round(outcomes.length / decisions.length * 100)}% of decisions have outcomes — track more for better patterns\n`;
  }

  if (events.length === 0) {
    md += `- **No events logged!** Start logging errors, corrections, and successes\n`;
  }

  // Tag concentration
  if (sortedTags.length > 0) {
    const topTagPct = Math.round(sortedTags[0][1].length / decisions.length * 100);
    if (topTagPct > 40) {
      md += `- Heavy focus on "${sortedTags[0][0]}" (${topTagPct}% of decisions) — consider diversifying\n`;
    }
  }

  // Type balance
  const learningCount = (byType['learning'] || []).length;
  if (learningCount < decisions.length * 0.1) {
    md += `- Low "learning" type decisions (${learningCount}/${decisions.length}) — capture more lessons\n`;
  }

  md += `\n---\n*Generated by weekly-digest.js*\n`;

  return md;
}

// Run
const digest = generateDigest();
console.log(digest);

// Save to file
fs.mkdirSync(path.dirname(patternsFile), { recursive: true });
fs.writeFileSync(patternsFile, digest);
console.error(`\nSaved to: ${patternsFile}`);
