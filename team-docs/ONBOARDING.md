# VULKN Agent Onboarding Guide

**Last Updated:** 2026-02-25  
**Maintainer:** Sybil

Welcome to the team! This guide gets you fully set up with all VULKN tools and services.

---

## Quick Start (TL;DR)

```bash
# 1. Install all CLIs
brew install gh vercel-cli railway supabase/tap/supabase steipete/tap/gogcli
brew tap twilio/brew && brew install twilio
npm install -g @mendable/firecrawl-js

# 2. Get credentials from Bridget/Johan:
#    - vulkn-service-account.json (Google)
#    - API keys for ManyChat, Twilio, Firecrawl

# 3. Auth everything (see sections below)
```

---

## 1. Google Workspace (Gmail, Calendar, Drive, Docs, Sheets)

All agents use service account impersonation — no OAuth dance needed.

### Setup

```bash
# Install gog CLI
brew install steipete/tap/gogcli

# Save service account key (get from Bridget)
mkdir -p ~/.config/gog
# Save vulkn-service-account.json to ~/.config/gog/

# Configure for your email
gog auth service-account set --key=~/.config/gog/vulkn-service-account.json YOUR_NAME@vulkn-ai.com

# Set default account
echo "YOUR_NAME@vulkn-ai.com" > ~/.config/gog/account.txt
```

### Test

```bash
gog gmail search 'in:inbox' --max 3
```

### Common Commands

```bash
# Gmail
gog gmail search 'in:inbox newer_than:7d' --max 10
gog gmail send --to recipient@example.com --subject "Subject" --body "Message"

# Calendar
gog calendar events primary --from 2026-02-25 --to 2026-03-01
gog calendar create primary --summary "Meeting" --from 2026-02-26T10:00:00 --to 2026-02-26T11:00:00

# Drive
gog drive search "name contains 'report'" --max 10

# Sheets
gog sheets get SHEET_ID "Sheet1!A1:D10" --json
gog sheets update SHEET_ID "Sheet1!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED

# Docs
gog docs cat DOCUMENT_ID
```

### Team Emails

| Agent | Email |
|-------|-------|
| Bridget | scarlett@vulkn-ai.com |
| Sam | sam@vulkn-ai.com |
| Santos | santos@vulkn-ai.com |
| Saber | saber@vulkn-ai.com |
| Sage | sage@vulkn-ai.com |
| Sybil | sibyl@vulkn-ai.com |
| Vulki | vulkimi.testeo@vulkn-ai.com |

---

## 2. GitHub (VULKN-AI org)

```bash
# Install
brew install gh

# Auth (interactive - use your GitHub account)
gh auth login

# Verify
gh auth status
```

### Common Commands

```bash
# Clone a repo
gh repo clone VULKN-AI/repo-name

# Create PR
gh pr create --title "Feature" --body "Description"

# Check PR status
gh pr status

# View issues
gh issue list --repo VULKN-AI/repo-name

# Create issue
gh issue create --title "Bug" --body "Description"
```

**Skill:** `skills/github/SKILL.md`

---

## 3. Vercel (Frontend Deployment)

```bash
# Install
brew install vercel-cli

# Login
vercel login
```

### Common Commands

```bash
# Deploy (from project directory)
vercel              # Preview deployment
vercel --prod       # Production deployment

# List deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Environment variables
vercel env add VARIABLE_NAME
vercel env ls
```

**Skill:** `skills/vulkn-software-manager/vercel/SKILL.md`

---

## 4. Railway (Backend Deployment)

```bash
# Install
brew install railway

# Login
railway login
```

### Common Commands

```bash
# Link to existing project
railway link

# Deploy
railway up

# View logs
railway logs

# Environment variables
railway variables set KEY=value
railway variables

# Open dashboard
railway open
```

**Skill:** `skills/vulkn-software-manager/railway/SKILL.md`

---

## 5. Supabase (Database + Auth)

```bash
# Install
brew install supabase/tap/supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### Common Commands

```bash
# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs

# Start local dev
supabase start
supabase stop
```

### API Usage (Node.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Query
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', 'value')

// Insert
await supabase.from('table').insert({ column: 'value' })

// Auth
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

**Skill:** `skills/vulkn-software-manager/supabase/SKILL.md`

---

## 6. ManyChat (Chatbot API)

No CLI — use REST API directly.

### Setup

Add to your environment:
```bash
export MANYCHAT_API_KEY="your-api-key"
```

### Common Requests

```bash
# Get subscriber info
curl -X GET "https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=USER_ID" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"

# Send message
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

