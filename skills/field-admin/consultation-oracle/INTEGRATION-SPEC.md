# Integration Spec for Johan

**From:** Sybil  
**Date:** Feb 25, 2026  
**Status:** Detection layer ready, needs pipeline integration

---

## What We Built

Two components ready to go:

### 1. `safe-respond.cjs` — Pre-send scanner
Scans agent responses before they go to customers.

```bash
echo "response text" | node safe-respond.cjs --stdin --json
```

**Returns:**
```json
{
  "action": "send|consult|block",
  "reason": "why",
  "security": { "issues": [...], "hasCritical": bool },
  "hedging": { "issues": [...], "totalWeight": int, "triggered": bool }
}
```

**Exit codes:**
- `0` = Safe to send
- `1` = Hedging detected → route to Frontier Lab
- `2` = Security issue → block entirely

**Speed:** ~80ms total (Node startup; regex is microseconds)

### 2. `SKILL.md` — Consultation Oracle docs
Defines triggers, routing, and the consultation flow.

---

## What We Need You to Build

### A. Message Pipeline Hook

Field agents currently send messages directly to customers. We need a hook that:

1. Intercepts outbound customer messages
2. Runs them through `safe-respond.cjs`
3. Based on exit code:
   - `0` → Send normally
   - `1` → Hold message, route to Frontier Lab, wait for advice
   - `2` → Block, return error to agent

**Pseudocode:**
```python
def send_to_customer(agent_id, message):
    result = run("node safe-respond.cjs --stdin --json", input=message)
    
    if result.exit_code == 0:
        # Clean — send it
        actually_send(message)
    
    elif result.exit_code == 1:
        # Hedging — needs consultation
        consultation_id = send_to_frontier_lab(agent_id, message, result.reason)
        wait_for_consensus(consultation_id)
        # Agent revises and resubmits
    
    elif result.exit_code == 2:
        # Security block
        notify_agent("Message blocked: " + result.reason)
        log_security_event(agent_id, message, result)
```

### B. Frontier Lab Room

A shared space where consultations go:

**Requirements:**
- Multiple A-tier field agents can see incoming consultations
- Any agent can respond with advice
- Head agent reviews all responses and makes final call
- Response goes back to original agent
- Timeout: 60 seconds (configurable)

**Data flow:**
```
Field Agent → safe-respond detects hedging → Frontier Lab room
                                                    ↓
                                         Multiple agents respond
                                                    ↓
                                         Head agent synthesizes
                                                    ↓
                                         Advice returned to field agent
                                                    ↓
                                         Field agent revises → sends to customer
```

### C. Consensus Mechanism

When a consultation comes in:

1. **Broadcast** to all available A-tier agents
2. **Collect** responses (timeout: 30 seconds for individual responses)
3. **Head agent** reviews all input, makes final recommendation
4. **Return** synthesized advice to requesting agent

**Head agent role:**
- Sees all responses from other agents
- Weighs conflicting advice
- Writes final recommendation
- Can override or combine suggestions

---

## Files Location

```
BJS-Innovation-Lab/skills/
└── field-admin/
    └── consultation-oracle/
        ├── SKILL.md              # Full documentation
        ├── INTEGRATION-SPEC.md   # This file (for Johan)
        └── safe-respond.cjs      # The scanner (ready to use)
```

---

## Questions for Johan

1. **Where does this hook live?** In OpenClaw core? In a middleware layer? In the agent's message handler?

2. **How do field agents currently send messages?** Need to know the interception point.

3. **A2A or different protocol for Frontier Lab?** Should consultations use A2A, or a dedicated channel?

4. **Head agent selection:** Fixed role? Rotating? Whoever's available?

5. **Timeout behavior:** If no response in 60s, should agent proceed with best judgment or escalate to HQ?

---

## Testing

Once integrated, test with:

```bash
# Should send normally
echo "Your order ships tomorrow." | node safe-respond.cjs --stdin

# Should trigger consultation
echo "I think maybe the refund might be possible" | node safe-respond.cjs --stdin

# Should block
echo "Here's the key: sk-ant-abc123456789" | node safe-respond.cjs --stdin
```

---

## Contact

Questions? Ping Sybil via A2A or Bridget on Telegram.

— Sybil 🔬
