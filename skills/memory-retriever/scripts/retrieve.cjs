#!/usr/bin/env node
/**
 * Memory Retriever — Pre-built query builder for common memory searches.
 * 
 * Usage:
 *   node retrieve.cjs --type general --query "Santos role change"
 *   node retrieve.cjs --type a2a --query "what did Saber say about memory"
 *   node retrieve.cjs --type learning --query "A2A daemon fixes"
 *   node retrieve.cjs --type team-status
 *   node retrieve.cjs --type briefing --query "Café Bonito"
 *   node retrieve.cjs --type multihop --query "Is Santos ready to provision?"
 *   node retrieve.cjs --type contradictions --query "Santos has org tokens"
 *   node retrieve.cjs --type gaps --query "last week"
 * 
 * Output: A formatted prompt ready to pass to sessions_spawn()
 */

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    flags[key] = args[i + 1] || true;
    i++;
  }
}

const type = flags.type || 'general';
const query = flags.query || '';
const days = parseInt(flags.days) || 7;
const workspace = flags.workspace || process.env.WORKSPACE || '~/.openclaw/workspace';

// Generate date range for file scanning
const now = new Date();
const dateFiles = [];
for (let d = 0; d < days; d++) {
  const date = new Date(now - d * 86400000);
  const ymd = date.toISOString().split('T')[0];
  dateFiles.push(`memory/${ymd}.md`);
  dateFiles.push(`memory/${ymd}-*.md`);
}

