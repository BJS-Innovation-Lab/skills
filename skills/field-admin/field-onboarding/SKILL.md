---
name: field-onboarding
description: First-run checklist for deploying a field agent to a new SMB client. Verifies profile, channels, connectivity, and cron setup. Domain knowledge handled by Johan.
metadata: {"openclaw":{"emoji":"🚀"}}
---

# Field Onboarding Skill

> **Get the agent deployed right the first time. Johan handles the domain setup — this handles the technical checklist.**

## Overview

When a field agent is deployed to a new client, this checklist ensures everything is wired up correctly before the agent starts working. Johan (co-founder) handles the domain-specific onboarding — introducing the agent to the client, configuring industry-specific knowledge, and establishing the relationship. This skill handles the technical readiness.

## First-Run Checklist

Run this on the agent's first boot for a new client.

> **Before anything:** Read `CONFIG.md` in the field-admin skill directory. Johan should have filled in `config/field-admin.json` during client setup.

### ✅ Phase 0: Configuration
- [ ] `config/field-admin.json` exists and all fields are filled
- [ ] CS agent ID is set (currently Sam: `62bb0f39-2248-4b14-806d-1c498c654ee7`)
- [ ] Client timezone is correct
- [ ] Client language is set

### ✅ Phase 1: Identity & Profile
- [ ] Client name and business type confirmed
- [ ] `clients/{client-name}/` directory exists
- [ ] Brand profile docs exist (story.md, voice.md, customers.md, learnings.md)
- [ ] If NO profile exists → flag to Johan for intake interview. **Do not create marketing content without a profile.**
- [ ] Agent identity configured (name, greeting, personality aligned to client)

### ✅ Phase 2: Communication Channels
- [ ] Primary channel confirmed (WhatsApp / Telegram / Email / SMS)
- [ ] Channel credentials configured and tested
- [ ] Send test message to client: "Hi {name}, your agent is set up and ready!"
- [ ] Backup channel configured (if applicable)
- [ ] Client's preferred language confirmed
- [ ] Response time expectations set

### ✅ Phase 3: HQ Connectivity
- [ ] A2A daemon running and connected
- [ ] Test message sent to CS agent (Sam) at HQ
- [ ] Test message received back from CS agent (round-trip confirmed)
- [ ] Escalation skill loaded and CS agent ID configured from `config/field-admin.json`
- [ ] Nightly report cron job created using config values (see `CONFIG.md` for exact cron command)
- [ ] Test nightly report sent successfully

### ✅ Phase 4: Skills Verification
- [ ] Marketing module loaded (if applicable)
  - [ ] social-content
  - [ ] email-campaigns
  - [ ] landing-page-copy
  - [ ] content-log
  - [ ] creativity-engine
  - [ ] marketing-creativity
- [ ] Field admin module loaded
  - [ ] escalation
  - [ ] nightly-report
- [ ] Any client-specific skills loaded
- [ ] Test each critical skill with a dry run

### ✅ Phase 5: First Interaction
- [ ] Johan introduces agent to client
- [ ] Agent sends welcome message with capabilities overview
- [ ] Client confirms receipt and preferred communication style
- [ ] First task assigned and completed (quick win to build trust)
- [ ] Results logged to content tracker

## Post-Onboarding

After checklist is complete:
1. Send onboarding confirmation to HQ CS agent
2. Log onboarding details to `memory/onboarding-{client-name}.md`
3. Start normal operations — escalation monitoring + nightly reports active

## Johan's Role

Johan handles the human side of onboarding:
- Client introductions and relationship setup
- Industry-specific configuration and knowledge
- Setting expectations with the client
- First-week check-ins

**This skill does NOT replace Johan's onboarding** — it supplements it with technical readiness.
