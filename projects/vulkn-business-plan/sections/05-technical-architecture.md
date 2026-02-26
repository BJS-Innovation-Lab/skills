# 5. Technical Architecture
**Lead:** Sage | **Status:** Draft

---

## System Overview

VULKN is a multi-tenant AI agent platform built on a modern serverless stack. Each client organization gets an isolated AI agent with its own knowledge base, skills, and conversation history — all running on shared infrastructure for cost efficiency.

### Architecture Principles
1. **Multi-tenant isolation** — Organization-level data separation via Row Level Security (RLS)
2. **Serverless-first** — No servers to manage; scales to zero, scales to thousands
3. **Channel-agnostic** — Same agent brain, multiple communication surfaces
4. **Modular skills** — Plug-in capabilities per client without code changes
5. **Observable** — Full conversation history, audit logs, and performance metrics

---

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS 4 | Dashboard, embeddable webchat widget, landing page |
| **Hosting** | Vercel | Frontend deployment, edge functions, CDN |
| **Backend/API** | Next.js API Routes (serverless) | REST endpoints for dashboard, widget config, analytics |
| **Database** | Supabase (PostgreSQL 15) | Organizations, conversations, knowledge bases, leads, usage tracking |
| **Auth** | Supabase Auth + RLS | Multi-tenant authentication, role-based access (owner/admin/member) |
| **AI Engine** | OpenClaw (Gateway) on Railway | Agent runtime — connects LLM to channels, skills, knowledge |
| **LLM Provider** | Anthropic (Claude) | Primary inference engine for conversation |
| **Messaging** | WhatsApp Business API, Webchat embed | Customer-facing channels |
| **Animations** | Framer Motion | Dashboard and widget micro-interactions |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                             │
│   WhatsApp  ·  Webchat Widget  ·  Future Channels       │
└──────┬──────────────┬───────────────────┬───────────────┘
       │              │                   │
       ▼              ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│              OPENCLAW GATEWAY (Railway)                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐              │
│  │ Channel  │  │  Skill   │  │ Knowledge │              │
│  │ Adapters │  │  Engine  │  │  Loader   │              │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘              │
│       │              │              │                     │
│       ▼              ▼              ▼                     │
│  ┌────────────────────────────────────┐                  │
│  │         LLM (Claude via Anthropic) │                  │
│  └────────────────────────────────────┘                  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                     │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐     │
│  │   Orgs &   │ │ Knowledge  │ │  Conversations   │     │
│  │  Members   │ │   Base     │ │  & Leads         │     │
│  └────────────┘ └────────────┘ └──────────────────┘     │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────┐     │
│  │   Skills   │ │   Usage    │ │  Audit Logs      │     │
│  │  Registry  │ │  Tracking  │ │  & Analytics     │     │
│  └────────────┘ └────────────┘ └──────────────────┘     │
│                    RLS: per-org isolation                 │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│               VERCEL (Frontend + API)                     │
│  Dashboard · Widget Embed · Landing · REST API Routes    │
└──────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Model

Each client organization is a row in the `organizations` table. All downstream data (conversations, leads, knowledge, skills, usage) references `org_id` with PostgreSQL RLS policies enforcing isolation.

### Data Isolation
- **Database:** Row-Level Security on every table — users only see their org's data
- **Auth:** Supabase Auth with org membership verification on every API call
- **Agent:** Each org has its own OpenClaw agent instance with dedicated config
- **Knowledge:** Per-org knowledge base (FAQs, documents, custom training data)

### Onboarding Flow
1. Admin creates organization → gets `org_id` and `slug`
2. Agent is provisioned with org-specific system prompt, skills, and knowledge
3. Webchat embed code generated: `<script src="vulkn.com/vulkn-widget.js" data-org="slug">`
4. WhatsApp channel connected via gateway config
5. Agent goes live — all conversations auto-captured as leads

---

## Key Subsystems

### 1. Conversation Engine
- Handles multi-turn, context-aware conversations
- Persists full message history per session
- Supports skill-based routing (appointment booking, FAQ, lead capture)
- Bilingual: automatic Spanish/English code-switching

### 2. Knowledge Base
- Per-org document store with bulk import/export
- FAQ suggestions auto-generated from conversation patterns
- Knowledge entries used as context injection for agent responses

### 3. Lead Management
- Every webchat/WhatsApp conversation auto-creates a lead
- Lead scoring: hot leads (high intent signals), stale leads (contacted, no response)
- Bulk operations for lead export and CRM sync

