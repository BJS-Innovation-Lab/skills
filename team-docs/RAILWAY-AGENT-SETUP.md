# Railway Agent Setup Guide

**For:** Vulki 🩷 and other cloud-deployed agents  
**Created:** 2026-02-25 by Sybil

---

## Overview

Running an OpenClaw agent on Railway differs from local Mac setups. This guide covers the adaptations needed.

**Key differences:**
- Linux (not macOS) — use `apt`/`npm` instead of `brew`
- Ephemeral filesystem — need Volumes for persistence
- Single process model — daemons need different handling
- No GUI — everything via CLI/API

---

## 1. Persistent Storage (Volumes)

Railway's filesystem resets on each deploy. Mount a Volume for anything that needs to persist.

### Railway Dashboard

1. Go to your service → Settings → Volumes
2. Add a volume mounted at `/data`

### Directory Structure

```
/data/
├── workspace/           # Your working directory
│   ├── skills/          # Skill files
│   ├── memory/          # Daily logs
│   └── MEMORY.md        # Boot memory
├── a2a/                 # A2A daemon data
│   ├── inbox.json
│   ├── status.json
│   └── daemon.log
└── credentials/         # Service account keys
    └── vulkn-service-account.json
```

### Environment Variables

Set in Railway Dashboard → Variables:

```bash
# Core
WORKSPACE=/data/workspace
HOME=/data

# Model (important!)
AGENT_MODEL=minimax/minimax-2.5
DEFAULT_MODEL=minimax/minimax-2.5

# Google Workspace
GOOGLE_APPLICATION_CREDENTIALS=/data/credentials/vulkn-service-account.json
GOG_SERVICE_ACCOUNT=/data/credentials/vulkn-service-account.json

# APIs
MANYCHAT_API_KEY=your-key
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
FIRECRAWL_API_KEY=fc-...

# A2A
A2A_RELAY_URL=https://a2a-bjs-internal-skill-production-f15e.up.railway.app
A2A_AGENT_ID=your-uuid
A2A_AGENT_NAME=Vulki
A2A_DATA_DIR=/data/a2a
```

---

## 2. Package Installation

### Dockerfile or railway.toml

Add to your Dockerfile:

```dockerfile
FROM node:20-slim

# System packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Node CLIs
RUN npm install -g \
    @mendable/firecrawl-js \
    vercel

# Working directory
WORKDIR /data/workspace
```

Or use `railway.toml`:

```toml
[build]
builder = "nixpacks"

[build.nixpacks]
aptPkgs = ["curl", "git", "jq", "python3"]
```

### CLIs Available via npx (no install needed)

```bash
npx firecrawl-cli https://example.com
npx @railway/cli status
```

---

## 3. Google Workspace Setup

### Upload Service Account Key

1. Get `vulkn-service-account.json` from Bridget
2. Store in `/data/credentials/` (on your Volume)
3. Set env var: `GOOGLE_APPLICATION_CREDENTIALS=/data/credentials/vulkn-service-account.json`

### Option A: Use gog CLI (if available)

```bash
# Install gog (may need to build from source on Linux)
# Check: https://github.com/steipete/gog

gog auth service-account set \
  --key=/data/credentials/vulkn-service-account.json \
  vulkimi.testeo@vulkn-ai.com

gog gmail search 'in:inbox' --max 3
```

### Option B: Direct API Calls (works everywhere)

```javascript
// Using Google APIs directly with service account
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  clientOptions: {
    subject: 'vulkimi.testeo@vulkn-ai.com'  // impersonate this user
  }
});

const gmail = google.gmail({ version: 'v1', auth });

// Send email
await gmail.users.messages.send({
  userId: 'me',
  requestBody: {
    raw: Buffer.from(
      `To: recipient@example.com\r\n` +
      `Subject: Hello\r\n\r\n` +
      `Message body here`
    ).toString('base64')
  }
});

// Search inbox
const res = await gmail.users.messages.list({
  userId: 'me',
  q: 'in:inbox',
  maxResults: 10
});
```

### Option C: Simple curl wrapper

```bash
#!/bin/bash
# google-api.sh - Simple wrapper using service account

# Get access token
TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
    "assertion": "'$(node -e "
      const jwt = require('jsonwebtoken');
      const key = require('$GOOGLE_APPLICATION_CREDENTIALS');
      const token = jwt.sign({
        iss: key.client_email,
        sub: 'vulkimi.testeo@vulkn-ai.com',
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        aud: 'https://oauth2.googleapis.com/token',
        iat: Math.floor(Date.now()/1000),
        exp: Math.floor(Date.now()/1000) + 3600
      }, key.private_key, { algorithm: 'RS256' });
      console.log(token);
    ")'"
  }' | jq -r '.access_token')

# Use token for API calls
curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. A2A Setup (Two Options)

### Option A: Daemon as Separate Service (Recommended)

Create a separate Railway service just for A2A:

**a2a-daemon/package.json:**
```json
{
  "name": "vulki-a2a-daemon",
  "scripts": {
    "start": "node daemon.js"
  },
  "dependencies": {
    "ws": "^8.0.0"
  }
}
```

**a2a-daemon/daemon.js:**
```javascript
const WebSocket = require('ws');
const fs = require('fs');

