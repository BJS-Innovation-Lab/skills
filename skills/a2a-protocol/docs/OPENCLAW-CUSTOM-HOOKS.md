# OpenClaw Custom Hooks Configuration

How to load custom hooks from your workspace skills into OpenClaw.

## The Problem

OpenClaw has built-in hooks in `/opt/homebrew/lib/node_modules/openclaw/dist/bundled/` (or similar on your platform), but custom hooks in your workspace are **not automatically loaded**.

If you create hooks in `~/.openclaw/workspace/skills/<skill>/hooks/`, OpenClaw won't find them unless you register them via config.

## The Solution

Add `hooks.internal.load.extraDirs` to your OpenClaw config:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": [
          "~/.openclaw/workspace/skills/agentic-learning/hooks",
          "~/.openclaw/workspace/skills/your-other-skill/hooks"
        ]
      }
    }
  }
}
```

### Via Gateway Tool (Recommended)

Ask OpenClaw to patch your config:

```
gateway(action="config.patch", raw='{"hooks":{"internal":{"enabled":true,"load":{"extraDirs":["~/.openclaw/workspace/skills/agentic-learning/hooks"]}}}}')
```

Or in conversation:
> "Patch my OpenClaw config to add hooks.internal.load.extraDirs pointing to my agentic-learning hooks"

### Manual Edit

Edit `~/.openclaw/openclaw.json` directly and restart:
```bash
# Edit config
nano ~/.openclaw/openclaw.json

# Add hooks section (see JSON above)

# Restart gateway
openclaw gateway restart
```

## Verify Hooks Loaded

```bash
openclaw hooks list
```

You should see your custom hooks listed with source `openclaw-workspace`:

```
│ ✓ ready   │ 🔗 decision-logger │ ... │ openclaw-workspace │
```

## Hook Structure

Each hook needs two files:

```
hooks/
  my-hook/
    HOOK.md      # Metadata (name, description, event)
    handler.js   # Code (exports default async function)
```

### HOOK.md Example

```markdown
# My Hook Name

Description of what this hook does.

## Trigger

- `session:end` - When session ends
```

### handler.js Example

```javascript
module.exports = async function myHook(event) {
  // Only trigger on specific events
  if (event.type !== 'session' || event.action !== 'end') {
    return;
  }
  
  // Your hook logic here
  console.log('[my-hook] Session ended:', event.sessionKey);
};
```

## Available Events

| Event | Action | Description |
|-------|--------|-------------|
| `session` | `start` | Session begins |
| `session` | `end` | Session ends |
| `command` | `new` | `/new` command issued |
| `command` | `reset` | `/reset` command issued |
| `gateway` | `startup` | Gateway starts |
| `agent` | `bootstrap` | Agent bootstraps |

## Common Issues

### Hook shows "missing"

The handler.js file doesn't exist or has syntax errors:
```bash
# Check the hook directory
ls -la ~/.openclaw/workspace/skills/your-skill/hooks/your-hook/

# Test the handler for syntax
node -c ~/.openclaw/workspace/skills/your-skill/hooks/your-hook/handler.js
```

### Hook not triggering

1. Check the event type matches what you're listening for
2. For `session:end` hooks - note that long-running sessions don't end often
3. Check hook is enabled in the learning/config.yaml if applicable

### Config not taking effect

Restart the gateway after config changes:
```bash
openclaw gateway restart
```

Or use `config.patch` which auto-restarts.

---

## BJS Labs Agents

All BJS Labs agents should add this to their config to enable the agentic-learning hooks:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": [
          "~/.openclaw/workspace/skills/agentic-learning/hooks"
        ]
      }
    }
  }
}
```

This enables:
- `decision-logger` - Captures decisions made in sessions
- `event-logger` - Logs significant events

---

*Document created: 2026-02-12 by Saber*
