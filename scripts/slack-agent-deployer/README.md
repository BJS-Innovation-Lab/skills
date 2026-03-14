# Slack Agent Deployer

Automated Slack app creation and client onboarding for VULKN agents.

## Features

1. **`deploy-internal`** - Create new agent app in VULKN Slack (Scout runs this)
2. **`generate-client-link`** - Create OAuth install link for customers
3. **`oauth-receiver`** - Webhook to catch client authorizations

## Quick Start

```bash
# Deploy new agent to VULKN Slack
./deploy.sh --agent sage --workspace vulkn

# Generate client install link  
./deploy.sh --agent sofia --client acme --generate-link

# Start OAuth receiver (runs on your server)
node oauth-receiver.js
```

## Requirements

- Slack Configuration Token (for creating apps via API)
- Your Slack App Client ID + Client Secret (for OAuth)
- Supabase or DB for storing client tokens

## Setup

1. Get a Configuration Token:
   - Go to https://api.slack.com/apps
   - Click your user menu → "Your apps" → "Generate Token"
   - This lets you create apps programmatically

2. Set environment variables:
   ```bash
   SLACK_CONFIG_TOKEN=xoxe-...
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   OAUTH_REDIRECT_URI=https://your-server.com/slack/oauth
   ```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Scout runs deploy                     │
│                           │                              │
│                           ▼                              │
│    ┌──────────────────────────────────────────┐         │
│    │         Slack App Manifest API           │         │
│    │   (creates app + generates tokens)       │         │
│    └──────────────────────────────────────────┘         │
│                           │                              │
│              ┌────────────┴────────────┐                │
│              ▼                         ▼                │
│    ┌─────────────────┐      ┌─────────────────┐         │
│    │  VULKN Slack    │      │  Client Slack   │         │
│    │  (auto-joined)  │      │  (OAuth link)   │         │
│    └─────────────────┘      └─────────────────┘         │
│                                      │                   │
│                                      ▼                   │
│                         ┌─────────────────┐              │
│                         │  OAuth Receiver │              │
│                         │  (stores tokens)│              │
│                         └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```
