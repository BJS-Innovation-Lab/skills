# Sub-Agent Memory Retrieval & Context Window Management

**Research Report — February 2026**

---

## Table of Contents
1. [Existing Framework Approaches](#1-existing-framework-approaches)
2. [MemGPT/Letta Deep Dive](#2-memgptletta-deep-dive)
3. [RAG vs Agent-Based Retrieval](#3-rag-vs-agent-based-retrieval)
4. [Context Window Optimization](#4-context-window-optimization)
5. [Practical Patterns](#5-practical-patterns)
6. [Failure Modes](#6-failure-modes)
7. [Implementable Patterns for OpenClaw](#7-implementable-patterns-for-openclaw)

---

## 1. Existing Framework Approaches

### LangChain / LangGraph

**Memory architecture:** Flexible, developer-configured. Supports short-term (recent messages), long-term (vector DB), entity memory, and persistent state across sessions.

**Key patterns:**
- **ConversationSummaryMemory** — Rolling summarization of older turns. Recent N messages kept verbatim, older turns compressed into a running summary prepended to context.
- **Vector-backed retrieval** — Long-term memories stored in Chroma/pgvector/Pinecone, retrieved via semantic search on demand.
- **Entity memory** — Tracks specific entities and attributes across conversation turns.
- **LangGraph checkpointing** — Graph-based state persistence that survives across sessions.

**Sub-agent delegation:** LangGraph supports multi-agent graphs where specialized nodes handle retrieval. The `langgraph-bigtool` pattern indexes tool definitions and retrieves them on demand rather than loading all into context.

### CrewAI

**Memory architecture:** Structured, role-based with built-in types:
- **Short-term memory** — RAG-backed, contextually relevant retrieval
- **Long-term memory** — SQLite3 for persistent storage
- **Entity memory** — RAG-backed entity tracking
- **Contextual memory** — Interaction context for coherence
- **User memory** — Per-user personalization

**Key pattern: Agentic RAG** — Combines RAG retrieval with agent reasoning. The retrieval agent can re-query, evaluate relevance, and refine results before passing to the main agent. Task delegation is core to CrewAI's design — one agent researches, another plans, another executes.

**Limitation:** SQLite3 for long-term memory limits scalability in high-throughput scenarios. Less flexible than LangGraph's fully customizable approach.

### AutoGen (Microsoft)

**Memory architecture:** Minimal built-in memory. Relies on:
- **Message lists** — Conversation history as the primary short-term memory
- **External integrations** — Developer brings their own storage solution

**Sub-agent pattern:** Multi-agent conversation is AutoGen's core abstraction. Agents communicate via message passing. A "retrieval agent" can be configured as a participant that searches external stores and returns results to the conversation.

**Key insight:** AutoGen's lightweight approach means context window management is entirely the developer's responsibility. This is both a strength (full control) and weakness (no guardrails).

### Google ADK

**Memory Search API** — Agents call `search_memory(query)` to query a configured memory service. Results returned via tool interface. Keeps context minimal until knowledge is actually needed — "on-demand context" pattern.

### OpenAI Agents SDK

**Session-based memory** with two built-in strategies:
- **Context trimming** — Drop older turns, keep last N. Simple, deterministic, zero added latency. Risks abrupt forgetting of important earlier context.
- **Context summarization** — Compress prior messages into structured summaries. Retains long-range memory but adds latency and risks "summary drift" / context poisoning.

---

## 2. MemGPT/Letta Deep Dive

### Core Architecture: Virtual Context Management

MemGPT draws directly from OS virtual memory concepts:

| OS Concept | MemGPT Equivalent |
|---|---|
| Physical RAM / Main memory | Main context (context window) |
| Disk storage | External context (archival + recall) |
| Virtual memory | Virtual context (illusion of unlimited memory) |
| Page faults | Tool calls to retrieve from external storage |
| Paging | Moving data in/out of context via function calls |

### Two-Tier Memory Hierarchy

**Tier 1: Main Context (In-Context)**
- **Core memory blocks** — Always visible in context window, no retrieval needed
  - `human` block — Facts about the user (updated as agent learns)
  - `persona` block — Agent's own personality/identity (self-editable)
  - Custom blocks with any label (project status, preferences, etc.)
- These are the "executive summary" — structured, persistent, actively maintained

**Tier 2: External Context (Out-of-Context)**
- **Recall storage** — Full conversation history, searchable via full-text and semantic search
- **Archival memory** — Agent-managed vector database (Chroma, pgvector) for facts and knowledge
- **Filesystem** — Document and data management
- Accessed only on-demand via tool calls

### Self-Editing Memory via Tool Calling

The critical innovation: **the LLM itself decides what to page in/out**. The agent has built-in tools:
- `memory_replace` — Search-and-replace for precise edits to core memory blocks
- `memory_insert` — Add a line to a block
- `memory_rethink` — Rewrite an entire block
- `archival_memory_search` — Semantic search over archival storage
- `conversation_search` — Search past messages

When the user says "my favorite color changed to blue," the agent autonomously calls:
```
memory_replace(block_label="human", old_text="Favorite color: red", new_text="Favorite color: blue")
```

### Heartbeat Mechanism for Multi-Step Reasoning

MemGPT uses "heartbeats" for chained reasoning. When the agent makes a tool call, it can set `request_heartbeat=true` to get another thinking step. This enables:
1. Search archival memory
2. Evaluate results (heartbeat)
3. Search again with refined query (heartbeat)
4. Synthesize and respond

This is effectively an **agent-driven retrieval loop** — the agent reasons about what it needs, retrieves, evaluates, and iterates.

### Key Design Insight

Letta's docs state it clearly: *"Best practice: Use both together. Memory blocks hold the 'executive summary' while external storage holds the full details."*

This is the pattern we should implement: **structured always-in-context summaries + on-demand deep retrieval**.

---

## 3. RAG vs Agent-Based Retrieval

### When Simple RAG Is Sufficient

- **Factual lookup** — "What is the capital of France?" Single query, single retrieval, done.
- **Well-structured knowledge bases** — Documents with clear semantic boundaries
- **Low ambiguity queries** — User knows exactly what they want
- **Latency-critical paths** — RAG is one retrieval step; agent loops add latency
- **Cost-sensitive workloads** — Each agent reasoning step costs tokens

### When You Need Agentic Retrieval

- **Multi-hop reasoning** — Answer requires synthesizing across multiple documents
- **Vague or ambiguous queries** — Agent needs to reformulate, try different angles
- **Multi-source retrieval** — Need to query different databases/indexes and combine
- **Quality evaluation** — Retrieved results need relevance assessment before use
- **Iterative refinement** — First retrieval is insufficient; agent needs to narrow/broaden search
- **Cross-referencing** — Need to verify consistency across retrieved information

### The Agentic RAG Spectrum

From the arxiv survey on Agentic RAG (2501.09136):

1. **Naive RAG** — Query → Retrieve → Generate. Single pass, no reasoning.
2. **Advanced RAG** — Query rewriting, re-ranking, hybrid search. Still pipeline, no agent loop.
3. **Agentic RAG** — Agent decides *when* to retrieve, *what* to search for, evaluates results, and can re-query. Uses function calling, multi-step reasoning.
4. **Multi-Agent RAG** — Specialized retrieval agents for different sources. Coordinator synthesizes.

**Key tradeoff:** More agents = better results but higher cost and latency. IBM notes: *"More agents at work mean greater expenses, and an agentic RAG system usually requires paying for more tokens."*

### Practical Decision Framework

```
Is the query straightforward and the knowledge base well-indexed?
  → Use simple RAG

Does the query require multiple searches or source comparison?
  → Use agentic retrieval with a single retrieval agent

Does the query span multiple knowledge domains with different indexes?
  → Use multi-agent retrieval with specialized sub-agents

Is the query vague and needs disambiguation?
  → Use agentic retrieval with query reformulation loop
```

---

## 4. Context Window Optimization

### Key Research & Insights

**"Lost in the Middle" (Liu et al., 2023)** — Models have primacy and recency bias. Information in the middle of long contexts is used poorly. Implications: put critical info at the start (system prompt) or end (recent messages), not the middle.

**"Context Rot" (Chroma Research)** — As context grows, model performance degrades. Not just a token limit problem — even within limits, more context = worse attention allocation. Anthropic's framing: *"Context must be treated as a finite resource with diminishing marginal returns. Every new token depletes the attention budget."*

**METR benchmarks** — Agent task length doubles every 7 months, making context management increasingly critical.

### Proven Optimization Strategies

#### 1. Hierarchical Memory (MemGPT Pattern)
- Working memory (always in context) → Short-term storage (session) → Long-term storage (persistent)
- Each tier has different access speed and retention policies
- Agent actively manages what's in each tier

#### 2. Context Offloading to Filesystem
- **Manus pattern:** Write old tool results to files, only summarize when offloading has diminishing returns
- **Cursor Agent pattern:** Offload tool results and agent trajectories to filesystem, read back if needed
- **Advantage over summarization:** No information loss; can always re-read the full content

#### 3. Progressive Disclosure
- Don't load everything upfront. Provide summaries/indexes and let the agent pull details on demand.
- **Tool definitions:** Index tools, retrieve definitions only when needed (LangGraph bigtool pattern)
- **Skills:** Load YAML frontmatter only; agent reads full SKILL.md if relevant (Anthropic's skills standard)
- **MCP servers:** Cursor syncs tool descriptions to a folder; agent reads full description only if needed

#### 4. Sub-Agent Context Isolation
- Spawn sub-agents with **fresh, isolated context windows**
- Sub-agent processes specific task, returns only the result/summary
- Main agent's context stays clean
- Claude Code team uses sub-agents for parallel code review — each checks different issues independently

#### 5. Cache-Aware Context Management
- **Prompt caching** is critical for cost. Manus calls cache hit rate "the most important metric for production agents"
- Append-only context mutations preserve cache prefixes
- A higher-capacity model with caching can be cheaper than a lower-cost model without it

#### 6. Structured State Files
- Write plans/state to files; re-read periodically to reinforce objectives
- Acts as "external working memory" that survives context resets
- Manus and Anthropic both use this for long-running agents

### Key Papers & Resources

- **MemGPT paper:** arxiv.org/abs/2310.08560 (virtual context management)
- **Agentic RAG survey:** arxiv.org/abs/2501.09136 (comprehensive overview)
- **Reasoning RAG survey:** arxiv.org/abs/2506.10408 (System 1 vs System 2 retrieval)
- **Context Rot research:** research.trychroma.com/context-rot
- **Anthropic's context engineering:** anthropic.com/engineering/effective-context-engineering-for-ai-agents
- **Manus context engineering:** manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
- **OpenAI session memory cookbook:** cookbook.openai.com/examples/agents_sdk/session_memory
- **jroddev whitepaper:** blog.jroddev.com/context-window-management-in-agentic-systems/

---

## 5. Practical Patterns

### Query Formats for Retrieval Sub-Agents

**Best practice: Structured task specification**

```
{
  "task": "retrieve",
  "query": "What did the user say about their project deadline?",
  "sources": ["conversation_history", "memory_notes"],
  "max_results": 5,
  "recency_weight": 0.7,
  "format": "bullet_summary"
}
```

**What works:**
- Explicit query + source specification (don't search everything)
- Recency weighting for time-sensitive queries
- Result format specification (summary vs. verbatim vs. structured)
- Max result count to prevent context bloat from returned results

### Handling Vague Queries

**Pattern: Query Decomposition + Expansion**

When the main agent receives a vague query like "what was that thing we discussed?":

1. **Temporal anchoring** — Check recent memory first (last 24h, last week)
2. **Entity extraction** — Pull any entities from the vague query
3. **Multi-query expansion** — Generate 2-3 variant queries:
   - Semantic: What topics were discussed recently?
   - Keyword: Extract key terms and search
   - Temporal: Sort by recency, scan summaries
4. **Result ranking** — Score by relevance + recency + entity overlap
5. **Confidence threshold** — If no high-confidence result, ask the user to clarify rather than guess

### Granularity of Returned Results

**The right granularity depends on what the main agent needs:**

| Main Agent Need | Sub-Agent Returns |
|---|---|
| Quick fact check | Single sentence answer |
| Context for decision | 3-5 bullet summary with source refs |
| Deep analysis | Full relevant passages with metadata |
| Background loading | Structured memory block update (key-value pairs) |

**Rule of thumb:** Return the **minimum context the main agent needs to act**, not everything the sub-agent found. The sub-agent should reason about relevance and filter, not just relay raw results.

### Memory Write Patterns

**Dedicated memory management agent** (from Forgetful framework):
- Don't just store raw input — have an agent decide what's worth keeping
- Determine how new memories fit into existing knowledge structure
- Update or obsolete existing memories based on new information
- This is essentially MemGPT's self-editing memory pattern generalized

### Practical Architecture for a Persistent Agent

```
┌─────────────────────────────────────┐
│           Main Agent                │
│  ┌─────────────────────────────┐    │
│  │  Core Memory (always in     │    │
│  │  context):                  │    │
│  │  - User profile summary     │    │
│  │  - Agent persona            │    │
│  │  - Current task state       │    │
│  │  - Key facts (< 2K tokens)  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tools:                             │
│  - search_memory(query)             │
│  - update_memory(block, edit)       │
│  - spawn_retrieval_agent(task)      │
│  - write_to_file(path, content)     │
│  - read_from_file(path)             │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Retrieval│ │Memory  │ │Task    │
│Sub-Agent│ │Writer  │ │Worker  │
│         │ │        │ │        │
│Searches,│ │Decides │ │Isolated│
│reasons, │ │what to │ │context │
│filters, │ │store,  │ │for     │
│returns  │ │updates │ │heavy   │
│summary  │ │blocks  │ │work    │
└────┬────┘ └────┬───┘ └────┬───┘
     │           │          │
     ▼           ▼          ▼
┌─────────────────────────────────┐
│  External Storage               │
│  - Vector DB (semantic search)  │
│  - Filesystem (daily notes,     │
│    conversation logs, files)    │
│  - Structured DB (entities,     │
│    relationships)               │
└─────────────────────────────────┘
```

---

## 6. Failure Modes

### 1. Over-Summarization / Lossy Compression
- **Problem:** Rolling summaries lose nuance. A detail that seemed unimportant when summarized becomes critical later.
- **Mitigation:** Keep full logs in external storage. Summarize for context, but maintain ability to retrieve verbatim. Use two-tier summaries: brief for context + detailed in storage.

### 2. Context Poisoning
- **Problem:** A bad fact enters a summary and persists. Each subsequent summary reinforces the error. The agent's "memory" becomes corrupted.
- **Mitigation:** Log summary prompts/outputs for auditability. Periodically re-summarize from source rather than summarizing summaries. Allow manual correction of core memory blocks.

### 3. Retrieval Latency
- **Problem:** Each sub-agent call adds latency (LLM inference for the sub-agent + retrieval time). Multiple retrieval hops compound.
- **Measured impact:** MemGPT-style paging adds "architectural complexity and potential retrieval latency when paging information back into context" (Redis blog).
- **Mitigation:** Cache frequently accessed memories. Use simple RAG for straightforward lookups, reserve agent-based retrieval for complex queries. Pre-load likely-needed context based on conversation topic.

### 4. Lost Context in Delegation
- **Problem:** When spawning a sub-agent, insufficient context is passed. The sub-agent can't do its job without understanding the broader situation.
- **Mitigation:** Each sub-agent invocation must have a clear, specific task description. Pass relevant context explicitly. Don't assume the sub-agent knows anything about the main conversation.

### 5. Retrieval Drift / Wrong Results
- **Problem:** Semantic search returns plausible but wrong results. The main agent trusts retrieved information without verification.
- **Mitigation:** Have the retrieval sub-agent include confidence scores. For critical decisions, retrieve from multiple sources and cross-reference. Let the main agent verify retrieved facts against its core memory.

### 6. Agent Loop / Infinite Retrieval
- **Problem:** Agent keeps searching because it's not satisfied with results, burning tokens in an infinite loop.
- **Mitigation:** Set maximum retrieval attempts (2-3). If no satisfactory result after max attempts, return "not found" with best guess. Implement circuit breakers.

### 7. Context Window Overflow from Retrieved Content
- **Problem:** Sub-agent returns too much content, bloating the main agent's context with retrieved material.
- **Mitigation:** Enforce result size limits in the sub-agent's instructions. The sub-agent should summarize/filter, not relay raw results. Set explicit token budgets for returned content.

### 8. Stale Core Memory
- **Problem:** Core memory blocks become outdated but the agent doesn't realize it needs to update them.
- **Mitigation:** Periodic memory review (MemGPT's heartbeat pattern). Compare core memory against recent conversations. Flag inconsistencies.

### 9. Cost Explosion
- **Problem:** Multiple sub-agents, each with their own LLM calls, multiply API costs rapidly.
- **Mitigation:** Use cheaper/faster models for retrieval sub-agents (they don't need frontier reasoning). Cache aggressively. Use simple RAG when agentic retrieval isn't needed. Manus insight: optimize for cache hit rate above all else.

---

## 7. Implementable Patterns for OpenClaw

Based on this research, here are concrete patterns we can implement:

### Pattern 1: Tiered Memory (MemGPT-Inspired)
- **Core memory:** MEMORY.md (always loaded in main session) = "executive summary"
- **Daily logs:** memory/YYYY-MM-DD.md = short-term storage
- **Archival:** Full conversation history, searchable
- **Already partially implemented.** Gap: no semantic search over daily logs, no automated memory block management.

### Pattern 2: Retrieval Sub-Agent
- Spawn a sub-agent with task: "Search memory files for X, return 3-5 bullet summary"
- Sub-agent reads relevant daily files, searches, reasons about relevance, returns condensed result
- Main agent's context stays clean — only the summary enters context
- **Implementation:** Use OpenClaw's existing sub-agent spawning mechanism

### Pattern 3: Memory Writer Sub-Agent
- After significant conversations, spawn a sub-agent to:
  - Review the conversation
  - Extract key facts, decisions, commitments
  - Update MEMORY.md with distilled insights
  - Update daily log with raw events
- **Already partially implemented** via heartbeat memory maintenance. Could be more systematic.

### Pattern 4: Context Offloading
- When processing large inputs (long documents, research results), write to filesystem first
- Work with file references, not file contents in context
- Read back specific sections as needed
- **Implementation:** Already natural in the current architecture (workspace files)

### Pattern 5: Query Decomposition for Vague Retrieval
- When user asks something that requires memory search:
  1. Decompose into specific sub-queries
  2. Search recent files first (recency bias is usually correct)
  3. Fall back to broader search if needed
  4. Return minimum viable context

### Priority Order for Implementation
1. **Retrieval sub-agent** — highest impact, solves the "search all my memory" problem without context bloat
2. **Structured core memory** — formalize MEMORY.md into sections with explicit update triggers
3. **Memory writer sub-agent** — automate the heartbeat memory maintenance
4. **Semantic search** — add vector indexing over daily logs for better retrieval

---

## Sources

1. MemGPT paper — arxiv.org/abs/2310.08560
2. Letta docs — docs.letta.com/concepts/memgpt/, docs.letta.com/guides/agents/memory/
3. Leonie Monigatti's MemGPT walkthrough — leoniemonigatti.com/blog/memgpt.html
4. AI Agent Memory comparative analysis (LangGraph/CrewAI/AutoGen) — dev.to/foxgem
5. Agentic RAG survey — arxiv.org/abs/2501.09136
6. Reasoning RAG survey — arxiv.org/abs/2506.10408
7. OpenAI Agents SDK session memory cookbook — cookbook.openai.com
8. Context Window Management in Agentic Systems — blog.jroddev.com
9. Agent Design Patterns (Lance Martin, LangChain) — rlancemartin.github.io/2026/01/09/agent_design/
10. Sub-Agent Spawning patterns — agentic-patterns.com/patterns/sub-agent-spawning/
11. Manus context engineering — manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
12. Anthropic context engineering — anthropic.com/engineering/effective-context-engineering-for-ai-agents
13. Redis context window overflow guide — redis.io/blog/context-window-overflow/
14. Weaviate context engineering — weaviate.io/blog/context-engineering
15. IBM Agentic RAG — ibm.com/think/topics/agentic-rag
16. NVIDIA Traditional vs Agentic RAG — developer.nvidia.com/blog/traditional-rag-vs-agentic-rag
