# Skills Audit for Client Deployments

## Categorization

### 🟢 ESSENTIAL - Include in Every Client Deployment

| Skill | Description | Why Essential |
|-------|-------------|---------------|
| `smb-crm` | Customer database (Sheets + Supabase) | Core business data |
| `email-drafter` | Business email workflow (EN/ES) | Daily communication |
| `appointment-booking` | Multi-channel scheduling | Service businesses need this |
| `creativity-engine` | Content ideation framework | Prevents generic output |
| `meeting-summarizer` | Voice notes → structured summaries | Common use case |
| `mac-use` | GUI automation (screenshots, clicks, typing) | Control any Mac app - core capability |

### 🟡 OPTIONAL - Include Based on Client Needs

| Skill | Description | Include When |
|-------|-------------|--------------|
| `notion` | Notion API integration | Client uses Notion |
| `decision-frameworks` | Structured decision-making | Technical/strategic work |

### 🔴 INTERNAL ONLY - BJS Labs Agents

| Skill | Description | Why Internal |
|-------|-------------|--------------|
| `a2a-protocol` | Inter-agent communication | BJS Labs infra only |
| `agentic-learning` | Decision logging & learning | Our learning system |
| `evolver` | Self-evolution engine | Internal R&D |
| `failure-analyzer` | Root cause analysis | Internal tooling |
| `reflect-learn` | Conversation learning | Our improvement system |
| `recursive-self-improvement` | Auto-fix/optimize | Experimental |
| `self-evolve` | Config self-modification | Dangerous for clients |
| `research-intelligence` | ArXiv/paper scanning | BJS Labs research |
| `security-sentinel` | Vulnerability scanning | Our security tooling |
| `openclaw-sec` | Prompt injection protection | Already in OpenClaw core |

### ⚠️ NEEDS WORK - Not Ready for Clients

| Skill | Issue | Action Needed |
|-------|-------|---------------|
| `content-creation` | No frontmatter, unclear scope | Merge into creativity-engine? |
| `marketing-creativity` | No frontmatter | Define or deprecate |
| `marketing-module` | No frontmatter | Define or deprecate |

---

## Proposed Client Bundle Structure

```
client-workspace/
├── skills/
│   ├── company-kb/           # CUSTOMIZE per client
│   ├── sales-playbook/       # CUSTOMIZE per client  
│   ├── marketing-playbook/   # CUSTOMIZE per client
│   │
│   ├── smb-crm/              # COPY from BJS (configure Supabase)
│   ├── email-drafter/        # COPY from BJS
│   ├── appointment-booking/  # COPY from BJS
│   ├── creativity-engine/    # COPY from BJS
│   ├── meeting-summarizer/   # COPY from BJS
│   └── mac-use/              # COPY from BJS - core capability
```

## Questions for Sybil

1. Should `creativity-engine` be mandatory (baked into AGENTS.md) or optional skill?
2. Do we need a simplified version of `smb-crm` for smaller clients?
3. What about `gog` (Google Workspace) - should it be in essential?
4. Security considerations - which skills could be dangerous in client hands?

## Next Steps

- [ ] Review with Sybil
- [ ] Clean up marketing-* skills (merge or define)
- [ ] Create "client-essentials" installable bundle
- [ ] Document per-skill setup requirements
- [ ] Create client onboarding checklist

---

*Draft by Saber - awaiting Sybil's input*
