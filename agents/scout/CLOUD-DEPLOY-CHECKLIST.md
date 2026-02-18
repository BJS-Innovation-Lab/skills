# Cloud Agent Deployment Checklist — Railway

> Complete pre-flight checklist for deploying a new VULKN field agent on Railway.
> Every step documented so we can eventually script it.

---

## Phase 0: Pre-Deployment Setup (One-Time / Per Agent)

These are things Bridget/Johan need to do BEFORE we touch Railway.

### 0.1 Agent Identity
- [ ] **Choose agent name** (e.g. "Luna", "Rex", etc.)
- [ ] **Assign agent role** (Field Agent, Support, etc.)
- [ ] **Choose agent emoji** 
- [ ] **Decide timezone** for the agent (matches client timezone)
- [ ] **Decide model** — `claude-sonnet-4` for field agents (cost-effective), `claude-opus-4` for HQ/research

### 0.2 Google Workspace Email
- [ ] **Create email** in Google Workspace: `{agentname}@vulkn-ai.com`
  - Go to: admin.google.com → Users → Add new user
  - First name: Agent name, Last name: VULKN
  - Email: `{agentname}@vulkn-ai.com`
- [ ] **Save credentials** — we'll need them for `gog` (Google Workspace CLI) auth later
- [ ] **Set up Google Calendar** sharing with team if needed

### 0.3 Telegram Bot
- [ ] **Create bot** via @BotFather in Telegram:
  1. Send `/newbot` to @BotFather
  2. Name: `{AgentName} VULKN` 
  3. Username: `{agentname}_vulkn_bot` (or similar available name)
  4. **Save the bot token** (looks like `123456789:AAHdqTc...`)
- [ ] **Set bot description** via `/setdescription` — brief intro for clients
- [ ] **Set bot profile photo** via `/setuserpic`
- [ ] **Disable group privacy** if needed: `/setprivacy` → Disable (so bot reads all group messages)

### 0.4 Anthropic API Key
- [ ] **Generate API key** at console.anthropic.com
  - Option A: Use shared BJS org key (simpler)
  - Option B: Create per-agent key (better isolation, easier cost tracking)
- [ ] **Save the key** — starts with `sk-ant-...`

### 0.5 A2A Registration
- [ ] **Generate agent UUID**: `node -e "console.log(require('crypto').randomUUID())"`
- [ ] **Register with A2A relay** (Sybil can do this via A2A admin)
- [ ] **Save agent UUID** for config

### 0.6 Client Assignment (if known)
- [ ] **Client name** and business type
- [ ] **Client's Telegram ID** (they need to message the bot first, then we get their ID)
- [ ] **Client timezone**

---

## Phase 1: Railway Deployment

