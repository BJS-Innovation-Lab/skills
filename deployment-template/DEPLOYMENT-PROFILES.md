# Deployment Profiles

Same architecture, different skill sets per use case. Each client agent is configured based on their needs.

## Available Umbrellas

| Umbrella | Emoji | Modules | Best For |
|----------|-------|---------|----------|
| `marketing` | 📣 | content, social, email, campaigns | Content creators, brand managers |
| `sales` | 💰 | crm, outreach, pipeline, proposals | Sales teams, account managers |
| `operations` | ⚙️ | scheduling, docs, automation | Office managers, assistants |
| `research` | 🔬 | papers, data, experiments | Analysts, researchers |
| `meta` | 🧠 | learning, reflection, skills | Self-improving agents |

## Example Profiles

### General Business Assistant
For small businesses needing all-around support.

**Umbrellas:** marketing, sales, operations

**Use case:** Mexican SMB that needs help with customers, content, and daily operations.

---

### Marketing Specialist
For agencies or marketing-focused roles.

**Umbrellas:** marketing, operations

**Essential tools:** creativity-engine (mandatory)

**Use case:** Content agency, social media manager, brand consultant.

---

### Sales Agent
For sales-focused operations.

**Umbrellas:** sales, operations

**Essential tools:** smb-crm, email-drafter

**Use case:** Sales team support, lead management, pipeline tracking.

---

### Executive Assistant
For scheduling and administrative support.

**Umbrellas:** operations

**Essential tools:** appointment-booking, meeting-summarizer, gog

**Use case:** Calendar management, meeting coordination, document organization.

---

### Research Assistant
For data and analysis work.

**Umbrellas:** research, operations

**Use case:** Market research, competitive analysis, report generation.

---

### Self-Improving Agent
For agents that should learn and evolve.

**Umbrellas:** (any core umbrellas) + meta

**Essential tools:** agentic-learning, reflect-learn

**Use case:** Internal agents, long-term assistants, agents that need to get better over time.

---

## Creating a Custom Profile

1. **Identify the role** - What will this agent primarily do?

2. **Select umbrellas** - Only include what's needed:
   ```bash
   cp -r skills/marketing ~/.openclaw/workspace/skills/   # if needed
   cp -r skills/sales ~/.openclaw/workspace/skills/       # if needed
   cp -r skills/operations ~/.openclaw/workspace/skills/  # usually yes
   ```

3. **Add essential tools** - Copy from BJS-Innovation-Lab/skills:
   - smb-crm (if customer data)
   - creativity-engine (if content creation)
   - mac-use (if GUI automation)
   - appointment-booking (if scheduling)

4. **Update AGENTS.md** - List only the umbrellas you included:
   ```markdown
   ## Your Skill Suites

   | Skill | Domain | Invoke When |
   |-------|--------|-------------|
   | 📣 `marketing` | Content, social, email | Marketing tasks |
   | ⚙️ `operations` | Scheduling, docs | Ops tasks |
   ```

5. **Customize company-kb** - Fill in client-specific info:
   - Products/services
   - Pricing
   - Brand voice
   - FAQs

## Token Budget Guide

| # Umbrellas | Approx Tokens | Monthly Cost (Opus, 1000 turns) |
|-------------|---------------|--------------------------------|
| 1 | ~100 | ~$1.50 |
| 2 | ~200 | ~$3.00 |
| 3 | ~300 | ~$4.50 |
| 5 | ~500 | ~$7.50 |

Compare to flat 51 skills: ~3,000 tokens = ~$45/month

**Umbrellas save 80-95% on skill context costs.**
