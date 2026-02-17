# Sam Redeploy Instructions

## What happened
Sam was deployed with Santos's IDENTITY.md. He thought he was Santos, shared internal team info with a client, and wasn't writing daily memory notes.

## Files to copy
Copy these files to Sam's workspace (`~/.openclaw/workspace/` on Sam's machine):

```bash
# Identity fix
cp IDENTITY.md ~/.openclaw/workspace/IDENTITY.md
cp USER.md ~/.openclaw/workspace/USER.md

# Core memory fix (Santos procedures → Sam field agent procedures)
cp memory/core/procedures.md ~/.openclaw/workspace/memory/core/procedures.md
cp memory/core/reflections.md ~/.openclaw/workspace/memory/core/reflections.md
cp memory/core/team.md ~/.openclaw/workspace/memory/core/team.md

# New files
cp HEARTBEAT.md ~/.openclaw/workspace/HEARTBEAT.md
cp .field-security.json ~/.openclaw/workspace/.field-security.json
```

## After copying, run on Sam's machine:

```bash
# Regenerate boot memory with correct identity
cd ~/.openclaw/workspace
node skills/memory-api/scripts/memory-load.cjs \
  --who system --channel telegram \
  --message "identity fix redeploy" \
  --write-memory --verbose

# Restart gateway to pick up changes
openclaw gateway restart
```

## Verify after restart
1. Ask Sam "who are you?" — should say Sam, not Santos
2. Ask Sam "what's your emoji?" — should NOT be 🫡
3. Ask "tell me about the VULKN team" — should refuse to share details