const RELAY_URL = process.env.A2A_RELAY_URL;
const AGENT_ID = process.env.A2A_AGENT_ID;
const AGENT_NAME = process.env.A2A_AGENT_NAME;
const DATA_DIR = process.env.A2A_DATA_DIR || '/data/a2a';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function connect() {
  const ws = new WebSocket(`${RELAY_URL.replace('https', 'wss')}/ws`);
  
  ws.on('open', () => {
    console.log('Connected to A2A relay');
    ws.send(JSON.stringify({
      type: 'register',
      agentId: AGENT_ID,
      name: AGENT_NAME
    }));
  });
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('Received:', msg);
    
    // Save to inbox
    const inbox = JSON.parse(fs.readFileSync(`${DATA_DIR}/inbox.json`, 'utf8') || '[]');
    inbox.push({ ...msg, receivedAt: new Date().toISOString() });
    fs.writeFileSync(`${DATA_DIR}/inbox.json`, JSON.stringify(inbox, null, 2));
  });
  
  ws.on('close', () => {
    console.log('Disconnected, reconnecting in 5s...');
    setTimeout(connect, 5000);
  });
  
  ws.on('error', console.error);
}

connect();
```

### Option B: REST API Only (Simpler)

Skip the daemon and use REST endpoints:

```bash
# Check inbox via REST
curl -s "$A2A_RELAY_URL/messages/$A2A_AGENT_ID"

# Send message via REST
curl -X POST "$A2A_RELAY_URL/send" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$A2A_AGENT_ID'",
    "to": "62bb0f39-2248-4b14-806d-1c498c654ee7",
    "content": {"message": "Hello Sam!"},
    "subject": "Test"
  }'
```

---

## 5. ManyChat (Works as-is)

Just set the env var and use curl:

```bash
export MANYCHAT_API_KEY="your-key"

curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "USER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [{"type": "text", "text": "Hello!"}]
      }
    }
  }'
```

**Skill:** `skills/manychat/SKILL.md` works unchanged.

---

## 6. Twilio (Works as-is)

```bash
export TWILIO_ACCOUNT_SID="AC..."
export TWILIO_AUTH_TOKEN="..."

# Send SMS via API
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "From=+1YOURNUM" \
  -d "To=+1RECIPIENT" \
  -d "Body=Hello from Vulki!"
```

Or use Node.js:
```bash
npm install twilio
```

---

## 7. Firecrawl (Works as-is)

```bash
export FIRECRAWL_API_KEY="fc-..."

curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

---

## 8. Memory Skills Setup

### Environment for Model Selection

```bash
# Critical! Set your model so skills don't default to Sonnet
export AGENT_MODEL="minimax/minimax-2.5"
```

### Install Skills

```bash
cd /data/workspace/skills

# Clone memory skills
git clone https://github.com/BJS-Innovation-Lab/skills.git temp-skills
cp -r temp-skills/agentic-learning ./
cp -r temp-skills/memory-retriever ./
cp -r temp-skills/risk-oracle ./
cp -r temp-skills/self-improvement-pipeline ./
rm -rf temp-skills

# Install dependencies
cd memory-retriever && npm install
```

### Memory File Structure

```
/data/workspace/
├── memory/
│   ├── 2026-02-25.md      # Daily log
│   ├── 2026-02-26.md
│   └── core/
│       └── clients.md     # Persistent facts
├── MEMORY.md              # Boot memory
└── skills/
    └── ...
```

---

## 9. Cron Jobs on Railway

Railway supports cron via separate services.

### Create a Cron Service

**cron-service/package.json:**
```json
{
  "name": "vulki-cron",
  "scripts": {
    "nightly": "node nightly-report.js",
    "hourly": "node health-check.js"
  }
}
```

**railway.toml:**
```toml
[service]
name = "vulki-cron"

[[cron]]
schedule = "0 0 * * *"  # Midnight UTC
command = "npm run nightly"

[[cron]]
schedule = "0 * * * *"  # Every hour
command = "npm run hourly"
```

---

## 10. Quick Start Checklist

- [ ] Volume mounted at `/data`
- [ ] Environment variables set (especially `AGENT_MODEL`)
- [ ] Service account JSON uploaded to `/data/credentials/`
- [ ] Skills cloned to `/data/workspace/skills/`
- [ ] A2A configured (daemon or REST)
- [ ] Test each service:
  - [ ] `curl` ManyChat API
  - [ ] Google Sheets read/write
  - [ ] Firecrawl scrape
  - [ ] A2A send/receive

---

## Troubleshooting

### "File not found" after deploy
→ You're writing to ephemeral storage. Use `/data/` (your Volume) instead.

### "Permission denied"
→ Railway runs as non-root. Check file permissions on your Volume.

### A2A messages not arriving
→ If using daemon, check it's running. If REST-only, poll `/messages` endpoint.

### Google API 401 errors
→ Check `GOOGLE_APPLICATION_CREDENTIALS` points to valid JSON file on Volume.

### Skills defaulting to Sonnet
→ Set `AGENT_MODEL=minimax/minimax-2.5` in Railway Variables.

---

## Need Help?

- **Sybil** — Skills, memory setup, Google Workspace
- **Sage** — Backend, infrastructure, Railway config
- **Sam** — Frontend, deployment

Send A2A message or ask in team Telegram.

---

*Welcome to the cloud, Vulki! 🩷*
