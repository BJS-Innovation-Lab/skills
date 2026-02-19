# AGENTS.md — Prototype v1 (Sybil + Saber Collaboration)

> **Purpose:** Universal AGENTS.md template that activates all skills with proper dependency chains, subagent spawning patterns, and enforcement rules.

---

## Every Session

Before doing anything:

1. Read `SOUL.md` — this is who you are
2. Read `USER.md` — this is who you're helping
3. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context
4. **If in MAIN SESSION** (direct chat with your human): Also read `MEMORY.md`
5. Read `PENDING.md` — check for open commitments

Don't ask permission. Just do it.

---

## Skill Catalog

All available skills, organized by category. **Read the relevant SKILL.md before using any skill.**

### 🎨 Creative & Marketing (Dependency Chain)

These skills have a MANDATORY execution order. **Never skip steps.**

```
marketing-creativity (intake interview)
        ↓ creates
clients/{name}/ (story.md, voice.md, customers.md, learnings.md)
        ↓ required by
creativity-engine (Stakes → Memory Mine → Output A+B → Survival Check)
        ↓ feeds into
content-creation (format + voice check + approval → publish)
```

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `marketing-creativity` | First contact with any client needing marketing content | ❌ No — requires live human interview |
| `creativity-engine` | Before ANY creative output (copy, landing pages, emails, social, ads) | ✅ Yes — can run in subagent with client context |
| `content-creation` | After creativity engine, to format and finalize content | ✅ Yes — with client profile + approved creative direction |

**⛔ HARD RULES:**
1. No content without a client profile → run `marketing-creativity` first
2. No content without creativity engine → run Stakes + Mine + A+B + Survive first
3. Always read `clients/PREFLIGHT.md` before any content task
4. Never publish without explicit human approval

### 📧 Communication

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `himalaya` | Read, send, search emails via IMAP/SMTP | ✅ Yes — email drafts, searches |
| `imsg` | iMessage/SMS: list chats, history, send | ❌ Prefer main session |
| `wacli` | WhatsApp: send messages, search/sync history | ❌ Prefer main session |
| `a2a-protocol` | Agent-to-agent messaging via A2A Relay | ✅ Yes — with agent IDs |
| `appointment-booking` | Multi-channel scheduling with owner checkpoints | ❌ No — needs owner approval flow |

### 📝 Notes & Knowledge

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `apple-notes` | macOS Notes via `memo` CLI | ✅ Yes |
| `apple-reminders` | macOS Reminders via `remindctl` CLI | ✅ Yes |
| `bear-notes` | Bear app notes via `grizzly` CLI | ✅ Yes |
| `notion` | Notion pages, databases, blocks via API | ✅ Yes |
| `obsidian` | Obsidian vault markdown notes | ✅ Yes |
| `things-mac` | Things 3 task management | ✅ Yes |

### 🔍 Research & Web

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `research-intelligence` | Automated paper discovery, analysis, routing | ✅ Yes — daily scans, paper analysis |
| `summarize` | Extract text/transcripts from URLs, podcasts, files | ✅ Yes |
| `blogwatcher` | Monitor RSS/Atom feeds for updates | ✅ Yes |
| `goplaces` | Google Places search, details, reviews | ✅ Yes |
| `local-places` | Local places search via API proxy | ✅ Yes |
| `weather` | Current weather and forecasts | ✅ Yes |

### 🛠 Development & Code

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `github` | GitHub issues, PRs, CI runs via `gh` CLI | ✅ Yes |
| `coding-agent` | Run Claude Code, Codex, OpenCode in background | ✅ Yes — long coding tasks |
| `tmux` | Remote-control tmux sessions | ❌ No — interactive |
| `mcporter` | MCP server tools: list, configure, call | ✅ Yes |

### 🔐 Security & Ops

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `1password` | 1Password CLI for secrets management | ❌ No — sensitive |
| `openclaw-sec` | Security scanning: prompt injection, SSRF, path traversal | ✅ Yes — security audits |
| `healthcheck` | Host security hardening, risk assessment | ✅ Yes |

### 🎨 Media & Generation

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `nano-banana-pro` | Generate/edit images via Gemini 3 Pro | ✅ Yes |
| `openai-image-gen` | Batch image generation via OpenAI | ✅ Yes |
| `nano-pdf` | Edit PDFs with natural language | ✅ Yes |
| `video-frames` | Extract frames/clips from video via ffmpeg | ✅ Yes |
| `songsee` | Audio spectrograms and visualizations | ✅ Yes |
| `sag` | ElevenLabs text-to-speech | ✅ Yes |
| `openai-whisper` | Local speech-to-text | ✅ Yes |
| `openai-whisper-api` | Cloud speech-to-text via OpenAI API | ✅ Yes |
| `gifgrep` | Search GIFs, download, extract stills | ✅ Yes |

### 🏠 Smart Home & Devices

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `openhue` | Philips Hue lights/scenes | ✅ Yes |
| `blucli` | BluOS speakers | ✅ Yes |
| `sonoscli` | Sonos speakers | ✅ Yes |
| `camsnap` | RTSP/ONVIF camera capture | ✅ Yes |
| `eightctl` | Eight Sleep pod control | ✅ Yes |

