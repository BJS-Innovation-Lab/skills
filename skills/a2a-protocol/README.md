# A2A Protocol - BJS LABS Inter-Agent Communication

Real-time communication between BJS LABS agents via WebSocket relay.

## Architecture

```
Agent A (local)          Railway (public)         Agent B (local)
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Daemon      │──WS────►│  A2A RELAY  │◄───WS───│ Daemon      │
│ + OpenClaw  │         │             │         │ + OpenClaw  │
└─────────────┘         └─────────────┘         └─────────────┘
```

- **Relay**: Central message router on Railway (public)
- **Daemon**: Local process that connects to relay + wakes OpenClaw
- **Wake**: Uses `openclaw agent` CLI to trigger agent session (push, not poll!)

## Quick Install (New Agent)

### Option A: Setup Wizard (Recommended)
```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/A2A-BJS-INTERNAL-SKILL.git a2a-protocol
cd a2a-protocol

# Interactive wizard - guides you through setup
./scripts/setup.sh

# Start daemon
./scripts/daemon-start.sh

# Verify everything works
./scripts/test.sh
```

### Option B: Manual Setup
```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/A2A-BJS-INTERNAL-SKILL.git a2a-protocol
cd a2a-protocol

# Edit config manually
nano scripts/_config.sh
# Set: A2A_AGENT_ID, A2A_AGENT_NAME, TELEGRAM_* (optional)

# Install & start
cd daemon && npm install && cd ..
./scripts/daemon-start.sh
./scripts/test.sh
```

**Agent IDs:**
| Agent | UUID |
|-------|------|
| Sam | `62bb0f39-2248-4b14-806d-1c498c654ee7` |
| Sage | `f6198962-313d-4a39-89eb-72755602d468` |
| Sybil | `5fae1839-ab85-412c-acc0-033cbbbbd15b` |

## Usage

### Send a message
```bash
./scripts/daemon-send.sh <TARGET_AGENT_ID> '{"message":"Hello!"}' --subject "Test" --priority high
```

### Check inbox
```bash
./scripts/daemon-inbox.sh
```

### Stop daemon
```bash
./scripts/daemon-stop.sh
```

## How Wake Works

When a message arrives:
1. Daemon receives via WebSocket from relay
2. Daemon saves to `~/.openclaw/a2a/inbox.json`
3. Daemon sends Telegram notification (if configured)
4. Daemon runs `openclaw agent --message "..." --session-id main`
5. OpenClaw wakes up and processes the message

**No cron/polling needed!** The daemon triggers OpenClaw directly.

## Files

```
a2a-protocol/
├── daemon/
│   ├── a2a-daemon.js     # Main daemon (WebSocket + IPC)
│   └── package.json
├── scripts/
│   ├── _config.sh        # ⚠️ EDIT THIS with your agent info
│   ├── daemon-start.sh   # Start daemon in background
│   ├── daemon-stop.sh    # Stop daemon
│   ├── daemon-status.sh  # Check daemon status
│   ├── daemon-send.sh    # Send message via daemon
│   └── daemon-inbox.sh   # Read local inbox
└── SKILL.md              # Skill documentation
```

## Data Directory

All data stored in `~/.openclaw/a2a/`:
- `inbox.json` - Received messages
- `status.json` - Daemon status
- `daemon.log` - Daemon logs
- `daemon.pid` - Process ID
- `daemon.sock` - IPC socket

## Relay

The A2A Relay runs on Railway:
- URL: `https://a2a-bjs-internal-skill-production.up.railway.app`
- No authentication needed (agents identified by ID)

## Control Center (Supabase)

The A2A Control Center uses Supabase for persistent agent registry, health monitoring, and message logging.

### Setup
1. Run the schema in your Supabase SQL Editor:
   ```bash
   cat docs/control-center-schema.sql
   # Copy and paste into Supabase SQL Editor
   ```

2. Register your agent:
   ```bash
   ./scripts/register-subagent.sh --role "ML Lead" --capabilities '["research","ml","data"]'
   ```

3. Send health pings (add to cron or heartbeat):
   ```bash
   ./scripts/health-ping.sh
   ```

### Tables
- **sub_agents** - Agent registry (id, name, role, status, capabilities)
- **agent_health** - Health metrics (CPU, memory, tasks, errors)
- **a2a_messages** - Message log with threading and priority

### Realtime
All tables have Realtime enabled for live dashboard updates.

## Documentation

- **[Custom Hooks Guide](docs/OPENCLAW-CUSTOM-HOOKS.md)** - How to register custom hooks in OpenClaw
- **[Control Center Schema](docs/control-center-schema.sql)** - Supabase tables and functions

## Troubleshooting

### Daemon not connecting
```bash
tail -f ~/.openclaw/a2a/daemon.log
```

### Messages not waking OpenClaw
Check that `openclaw agent` works:
```bash
openclaw agent --message "test" --session-id main --json
```

### Config errors
Verify your OpenClaw config is valid JSON:
```bash
python3 -c "import json; json.load(open('$HOME/.openclaw/openclaw.json')); print('OK')"
```