### 4. Skills Framework
- Modular agent capabilities: appointment booking, FAQ, reminders, intake forms
- Per-org skill configuration without code deployment
- Skill catalog with tiered access by pricing plan

### 5. Dashboard & Analytics
- Real-time metrics: conversations, response times, peak hours
- Feedback stats, milestone tracking, weekly comparisons
- Audit logs for compliance and debugging
- Webhook integrations for external systems

### 6. Embeddable Widget
- Lightweight JS widget (`vulkn-widget.js`) for client websites
- Customizable branding (logo, colors, greeting message)
- Embed analytics tracking (impressions, opens, conversations started)
- OpenGraph and social preview images per org

---

## Scalability

### Current Capacity
- **Serverless API:** Auto-scales via Vercel — handles spikes without provisioning
- **Database:** Supabase managed PostgreSQL — scales vertically, connection pooling via Supavisor
- **Agent Runtime:** Railway containers — horizontal scaling by adding instances
- **Target:** 50+ concurrent organizations, 10K+ conversations/day

### Scaling Roadmap
| Phase | Clients | Architecture Change |
|-------|---------|-------------------|
| **Now (0-50)** | 1-50 | Shared infrastructure, single Supabase project |
| **Growth (50-200)** | 50-200 | Database read replicas, agent instance pooling, CDN caching |
| **Scale (200+)** | 200+ | Regional deployments (MX, CO, BR), dedicated DB per region, queue-based message processing |

### Cost Scaling
Infrastructure costs grow sub-linearly with clients:
- Supabase: ~$100 MXN/client/mo at 50 clients → ~$60 MXN/client/mo at 200 (shared overhead amortization)
- Compute: Railway containers handle ~20 agents each before needing horizontal scaling
- The dominant cost remains LLM inference (~60-70% of COGS), which scales linearly with conversation volume

---

## Security & Compliance

| Area | Implementation |
|------|---------------|
| **Data at rest** | Supabase encrypted storage (AES-256) |
| **Data in transit** | TLS 1.3 everywhere (Vercel, Supabase, Railway) |
| **Authentication** | Supabase Auth with JWT, session management |
| **Authorization** | PostgreSQL RLS + API-level org membership checks |
| **Secrets** | Environment variables in Vercel/Railway (never in code) |
| **Audit** | Full audit log per organization |
| **Data residency** | Currently US-East (Supabase/Vercel); LatAm region planned |
| **GDPR/Privacy** | Conversation data deletable per org; no cross-org data sharing |

---

## Technical Differentiators

1. **No-code agent configuration** — Clients don't touch code; everything configured via dashboard
2. **Sub-5-second response time** — Serverless edge + streaming LLM responses
3. **True multi-tenancy** — Not separate deployments per client; shared infra, isolated data
4. **WhatsApp-native** — Not an afterthought; first-class channel with full feature support
5. **Embeddable** — One script tag to add AI to any website
6. **Observable** — Business owners see exactly what their agent is doing (conversations, leads, metrics)

---

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM API downtime (Anthropic) | Agent goes offline | Multi-provider fallback (OpenAI as backup), graceful degradation with cached responses |
| Supabase outage | All orgs affected | Daily backups, point-in-time recovery, migration path to self-hosted PostgreSQL |
| WhatsApp API changes | Channel disruption | Abstracted channel layer; can swap providers without touching agent logic |
| Cost explosion (LLM usage) | Margin compression | Per-org usage limits, conversation caching, prompt optimization, usage tracking dashboard |
| Data breach | Trust destruction | RLS, encryption, audit logs, penetration testing roadmap |

---

## Reflection Prompts
1. **Is our stack too coupled to specific vendors?** — Moderate risk. Supabase and Vercel are swappable (standard PostgreSQL, standard Next.js). Anthropic dependency is the biggest lock-in — mitigated by OpenClaw's multi-provider support.
2. **Can we maintain sub-5s response times at scale?** — Yes for webchat (edge-deployed). WhatsApp has inherent latency from Meta's API. LLM streaming helps perceived performance.
3. **When do we need a dedicated backend?** — At ~200+ orgs, API routes may hit Vercel function limits. Plan: extract high-traffic endpoints to Railway or dedicated Node.js service.
4. **Is RLS sufficient for enterprise clients?** — For SMB market, yes. Enterprise tier may require dedicated database instances — addressable in the Scale phase.