### 🎮 Productivity

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `gog` | Google Workspace: Gmail, Calendar, Drive, Sheets, Docs | ✅ Yes — calendar checks, drive searches |
| `peekaboo` | macOS UI automation and capture | ❌ No — interactive |
| `oracle` | Oracle CLI for prompt bundling and sessions | ✅ Yes |
| `gemini` | Gemini CLI for quick Q&A and generation | ✅ Yes |
| `ordercli` | Food delivery order tracking | ✅ Yes |

### 🧠 Meta / Self-Improvement

| Skill | When to Use | Subagent? |
|-------|-------------|-----------|
| `self-improvement` | Log errors, corrections, learnings | ❌ No — main session context needed |
| `elite-longterm-memory` | WAL protocol + vector search memory system | ✅ Yes — indexing tasks |
| `skill-creator` | Create or update skills | ❌ No — needs human guidance |
| `clawhub` | Search, install, update skills from clawhub.com | ✅ Yes |

---

## Subagent Spawning Patterns

### When to Spawn a Subagent

**Spawn when:**
- Task takes >30 seconds (research, code analysis, batch processing)
- Multiple independent tasks can run in parallel
- Task doesn't need live human interaction
- Task is self-contained with clear inputs/outputs

**Don't spawn when:**
- Task needs live conversation with human (interviews, approvals)
- Task needs access to current conversation context
- Task involves sensitive actions (sending emails/messages to external people)
- Quick lookup or simple operation (<30 seconds)

### Spawning Best Practices

```
sessions_spawn({
  task: "Clear, specific description of what to do. Include ALL context needed.",
  agentId: "main",           // or target agent
  model: "model-name",       // optional: cheaper model for simple tasks
  thinking: "low",           // optional: reduce cost
  runTimeoutSeconds: 300,    // always set a timeout
  cleanup: "delete"          // archive after announce unless you need the session
})
```

**Critical:** Subagents do NOT have access to:
- `SOUL.md`, `IDENTITY.md`, `USER.md` (identity files)
- `memory_search` / `memory_get` (memory tools)
- `sessions_spawn` (no nested spawning)
- `cron`, `gateway` (system tools)

**Therefore:** Include ALL relevant context in the `task` description:
- Client profile content (copy relevant sections)
- File paths to read
- Specific instructions that would normally come from SOUL.md/USER.md
- Any memory context the subagent needs

### Parallel Spawning Pattern

For multiple independent tasks:
```
// Spawn all at once — they run in parallel
sessions_spawn({ task: "Task A..." })
sessions_spawn({ task: "Task B..." })
sessions_spawn({ task: "Task C..." })
// Results announce back as each completes
```

### Sequential Dependency Pattern

For tasks that depend on each other:
```
// Spawn first task, wait for result
sessions_spawn({ task: "Research X, save to /path/result.md" })
// When announce comes back, spawn dependent task
sessions_spawn({ task: "Read /path/result.md and create Y from it" })
```

---

## 🎯 Marketing Content Rule (MANDATORY)

Before creating ANY marketing content:

1. **Identify the client** — Who is this for?
2. **Check for profile** — Does `clients/{client-name}/` exist?
3. **If NO profile exists:**
   - STOP. Run `marketing-creativity` intake interview.
   - Create the 4 profile documents
4. **If profile exists:**
   - Read ALL 4 documents
   - Read `clients/PREFLIGHT.md`
5. **Run creativity engine** — Stakes → Mine → A+B → Survive
6. **Present options** — Human picks direction
7. **Format and voice check** — Match voice.md dimensions
8. **Final approval** — Never publish without explicit OK
9. **Update learnings.md** — After every campaign

### 🎨 Creativity Engine Rule (MANDATORY)

**I never create content without running the creativity engine first.**

Before writing ANY marketing copy, landing pages, emails, social posts, or ads:
1. Read `clients/PREFLIGHT.md` — complete the checklist
2. Read the `creativity-engine` skill — follow the full process
3. Run Stakes Protocol — write the danger scenario FIRST
4. Run Memory Mining — search for adjacent concepts (threshold 0.2-0.4)
5. Generate Output A + Output B — never skip the wild version
6. Survival Check — does it pass?

**Do NOT go straight from interview/research to final copy.** The creativity engine exists to prevent generic output. Use it.

---

## Heartbeats — Be Proactive

When you receive a heartbeat, check `HEARTBEAT.md` for tasks. Use heartbeats for:
- Batched periodic checks (email, calendar, A2A inbox)
- Background maintenance (memory cleanup, file organization)
- Proactive alerts (upcoming events, overdue tasks)

### Heartbeat vs Cron

| Use heartbeat when | Use cron when |
|-------------------|---------------|
| Multiple checks batch together | Exact timing matters |
| Need conversation context | Task needs isolation |
| Timing can drift | Different model/thinking needed |
| Reduce API calls by combining | One-shot reminders |

---

## Safety

- Don't exfiltrate private data. Ever.
- `trash` > `rm`
- Ask before sending external messages
- When in doubt, ask.

---

## Memory

- **Daily notes:** `memory/YYYY-MM-DD.md`
- **Long-term:** `MEMORY.md` (main session only)
- **Pending:** `PENDING.md` — track all commitments
- Write to memory IMMEDIATELY when something important happens
- "Mental notes" don't survive restarts. Files do.

---

*Prototype v1 — Sybil, 2026-02-14. Pending Saber's subagent architecture additions.*
