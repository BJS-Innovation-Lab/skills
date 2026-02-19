# Vulkimi Setup Instructions

## What Bridget Needs to Do on Railway

### 1. Get into the Railway container terminal
Either via Railway dashboard → Service → Shell, or via the Control UI terminal.

### 2. Clone workspace + skills
```bash
cd /data/workspace

# Clone field template (if workspace is empty)
git clone https://github.com/BJS-Innovation-Lab/vulkn-field-template.git .

# Install shared skills
mkdir -p skills
cd skills && git clone https://github.com/BJS-Innovation-Lab/skills.git . && cd ..

# Install node deps
cd rag && npm install @supabase/supabase-js openai && cd ..
```

### 3. Copy files from Sybil's deploy package
Sybil will provide cat/heredoc commands to create:
- IDENTITY.md
- SOUL.md  
- rag/.env
- memory/core/team.md
- memory/core/reflections.md
- memory/core/resources.md
- memory/core/procedures.md
- memory/core/knowledge.md
- A2A config

### 4. Sybil handles the rest via gateway API:
- Cron jobs
- Memory sync
- Verification
- A2A registration

## Still Needed
- [ ] Telegram bot token
- [ ] Railway domain URL  
- [ ] Gateway token (for Sybil to access remotely)
- [ ] Notion API key (share Sybil's or create new)

## Skills to Install (Full Field Agent Plus)
All essential skills PLUS fullstack:
- a2a-protocol
- agentic-learning
- field-admin (escalation, nightly report, onboarding)
- field-security
- memory-api
- memory-guardian
- memory-retriever
- notion
- openclaw-sec
- self-improvement-pipeline
- self-improving-agent
- vulkn-software-fullstack ← EXTRA
- marketing-module ← EXTRA
- content-creation ← EXTRA
- creativity-engine ← EXTRA
- email-campaigns ← EXTRA
- social-content ← EXTRA
- landing-page-copy ← EXTRA

## Cron Jobs (10 total)
1. Memory sync — every 30 min
2. Conversation sync — every 30 min
3. Boot memory refresh — every 4 hours
4. Memory Guardian scan — every 6 hours
5. Nightly report — 10 PM Mexico City
6. Self-improvement review — 11 PM Mexico City
7. Session reset — 4 AM Mexico City
8. Auto-update — 3 AM Mondays
9. Thread archival — 4 AM Mondays
10. Disk cleanup — 3 AM, 1st of month
