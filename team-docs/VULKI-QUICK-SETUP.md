# Vulki Quick Setup 🩷

Copy-paste ready. Tested patterns only.

---

## ⚠️ DANGER ZONES (Learned from Sam's crashes)

**DON'T DO THESE:**

```bash
# ❌ NEVER hardcode ports — Railway assigns them dynamically
const PORT = 3000;  # WRONG - will cause zombie process

# ✅ ALWAYS use env var
const PORT = process.env.PORT || 3000;
```

```bash
# ❌ NEVER commit PID files or lock files — causes "already running" errors
.pid files
.lock files

# ✅ Add to .gitignore
echo "*.pid" >> .gitignore
echo "*.lock" >> .gitignore
```

```bash
# ❌ NEVER run A2A daemon in same process as main app
# If daemon crashes, takes down everything

# ✅ Run A2A as separate Railway service OR use REST-only mode
```

```bash
# ❌ NEVER use complex bootstrap scripts that might hang
# Health check will timeout and Railway will kill the container

# ✅ Keep startup simple: node src/server.js
```

---

## Environment Variables

**Copy this to Railway → Variables:**

```env
# Your model (CRITICAL - prevents defaulting to Sonnet)
AGENT_MODEL=minimax/minimax-2.5
DEFAULT_MODEL=minimax/minimax-2.5

# Workspace paths
WORKSPACE=/data/workspace
HOME=/data

# Google (after uploading service account JSON to /data/credentials/)
GOOGLE_APPLICATION_CREDENTIALS=/data/credentials/vulkn-service-account.json

# ManyChat
MANYCHAT_API_KEY=<your-key>

# A2A (optional - only if setting up A2A)
A2A_RELAY_URL=https://a2a-bjs-internal-skill-production-f15e.up.railway.app
A2A_AGENT_NAME=Vulki
```

---

## ManyChat (Works Now)

```bash
# Test it
curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "TEST_USER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [{"type": "text", "text": "Test from Vulki!"}]
      }
    }
  }'
```

---

## Google Sheets (Safe Pattern)

**Step 1: Upload credentials**

Get `vulkn-service-account.json` from Bridget and save to `/data/credentials/`

**Step 2: Install googleapis**

```bash
npm install googleapis
```

**Step 3: Use this safe pattern**

```javascript
// google-helper.js — Safe pattern for Railway
const { google } = require('googleapis');

async function getAuth(userEmail) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar'
    ],
  });
  
  const client = await auth.getClient();
  // Impersonate the user
  client.subject = userEmail;
  return client;
}

// Read from Sheets
async function readSheet(spreadsheetId, range) {
  const auth = await getAuth('vulkimi.testeo@vulkn-ai.com');
  const sheets = google.sheets({ version: 'v4', auth });
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  
  return res.data.values;
}

// Write to Sheets
async function writeSheet(spreadsheetId, range, values) {
  const auth = await getAuth('vulkimi.testeo@vulkn-ai.com');
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

module.exports = { getAuth, readSheet, writeSheet };
```

**Step 4: Test**

```javascript
const { readSheet } = require('./google-helper');

// Test read
const data = await readSheet('YOUR_SHEET_ID', 'Sheet1!A1:D10');
console.log(data);
```

---

## Send Email (Safe Pattern)

```javascript
const { google } = require('googleapis');
const { getAuth } = require('./google-helper');

async function sendEmail(to, subject, body) {
  const auth = await getAuth('vulkimi.testeo@vulkn-ai.com');
  const gmail = google.gmail({ version: 'v1', auth });
  
  // Create email
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\r\n');
  
  const encodedEmail = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail },
  });
  
  console.log(`Email sent to ${to}`);
}
```

---

## Firecrawl (Works Now)

```bash
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

---

## A2A — REST Only Mode (Safest)

Skip the daemon complexity. Just poll for messages:

```javascript
// a2a-simple.js — No daemon needed
const A2A_RELAY = process.env.A2A_RELAY_URL;
const AGENT_ID = process.env.A2A_AGENT_ID;

// Check for messages
async function checkInbox() {
  const res = await fetch(`${A2A_RELAY}/messages/${AGENT_ID}`);
  return res.json();
}

// Send message
async function sendMessage(toAgentId, content, subject) {
  await fetch(`${A2A_RELAY}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: AGENT_ID,
      to: toAgentId,
      content,
      subject
    })
  });
}

// Team agent IDs
const AGENTS = {
  sam: '62bb0f39-2248-4b14-806d-1c498c654ee7',
  sage: 'f6198962-313d-4a39-89eb-72755602d468',
  sybil: '5fae1839-ab85-412c-acc0-033cbbbbd15b',
  santos: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb',
  saber: '415a84a4-af9e-4c98-9d48-040834436e44'
};
```

---

## Memory Skills Setup

```bash
# Set model first!
export AGENT_MODEL="minimax/minimax-2.5"

# Clone just what you need
cd /data/workspace/skills
git clone --depth 1 https://github.com/BJS-Innovation-Lab/skills.git temp
cp -r temp/agentic-learning ./
cp -r temp/manychat ./
rm -rf temp
```

---

## Test Checklist

Run these to verify everything works:

```bash
# 1. Check env vars are set
echo $AGENT_MODEL  # Should show minimax/minimax-2.5

# 2. Test ManyChat
curl -s "https://api.manychat.com/fb/page/getInfo" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" | head -c 200

# 3. Test Google credentials exist
cat $GOOGLE_APPLICATION_CREDENTIALS | head -c 100

# 4. Test Firecrawl
curl -s -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://httpbin.org/get"}' | head -c 200
```

---

## If Something Breaks

1. **Container won't start** → Check Railway logs for port binding or PID errors
2. **Health check timeout** → Startup is too slow or hanging on something
3. **Google 401** → Credentials file missing or wrong path
4. **"Already running"** → Delete any .pid or .lock files from repo

**Emergency reset:**
```bash
# In Railway console
rm -f *.pid *.lock
# Then redeploy
```

---

*Keep it simple. Test each piece before adding more. — Sybil 🔬*
