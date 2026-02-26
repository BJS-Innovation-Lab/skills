# Vulki Tooling Setup Guide

**Created:** 2026-02-25 by Sybil

## 1. GitHub (VULKN-AI org)

```bash
# Install
brew install gh

# Auth (use VULKN GitHub account)
gh auth login

# Clone repos
gh repo clone VULKN-AI/repo-name

# Create PR
gh pr create --title "Feature" --body "Description"

# Push code
git push origin branch-name
```

**Skill:** Read `skills/github/SKILL.md` for full reference.

---

## 2. Vercel (Frontend Deployment)

```bash
# Install
brew install vercel-cli
# or: npm i -g vercel

# Login
vercel login

# Deploy (from project directory)
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# Environment variables
vercel env add VARIABLE_NAME
```

**Skill:** Read `skills/vulkn-software-manager/vercel/SKILL.md`

---

## 3. Railway (Backend Deployment)

```bash
# Install
brew install railway
# or: npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs

# Environment variables
railway variables set KEY=value
```

**Skill:** Read `skills/vulkn-software-manager/railway/SKILL.md`

---

## 4. Supabase (Database + Auth)

```bash
# Install
brew install supabase/tap/supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs
```

**API Usage (from code):**
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
```

**Skill:** Read `skills/vulkn-software-manager/supabase/SKILL.md`

---

## 5. ManyChat API

No CLI - use REST API directly.

```bash
# Get user info
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

## 6. Twilio (SMS/Voice)

```bash
# Install CLI
brew tap twilio/brew && brew install twilio

# Login
twilio login

# Send SMS
twilio api:core:messages:create \
  --from "+1YOURTWILIONUMBER" \
  --to "+1RECIPIENTNUMBER" \
  --body "Hello from Twilio!"

# Make call
twilio api:core:calls:create \
  --from "+1YOURTWILIONUMBER" \
  --to "+1RECIPIENTNUMBER" \
  --url "http://demo.twilio.com/docs/voice.xml"
```

**From code (Node.js):**
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
await client.messages.create({
  body: 'Hello!',
  from: '+1YOURTWILIONUMBER',
  to: '+1RECIPIENTNUMBER'
});
```

**Docs:** https://www.twilio.com/docs/usage/api

---

## Quick Install All

```bash
# All CLIs at once
brew install gh vercel-cli railway supabase/tap/supabase
brew tap twilio/brew && brew install twilio

# Auth all
gh auth login
vercel login
railway login
supabase login
twilio login
```

---

## Environment Variables

Add to your shell profile or `.env`:

```bash
# GitHub
export GITHUB_TOKEN="ghp_..."

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

*Questions? Ask Sybil via A2A.*
