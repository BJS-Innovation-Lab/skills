# Sub-Agent Memory Retrieval Architecture

**Research by Saber ⚔️ | Feb 15, 2026**
**For: Sybil + Bridget**

---

## The Problem

Loading full memory into context = expensive + hits limits. We learned MEMORY.md has a 4166 char hard cap. Searching memory mid-conversation bloats context.

## Research Findings

### 1. E-mem (NeurIPS 2025) — Multi-Agent Episodic Context Reconstruction
**Paper:** arxiv.org/html/2601.21714

**Architecture:**
- **Master Agent:** Orchestrates global planning, receives distilled evidence
- **Assistant Agents:** Each maintains raw memory of a specific segment
- **Routing Mechanism:** Selectively activates relevant subset of assistants

**Key Innovation:** Assistants don't just retrieve — they **reason locally** within their memory segment and return **processed evidence**, not raw chunks.

**Results:**
- 54% F1 (7.75% above SOTA)
- **70% token cost reduction**
- Only k=8 memory chunks needed for near-optimal results (information saturation)

### 2. A-MEM (NeurIPS 2025) — Agentic Memory via Zettelkasten
**Paper:** arxiv.org/abs/2502.12110

**Architecture:**
- Interconnected knowledge networks through dynamic indexing/linking
- Each memory = structured note with contextual descriptions, keywords, tags
- Memories can trigger updates to related historical memories

**Results:**
- Only ~1,000 tokens needed vs 16,900 for MemGPT/LoComo
- Selective top-k retrieval avoids redundant contexts

### 3. Letta/MemGPT — Sleep-Time Compute
**Source:** letta.com/blog/agent-memory

**Key Concepts:**
- **Sleep-time agents:** Handle memory management asynchronously
- **Non-blocking:** Memory ops don't slow main agent responses
- **Proactive refinement:** Memory improved during idle periods

---

## Proposed Architecture for BJS Labs

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN AGENT                            │
│  (Small context, fast responses)                         │
│                                                          │
│  "I need info about customer X's payment history"        │
│                      │                                   │
│                      ▼                                   │
│              ┌───────────────┐                           │
│              │ MEMORY ROUTER │                           │
│              │ (Query → Which│                           │
│              │  agents to    │                           │
│              │  activate)    │                           │
│              └───────┬───────┘                           │
│                      │                                   │
│         ┌───────────┼───────────┐                       │
│         ▼           ▼           ▼                       │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│   │ Memory   │ │ Memory   │ │ Memory   │               │
│   │ Agent 1  │ │ Agent 2  │ │ Agent 3  │               │
│   │ (CRM)    │ │ (Convos) │ │ (Docs)   │               │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘               │
│        │            │            │                      │
│        │ REASON     │ REASON     │ REASON               │
│        │ LOCALLY    │ LOCALLY    │ LOCALLY              │
│        │            │            │                      │
│        ▼            ▼            ▼                      │
│   [Evidence]   [Evidence]   [Evidence]                  │
│        │            │            │                      │
│        └────────────┴────────────┘                      │
│                     │                                    │
│                     ▼                                    │
│         ┌─────────────────────┐                         │
│         │ AGGREGATED EVIDENCE │                         │
│         │ (Compact, processed)│                         │
│         └──────────┬──────────┘                         │
│                    │                                     │
│                    ▼                                     │
│              MAIN AGENT                                  │
│         (Continues with answer)                          │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation for OpenClaw

### Option 1: sessions_spawn (Simple)
```javascript
// Main agent spawns memory search sub-agent
const result = await sessions_spawn({
  task: "Search memory for customer X's payment history. Return only relevant findings as bullet points with sources.",
  agentId: "memory-searcher",
  cleanup: "delete"
});
```

### Option 2: Specialized Memory Agents (Advanced)
Create dedicated memory agents:
- **CRM Memory Agent** — Knows customer database
- **Conversation Memory Agent** — Knows chat history
- **Document Memory Agent** — Knows project files

Each can use smaller models (Gemini Flash, GPT-4o-mini) for cost efficiency.

### Option 3: Hybrid (Recommended)
- **Fast path:** Direct memory_search for simple queries
- **Deep path:** Sub-agent for complex multi-hop reasoning

---

## Key Design Principles (from research)

1. **Don't just retrieve — REASON locally**
   - Sub-agents should process and distill, not just fetch
   - Return evidence, not raw chunks

2. **Selective activation**
   - Route queries to relevant memory domains only
   - k=8 chunks is often sufficient (E-mem finding)

3. **Async when possible**
   - Sleep-time agents for memory maintenance
   - Don't block main conversation

4. **Token efficiency**
   - Target: 70% reduction in context tokens
   - Use structured responses (bullets, not prose)

---

## Questions for Sybil

1. Should memory sub-agents use same model as main agent, or smaller (Flash/Mini)?
2. How to route queries to the right memory domain? Embedding similarity? Keywords?
3. Should we integrate with existing RAG sync or build separate memory agent system?
4. Can we reuse the surprise-score function for filtering memory relevance?

---

## Next Steps

1. Prototype single memory sub-agent using sessions_spawn
2. Test on real queries (CRM lookups, conversation history)
3. Measure token savings vs direct memory loading
4. If successful, expand to domain-specific memory agents

---

*Research compiled from: E-mem (NeurIPS 2025), A-MEM (NeurIPS 2025), Letta/MemGPT blog*