# Trigger flow
curl -X POST "https://api.manychat.com/fb/sending/sendFlow" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "USER_ID",
    "flow_ns": "FLOW_NAMESPACE"
  }'
```

**Docs:** https://api.manychat.com/swagger

---

## 7. Twilio (SMS/Voice)

```bash
# Install
brew tap twilio/brew && brew install twilio

# Login
twilio login
```

### Common Commands

```bash
# Send SMS
twilio api:core:messages:create \
  --from "+1YOURTWILIONUMBER" \
  --to "+1RECIPIENTNUMBER" \
  --body "Hello from Twilio!"

# List messages
twilio api:core:messages:list

# Make call
twilio api:core:calls:create \
  --from "+1YOURTWILIONUMBER" \
  --to "+1RECIPIENTNUMBER" \
  --url "http://demo.twilio.com/docs/voice.xml"
```

### API Usage (Node.js)

```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
await client.messages.create({
  body: 'Hello!',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1RECIPIENTNUMBER'
});
```

**Docs:** https://www.twilio.com/docs

---

## 8. Firecrawl (Web Scraping)

```bash
# Option 1: CLI
npx -y firecrawl-cli@latest init --all

# Option 2: Node.js
npm install @mendable/firecrawl-js
```

### Usage

```bash
# CLI
firecrawl https://example.com

# curl
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

### Node.js

```javascript
import Firecrawl from '@mendable/firecrawl-js';

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
const result = await app.scrape("https://example.com");
console.log(result.data.markdown);
```

**Docs:** https://docs.firecrawl.dev

---

## 9. A2A (Agent-to-Agent Communication)

### Setup

```bash
# Clone the skill (if not already in workspace)
cd ~/.openclaw/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/A2A-BJS-INTERNAL-SKILL.git a2a-protocol

# Run setup wizard
cd a2a-protocol
./scripts/setup.sh

# Start daemon
./scripts/daemon-start.sh

# Test
./scripts/test.sh
```

### Common Commands

```bash
# Send message to another agent
./scripts/daemon-send.sh sam '{"message":"Hello!"}' --subject "Test" --type notification

# Check inbox
./scripts/daemon-inbox.sh

# See who's online
./scripts/agents.sh

# Daemon control
./scripts/daemon-status.sh
./scripts/daemon-start.sh
./scripts/daemon-stop.sh
```

### Agent IDs

| Agent | ID | Telegram |
|-------|-----|----------|
| Sam | 62bb0f39-2248-4b14-806d-1c498c654ee7 | @sam_ctxt_bot |
| Sage | f6198962-313d-4a39-89eb-72755602d468 | @Sage_ctxt_Agent_bot |
| Sybil | 5fae1839-ab85-412c-acc0-033cbbbbd15b | @sybil_ctxt_bot |
| Santos | e7fabc18-75fa-4294-bd7d-9e5ed0dedacb | @santos_ctxt_bot |
| Saber | 415a84a4-af9e-4c98-9d48-040834436e44 | @saber_ctxt_bot |

**Skill:** `skills/a2a-protocol/SKILL.md`

---

## Environment Variables Template

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Google (handled by gog CLI + service account)

# GitHub (auto-configured by gh auth)

# Supabase
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
export SUPABASE_SERVICE_KEY="eyJ..."

# ManyChat
export MANYCHAT_API_KEY="..."

# Twilio
export TWILIO_ACCOUNT_SID="AC..."
export TWILIO_AUTH_TOKEN="..."
export TWILIO_PHONE_NUMBER="+1..."

# Firecrawl
export FIRECRAWL_API_KEY="fc-..."
```

---

## Checklist

- [ ] Got service account key from Bridget
- [ ] Installed all CLIs (`gh`, `vercel`, `railway`, `supabase`, `gog`, `twilio`)
- [ ] Configured Google Workspace (`gog auth service-account set`)
- [ ] Authenticated GitHub (`gh auth login`)
- [ ] Authenticated Vercel (`vercel login`)
- [ ] Authenticated Railway (`railway login`)
- [ ] Authenticated Supabase (`supabase login`)
- [ ] Authenticated Twilio (`twilio login`)
- [ ] Set up A2A daemon
- [ ] Added environment variables
- [ ] Tested each service

---

## Getting Help

- **Sybil** — ML/Research, tooling setup, Google Workspace
- **Sage** — Backend, infrastructure
- **Sam** — Frontend, UX
- **Santos** — Operations
- **Saber** — Sales, marketing

Or ask in the team Telegram group: `-5165191591`

---

*Welcome to the team! 🚀*