### 1.1 Create Railway Service
- [ ] Go to [railway.com](https://railway.com) → New Project
- [ ] **Deploy from template**: Use the OpenClaw Railway template
  - Or: New Service → Docker → `ghcr.io/openclaw/openclaw:latest`
- [ ] **Add Volume** mounted at `/data` (1GB minimum)
- [ ] **Enable HTTP Proxy** — Port: `8080`

### 1.2 Set Railway Environment Variables

**Required:**
```
SETUP_PASSWORD=<generate-a-strong-password>
PORT=8080
OPENCLAW_STATE_DIR=/data/.openclaw
OPENCLAW_WORKSPACE_DIR=/data/workspace
OPENCLAW_GATEWAY_TOKEN=<generate-a-token>
```

**How to generate tokens:**
```bash
# On your local machine:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Set `SETUP_PASSWORD`
- [ ] Set `PORT=8080`
- [ ] Set `OPENCLAW_STATE_DIR=/data/.openclaw`
- [ ] Set `OPENCLAW_WORKSPACE_DIR=/data/workspace`  
- [ ] Set `OPENCLAW_GATEWAY_TOKEN` (save this — needed for Control UI)

### 1.3 Complete Setup Wizard
- [ ] Open `https://<railway-domain>/setup`
- [ ] Enter `SETUP_PASSWORD`
- [ ] **Model provider**: Anthropic
- [ ] **API key**: Paste the Anthropic key from Phase 0.4
- [ ] **Default model**: `claude-sonnet-4` (or as decided)
- [ ] **Telegram**: Paste bot token from Phase 0.3
- [ ] Click **Run setup**
- [ ] **Verify**: Bot responds to a test message in Telegram

### 1.4 Note the Railway Domain
- [ ] **Save the public URL**: `https://<something>.up.railway.app`
- [ ] **Control UI**: `https://<domain>/openclaw#token=<GATEWAY_TOKEN>`

---

## Phase 2: Workspace Setup

SSH into the Railway container or use the Control UI terminal.

### 2.1 Clone Field Template
```bash
cd /data/workspace
# If workspace is empty:
git clone https://github.com/BJS-Innovation-Lab/vulkn-field-template.git .
# Or if it already has files:
git init && git remote add origin https://github.com/BJS-Innovation-Lab/vulkn-field-template.git
git fetch && git checkout main
```
- [ ] Template cloned

### 2.2 Install Shared Skills
```bash
cd /data/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/skills.git .
```
- [ ] Skills installed

### 2.3 Install Node Dependencies
```bash
cd /data/workspace/rag && npm install @supabase/supabase-js openai
```
- [ ] Dependencies installed

### 2.4 Configure Supabase Credentials
```bash
cat > /data/workspace/rag/.env << 'EOF'
SUPABASE_URL=https://fcgiuzmmvcnovaciykbx.supabase.co
SUPABASE_SERVICE_KEY=<SERVICE_KEY>
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_DB_PASSWORD=<DB_PASSWORD>
OPENAI_API_KEY=<OPENAI_KEY_FOR_EMBEDDINGS>
GEMINI_API_KEY=<GEMINI_KEY>
ANTHROPIC_API_KEY=<ANTHROPIC_KEY>
EOF
```
- [ ] `.env` configured

**⚠️ SECURITY NOTE**: These are shared BJS Supabase keys. RLS policies scope data by agent_id, but field agents technically have access to the shared database. Long-term: per-client Supabase projects.

### 2.5 Configure A2A
```bash
mkdir -p /data/.openclaw/a2a
cat > /data/.openclaw/a2a/config.json << EOF
{
  "agentId": "<UUID-FROM-PHASE-0.5>",
  "agentName": "<agent-name>",
  "relayUrl": "https://a2a-bjs-internal-skill-production-f15e.up.railway.app"
}
EOF
```
- [ ] A2A configured

### 2.6 Configure Notion API Key
```bash
mkdir -p ~/.config/notion
echo "<NOTION_API_KEY>" > ~/.config/notion/api_key
```
- [ ] Notion key saved

### 2.7 Set Up IDENTITY.md (CRITICAL — do NOT skip)
```bash
cat > /data/workspace/IDENTITY.md << EOF
# IDENTITY.md

- **Name:** <AgentName>
- **Creature:** AI Agent, VULKN / BJS LABS
- **Role:** <Role>
- **Vibe:** <Brief personality description>
- **Emoji:** <emoji>
- **Avatar:**
EOF
```
- [ ] IDENTITY.md written (**failure to do this causes identity contamination**)

---

## Phase 3: First Boot & Verification

### 3.1 Restart Gateway
```bash
openclaw gateway restart
```
- [ ] Gateway restarted

### 3.2 Send Test Message
- [ ] Message the bot on Telegram
- [ ] Agent finds BOOTSTRAP.md and starts onboarding conversation
- [ ] IDENTITY.md gets confirmed/updated during bootstrap
- [ ] BOOTSTRAP.md gets deleted after onboarding

### 3.3 Run Initial Memory Sync
```bash
cd /data/workspace/rag && node sync-memory.cjs --all
```
- [ ] Memory synced to Supabase (check that agent shows up in `documents` table)

### 3.4 Verify Agent UUID in Supabase
```bash
# Should show rows with the new agent's UUID
node -e "
const {SUPABASE_URL, SUPABASE_SERVICE_KEY} = require('dotenv').config({path:'rag/.env'}).parsed;
fetch(SUPABASE_URL+'/rest/v1/documents?agent_name=eq.<agentname>&select=id&limit=1', {
  headers: {apikey: SUPABASE_SERVICE_KEY, Authorization: 'Bearer '+SUPABASE_SERVICE_KEY}
}).then(r=>r.json()).then(d=>console.log(d.length ? '✅ Agent in Supabase' : '❌ No docs found'));
"
```
- [ ] Agent has documents in Supabase

---

## Phase 4: Cron Jobs

Add these via the Control UI or `openclaw cron add`:

### Required Crons
- [ ] **Memory sync** — every 30 min
- [ ] **Boot memory refresh** — every 4 hours
- [ ] **Conversation sync** — every 30 min
- [ ] **Nightly report** — 10 PM agent timezone
- [ ] **Self-improvement review** — 11 PM agent timezone
- [ ] **Memory Guardian scan** — every 6 hours
- [ ] **Session reset** — 4 AM agent timezone
- [ ] **Auto-update** — 3 AM Mondays
- [ ] **Thread archival** — 4 AM Mondays
- [ ] **Disk cleanup** — 3 AM, 1st of month

See `deploy/DEPLOY.md` for exact cron commands.

---

## Phase 5: Post-Deploy Verification

### 5.1 Connectivity
- [ ] Agent responds on Telegram
- [ ] A2A messages reach HQ (Sybil can send a test)
- [ ] Memory sync cron running (check `rag/.sync-state.json`)
- [ ] Heartbeat active

### 5.2 Security
- [ ] Run Memory Guardian: `node skills/memory-guardian/scripts/memory-scan.cjs`
- [ ] Verify IDENTITY.md is correct (not someone else's identity!)
- [ ] Verify `core/team.md` correctly identifies the agent
- [ ] No cross-agent contamination in MEMORY.md

### 5.3 Logging
- [ ] Log deployment to BJS Daily Changelog:
  ```bash
  node rag/log-changelog.cjs "Deployed <AgentName> to Railway" --category Ops --repo workspace
  ```
- [ ] Update `agents/scout/OPS-PLAYBOOK.md` with any new lessons learned

---

## Credential Summary (What You Need Before Starting)

| Credential | Where to get it | Who creates it |
|---|---|---|
| Anthropic API key | console.anthropic.com | Bridget/Johan |
| Telegram bot token | @BotFather | Bridget/Johan |
| Google Workspace email | admin.google.com | Bridget/Johan |
| Railway account | railway.com | Bridget/Johan |
| Agent UUID | `crypto.randomUUID()` | Sybil |
| Supabase keys | Already have (shared BJS) | — |
| OpenAI key (embeddings) | Already have | — |
| Gemini key | Already have | — |
| Notion API key | Already have | — |
| SETUP_PASSWORD | Generate fresh | Bridget/Johan |
| GATEWAY_TOKEN | Generate fresh | Bridget/Johan |

---

## What Sybil Handles (After You Provide Credentials)

Once Bridget/Johan provides the credentials above, Sybil can:
1. Configure the workspace files (IDENTITY.md, .env, A2A config)
2. Register the agent with A2A relay
3. Set up all cron jobs
4. Run first memory sync
5. Verify deployment
6. Log to changelog

---

## Estimated Time

| Phase | Time | Who |
|---|---|---|
| Phase 0 (pre-deploy) | 15-20 min | Bridget/Johan |
| Phase 1 (Railway) | 10 min | Bridget/Johan |
| Phase 2 (workspace) | 10 min | Bridget/Johan + Sybil |
| Phase 3 (first boot) | 5 min | Sybil |
| Phase 4 (crons) | 5 min | Sybil |
| Phase 5 (verification) | 5 min | Sybil |
| **Total** | **~45-60 min** | |

After the first deploy, this becomes a repeatable recipe. Scout will eventually handle Phases 2-5 autonomously.
