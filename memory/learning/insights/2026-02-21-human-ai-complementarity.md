---
type: insight
source: research-scan (arXiv:2602.17646)
timestamp: 2026-02-21T07:15:00Z
related_entry: memory/2026-02-20.md
tags: [human-ai-collaboration, teaming, research, counterfactual-harm]
---

# Insight: Human-AI Complementarity (arXiv:2602.17646)

## The Finding
The paper "Multi-Round Human-AI Collaboration with User-Specified Requirements" formalizes two critical concepts for our "When Agents Remember" research:

1.  **Counterfactual Harm:** AI assistance is harmful if the human-AI team performs *worse* than the human alone. This happens when the AI overrides correct human intuition or induces laziness (automation bias).
2.  **Complementarity:** True value comes only when the AI helps where the human is weak, without undermining where the human is strong.

## Application to VULKN
- **Field Agents:** We shouldn't automate *everything*. We should automate the things the SMB owner is bad at (GitHub, deployments, repetitive CRM) but AMPLIFY what they are good at (client relationships, specific domain knowledge).
- **Design Rule:** If an agent takes over a task the human enjoys and does well, it's counterfactual harm (loss of agency/joy). If it takes over drudgery, it's complementarity.

## Action
- Integrate this definition of "Counterfactual Harm" into our `agentic-smb` constitution.
- Use it to evaluate agent success: not just "did the task get done?" but "did the team (human+agent) outperform the human alone?"