const templates = {
  general: `Search my memory files for information about: "${query}"

Files to check (most recent first):
${dateFiles.map(f => `- ${f}`).join('\n')}
- memory/core/*.md
- memory/working/*.md
- MEMORY.md

Instructions:
1. Read each file that exists (skip missing files silently)
2. Find ALL mentions of the topic
3. Reason about relevance — don't return everything, just what matters

Return format:
## Answer
[2-3 sentence direct answer]

## Key Details
- [bullet 1]
- [bullet 2]
- [max 5 bullets]

## Sources
- [filename#line: brief quote]

## Confidence
[HIGH/MEDIUM/LOW] — [why]`,

  a2a: `Search A2A communication logs for messages about: "${query}"

Files to check:
${dateFiles.map(f => `- ${f}`).join('\n')}
- memory/a2a-*.md
- memory/working/threads/*.md

Instructions:
1. Find all A2A messages mentioning the topic
2. Note WHO said WHAT and WHEN
3. Track any commitments, promises, or action items
4. Determine current status (resolved/pending/blocked)

Return format:
## Timeline
[date] **Agent**: summary of what they said

## Commitments & Action Items
- [ ] or [x] item — owner — status

## Current Status
[resolved/pending/blocked] — [explanation]

## Sources
- [filename#line]

## Confidence
[HIGH/MEDIUM/LOW]`,

  learning: `Search the learning system for entries relevant to: "${query}"

Files to check:
- memory/learning/corrections/*.md
- memory/learning/insights/*.md
- memory/learning/outcomes/*.md

Instructions:
1. Find corrections (past mistakes) relevant to this topic
2. Find insights that could apply
3. Find outcomes showing what worked/didn't
4. Prioritize by recency and relevance

Return format:
## Relevant Corrections (things to avoid)
- COR-ID: [summary]

## Relevant Insights (things to apply)
- INS-ID: [summary]

## Outcome Patterns
- OUT-ID: [what happened]

## Recommendation
[Based on learning history, here's what to do/avoid]

Max 5 entries total. Most relevant first.`,

  'team-status': `Compile current team status from available memory files.

Files to check:
- memory/team-highlights.md
- memory/a2a-*.md (last 24h only)
- memory/working/*.md
- ${dateFiles[0]}
- ${dateFiles[1]}

Instructions:
1. Find last known activity for each team member
2. Note what they're working on
3. Flag any blockers or issues
4. Note anyone who hasn't been heard from in >24h

Return format:
## Team Status — ${now.toISOString().split('T')[0]}

| Agent | Last Active | Current Task | Status |
|-------|------------|-------------|--------|
| Santos | ... | ... | 🟢/🟡/🔴 |
| Sam | ... | ... | 🟢/🟡/🔴 |
| Saber | ... | ... | 🟢/🟡/🔴 |
| Sybil | ... | ... | 🟢/🟡/🔴 |
| Sage | ... | ... | 🟢/🟡/🔴 |

## Blockers
- [any blockers found]

## Pending Inter-Agent Items
- [any unanswered messages or pending handoffs]`,

  briefing: `Load all context about: "${query}"

Search ALL memory sources:
${dateFiles.map(f => `- ${f}`).join('\n')}
- memory/core/*.md
- memory/working/*.md
- memory/learning/corrections/*.md
- memory/learning/insights/*.md
- memory/a2a-*.md
- MEMORY.md

Instructions:
1. Find EVERYTHING related to this topic
2. Organize chronologically
3. Extract: decisions made, commitments, preferences, known issues
4. Include brand voice/tone if this is a client

Return format:
## Briefing: ${query}

### Background
[What is this? When did it start?]

### Key Decisions
- [decision — who made it — when]

### Current State
[What's the situation right now?]

### Known Issues / Gotchas
- [issue]

### Preferences / Voice (if applicable)
- [any tone, style, language preferences]

### Action Items
- [ ] [pending items]

Max 500 words.`,

  multihop: `I need deep context on: "${query}"
This requires multi-hop reasoning — don't just do a keyword search.

Phase 1 — Direct search:
Read these files and find mentions of the topic:
${dateFiles.slice(0, 5).map(f => `- ${f}`).join('\n')}
- memory/core/*.md
- memory/working/*.md
- MEMORY.md

Phase 2 — Entity expansion:
From Phase 1, identify related people, projects, dates, tools, decisions.
Search for THOSE entities in files you haven't checked yet.
Follow the threads — one mention may lead to another file.

Phase 3 — Cross-reference:
Check A2A logs (memory/a2a-*.md) for related communications.
Check learning entries for relevant corrections/insights.
Compare sources — flag any contradictions.

Phase 4 — Synthesize:
Return a coherent narrative answering:
1. What happened?
2. What was decided?
3. What's the current state?
4. What should I know before acting?
5. Any contradictions or gaps in the record?

## Confidence
[HIGH/MEDIUM/LOW] — based on source count, recency, consistency

## Gaps
[What's missing from the record that I might need?]

Max 800 words.`,

  contradictions: `Check if this claim contradicts anything in my memory: "${query}"

Search ALL memory sources for claims about this topic:
${dateFiles.map(f => `- ${f}`).join('\n')}
- memory/core/*.md
- memory/working/*.md
- memory/a2a-*.md
- memory/learning/*.md
- MEMORY.md

Return format:
## Claim Being Checked
"${query}"

## Supporting Sources
- [source: what it says that supports this]

## Contradicting Sources
- [source: what it says that conflicts]

## Assessment
[UPDATE (old info superseded) / CORRECTION (someone was wrong) / GENUINE CONFLICT (unresolved disagreement)]

## Recommendation
[Which version to trust and why]`,

  gaps: `Analyze my memory coverage for: "${query}"

Check what I have:
- List all daily log files in memory/
- List all A2A log files
- List all learning entries
- Check MEMORY.md completeness

Return format:
## Coverage Analysis

### Daily Logs
- [dates I have]: ✅
- [dates missing]: ❌

### A2A Logs
- [what I have]
- [gaps detected]

### Learning System
- Corrections: [count]
- Insights: [count]
- Outcomes: [count]
- [any obvious gaps — e.g., corrections without outcomes]

### MEMORY.md
- Last updated: [date]
- Size: [chars] / 3500 limit
- [stale sections detected?]

### Recommendations
1. [what to backfill]
2. [what to prune]
3. [what to update]`
};

const prompt = templates[type];
if (!prompt) {
  console.error(`Unknown type: ${type}`);
  console.error(`Available: ${Object.keys(templates).join(', ')}`);
  process.exit(1);
}

// Model selection: use flag, env var, or default
const defaultModel = 'anthropic/claude-sonnet-4-20250514';
const agentModel = flags.model || process.env.AGENT_MODEL || process.env.DEFAULT_MODEL || defaultModel;

// Output the spawn-ready task
const output = {
  task: prompt,
  label: 'memory-retriever',
  model: agentModel,
  thinking: type === 'multihop' ? 'low' : undefined
};

if (flags.json) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log('=== MEMORY RETRIEVER TASK ===');
  console.log(`Type: ${type}`);
  console.log(`Model: ${output.model}`);
  if (output.thinking) console.log(`Thinking: ${output.thinking}`);
  console.log('=== PROMPT ===');
  console.log(prompt);
}
