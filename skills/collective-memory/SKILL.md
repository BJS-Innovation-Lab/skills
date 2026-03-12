---
name: collective-memory
description: "⚠️ DEPRECATED — Use hive-mind instead. This skill requires tables (syntheses, collective_memories) that don't exist. See skills/hive-mind for the working version."
deprecated: true
metadata:
  {
    "openclaw": {
      "emoji": "🧠",
      "requires": { 
        "env": ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"],
        "npm": ["@supabase/supabase-js"]
      }
    }
  }
---

# Collective Memory

> ## ⚠️ DEPRECATED — DO NOT USE
> 
> This skill has been replaced by **`hive-mind`**.
> 
> **Problem:** This skill requires `syntheses` and `collective_memories` tables that were never created in production.
> 
> **Solution:** Use `skills/hive-mind` instead, which uses the `bjs_knowledge` table (already exists).
> 
> ```bash
> # Use these instead:
> node skills/hive-mind/scripts/hive-query.cjs --recent 7
> node skills/hive-mind/scripts/hive-push.cjs
> node skills/hive-mind/scripts/hive-pull.cjs
> ```

---

*Original description (for reference only):*

A shared memory system for agent teams. Part of the Memory + Learning + Collective Intelligence research.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNTHESIS LAYER                          │
│         Queen Bee analyzes and creates insights             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                 COLLECTIVE MEMORY                           │
│    Shared pool — all agents can read/write (with PII guard) │
└─────────────────────────┬───────────────────────────────────┘
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     Agent 1          Agent 2          Agent 3
```

## Features

- **Share memories** to collective pool
- **PII protection** — automatic detection and redaction
- **Search** across all agents' shared knowledge
- **Validate** memories (increases confidence)
- **Synthesis** — queen bee creates insights from patterns

## Setup

### 1. Environment Variables

```bash
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_KEY="eyJ..."  # Service key for full access
```

### 2. Run Migrations

```bash
# In Supabase SQL editor, run:
# skills/collective-memory/migrations/001_create_tables.sql
```

### 3. Install Dependencies

```bash
cd skills/collective-memory
npm install
```

## Usage

### Share a Memory

```javascript
const collective = require('./collective-memory');

await collective.share(agentId, {
  content: 'When customers mention "urgent", prioritize their request...',
  type: 'learning',
  title: 'Urgent Keyword Priority',
  domain: 'customer_service',
  tags: ['priority', 'keywords']
});
```

### Search Collective

```javascript
const results = await collective.search(agentId, 'how to handle urgent requests');

for (const memory of results.results) {
  console.log(`${memory.title}: ${memory.content}`);
}
```

### Validate a Memory

```javascript
// When a memory was useful
await collective.validate(agentId, memoryId, true);

// When it wasn't helpful
await collective.validate(agentId, memoryId, false);
```

### Synthesize (Queen Bee)

```javascript
const insights = await collective.synthesize({
  days: 7,
  queenBeeId: SYBIL_ID,
  llmCall: async (prompt) => {
    // Your LLM call implementation
    return await llm.complete(prompt);
  }
});

console.log(`Created ${insights.syntheses_created} new insights`);
```

### Audit for PII

```javascript
const auditResult = await collective.audit({
  days: 7,
  llmCall: myLlmFunction
});

console.log(`Scanned: ${auditResult.scanned}`);
console.log(`Quarantined: ${auditResult.quarantined}`);
```

## PII Protection

All memories are scanned before entering the collective:

1. **Pattern detection** — emails, phones, SSNs, API keys, etc.
2. **Semantic detection** — LLM identifies contextual PII
3. **Automatic redaction** — sensitive data replaced with `[REDACTED]`
4. **Quarantine** — high-risk content held for review

### Use PII Guard Directly

```javascript
const { scanForPII, redactPII } = require('./pii-guard');

// Scan text
const scan = await scanForPII(text, { llmCall });
if (!scan.clean) {
  console.log('Found:', scan.pattern_scan.pii_found);
}

// Redact text
const { redacted_text } = redactPII(text);
```

## Memory Types

| Type | Shareable | Description |
|------|-----------|-------------|
| `learning` | ✅ | Something learned from experience |
| `pattern` | ✅ | Observed pattern across interactions |
| `technique` | ✅ | Effective approach to a problem |
| `warning` | ✅ | Pitfall to avoid |
| `customer_interaction` | ❌ | Contains customer data |
| `credential_used` | ❌ | Contains secrets |

## Confidence Scoring

- New memories start at `0.5` confidence
- Each validation: `+0.1` (useful) or `-0.1` (not useful)
- Range: `0.0` to `1.0`
- Default search threshold: `0.3`

## Queen Bee Synthesis

The synthesis process:

1. Fetch recent collective memories (default: 7 days)
2. Group by domain/type
3. For each group, ask LLM to find patterns
4. Store valid patterns as `syntheses`
5. Syntheses can be validated by other agents

### Synthesis Types

| Type | Description |
|------|-------------|
| `pattern` | Recurring observation |
| `principle` | General rule derived from examples |
| `warning` | Common pitfall identified |
| `technique` | Effective approach distilled |
| `theory` | Higher-order insight |

## Files

```
skills/collective-memory/
├── SKILL.md              # This file
├── index.js              # Main API
├── pii-guard.js          # PII detection/redaction
├── package.json          # Dependencies
└── migrations/
    └── 001_create_tables.sql  # Supabase schema
```

## Research Goals

This skill supports the Research North Star:

1. **Memory** — Collective knowledge that persists and grows
2. **Learning** — Validations surface what works
3. **Collective Intelligence** — Synthesis creates knowledge no single agent has

## Next Steps

- [ ] Add embedding-based semantic search
- [ ] Build confidence decay (old unvalidated memories fade)
- [ ] Implement conflict resolution for contradictions
- [ ] Test with 5 cloud agents
- [ ] Measure learning speed improvements

---

*Part of the Memory + Learning + Collective Intelligence research.*
*Built by Bridget & Sybil, 2026.*
