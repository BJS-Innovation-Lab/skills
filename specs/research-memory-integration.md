# Research Memory Integration Spec

**Author:** Sybil  
**Date:** 2026-02-13  
**Status:** Draft - Pending Saber's input

---

## Overview

Integrate external research knowledge into agents' semantic memory so insights surface organically during work, not through manual review.

## Goals

1. **Reduce noise**: From 39 papers/day → 2-3 relevant insights per task
2. **Organic integration**: Insights appear naturally during work, like creativity
3. **Source traceability**: Every insight links to its paper
4. **Learning loop**: Track which insights get used

## Architecture

### Integration with Agentic-Learning

Research insights become a **knowledge source** feeding into the existing semantic memory layer:

```
┌─────────────────────────────────────────────┐
│           SEMANTIC MEMORY LAYER             │
│         (agentic-learning system)           │
└─────────────────────────────────────────────┘
                     ▲
     ┌───────────────┼───────────────┐
     │               │               │
 INTERNAL        RESEARCH        SHARED
 (own exp)       (papers)        (team)
```

### Data Flow

```
Daily Scan (8 AM)
     │
     ▼
┌─────────────────┐
│ research_papers │  ← Raw papers (39/day)
└─────────────────┘
     │
     ▼ Distillation (new)
┌──────────────────┐
│ research_insights│  ← Distilled insights (~1-2 per paper)
└──────────────────┘
     │
     ▼ Pre-Decision RAG (existing in agentic-learning)
┌─────────────────┐
│ Agent Context   │  ← Top 2-3 relevant insights injected
└─────────────────┘
```

## Database Schema

### New Table: `research_insights`

```sql
CREATE TABLE research_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to source paper
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  
  -- The distilled insight (1-2 sentences)
  insight TEXT NOT NULL,
  
  -- For relevance matching
  domain_tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),  -- OpenAI ada-002
  
  -- Metadata
  insight_type TEXT DEFAULT 'finding',  -- finding, method, metric, warning
  confidence NUMERIC(3,2) DEFAULT 0.8,
  
  -- Usage tracking
  times_surfaced INTEGER DEFAULT 0,
  times_referenced INTEGER DEFAULT 0,  -- Did agent actually use it?
  last_surfaced_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'Sybil'
);

-- Index for vector similarity search
CREATE INDEX idx_insights_embedding ON research_insights 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for domain filtering
CREATE INDEX idx_insights_domain ON research_insights USING GIN (domain_tags);
```

### View: Papers with Insights

```sql
CREATE VIEW papers_with_insights AS
SELECT 
  p.id,
  p.title,
  p.source,
  p.pdf_url,
  p.relevance_score,
  json_agg(json_build_object(
    'insight', i.insight,
    'type', i.insight_type,
    'times_used', i.times_referenced
  )) as insights
FROM research_papers p
LEFT JOIN research_insights i ON i.paper_id = p.id
GROUP BY p.id;
```

## Components

### 1. Distillation Script (`scripts/distill-insights.js`)

Runs after daily scan. For each new paper:

```javascript
async function distillPaper(paper) {
  const prompt = `
    Paper: ${paper.title}
    Abstract: ${paper.abstract}
    
    Extract 1-2 key insights that would be useful for:
    - Building AI agents
    - Lie detection / deception analysis
    - Business automation
    - Startup product development
    
    Format each as a single actionable sentence.
    Include the specific metric/finding if available.
  `;
  
  const insights = await claude.generate(prompt);
  
  for (const insight of insights) {
    await storeInsight({
      paper_id: paper.id,
      insight: insight.text,
      domain_tags: insight.tags,
      embedding: await embed(insight.text)
    });
  }
}
```

### 2. Research Adapter (`lib/research-adapter.js`)

Plugs into agentic-learning's Pre-Decision RAG:

```javascript
async function getRelevantInsights(taskDescription, limit = 3) {
  const taskEmbedding = await embed(taskDescription);
  
  const { data: insights } = await supabase.rpc('match_insights', {
    query_embedding: taskEmbedding,
    match_threshold: 0.75,
    match_count: limit
  });
  
  // Track surfacing
  for (const insight of insights) {
    await supabase
      .from('research_insights')
      .update({ 
        times_surfaced: insight.times_surfaced + 1,
        last_surfaced_at: new Date()
      })
      .eq('id', insight.id);
  }
  
  // Format with source links
  return insights.map(i => ({
    text: i.insight,
    source: {
      title: i.paper_title,
      url: i.pdf_url,
      paper_id: i.paper_id
    },
    relevance: i.similarity
  }));
}
```

### 3. Context Injection Format

When insights are surfaced to an agent:

```markdown
📚 **Relevant Research:**

1. "Combining micro-expressions + voice stress improves deception detection by 23%"
   → [Source: Multimodal Deception Detection in Real-Time](pdf_url)

2. "Users trust AI recommendations 40% more when explanation is provided"
   → [Source: Explainability in AI Decision Systems](pdf_url)
```

### 4. Usage Tracking Hook

Add to agentic-learning hooks - detects when agent references an insight:

```javascript
// In response analysis
if (response.includes(insight.text) || 
    response.includes(insight.source.title)) {
  await markInsightUsed(insight.id);
}
```

## Configuration

Add to `agentic-learning/config.yaml`:

```yaml
research_memory:
  enabled: true
  max_insights_per_task: 3
  min_similarity: 0.75
  domains:
    - agent-tech
    - lie-detection
    - business
    - product
  exclude_older_than_days: 90  # Don't surface stale research
```

## Rollout Plan

### Phase 1: Schema + Distillation (Week 1)
- [ ] Create `research_insights` table
- [ ] Build distillation script
- [ ] Run on existing papers
- [ ] Verify insight quality

### Phase 2: Adapter Integration (Week 2)
- [ ] Coordinate with Saber on agentic-learning integration
- [ ] Build research-adapter.js
- [ ] Add to Pre-Decision RAG pipeline
- [ ] Test with one agent (Sybil)

### Phase 3: Full Rollout (Week 3)
- [ ] Enable for all agents
- [ ] Monitor usage tracking
- [ ] Tune similarity threshold
- [ ] Add feedback mechanism

## Success Metrics

1. **Insight Usage Rate**: % of surfaced insights actually referenced
2. **Relevance Score**: Average similarity of surfaced insights
3. **Coverage**: % of tasks where relevant research exists
4. **Agent Feedback**: Qualitative - are insights helpful?

## Open Questions

1. Should insights expire? (After 90 days, deprioritize?)
2. How to handle conflicting insights from different papers?
3. Should agents be able to "star" useful insights?
4. Cross-agent learning: If Sage finds an insight useful, boost for others?

---

*Pending Saber's review for agentic-learning integration approach.*
