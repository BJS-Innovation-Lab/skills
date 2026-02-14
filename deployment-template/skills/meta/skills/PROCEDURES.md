# Skill Development Procedures

## When to Build a New Skill

- Repeating the same manual process 3+ times
- Need for specialized knowledge in a domain
- Gap identified in reflection
- User request for new capability

## Skill Structure

```
skills/
└── skill-name/
    ├── SKILL.md          # Entry point (keep small!)
    └── [modules]/
        └── PROCEDURES.md # Detailed procedures
```

## Creating a New Skill

### 1. Define the Skill

```markdown
## Skill Proposal: [Name]

**Problem:** What gap does this fill?
**Solution:** What will the skill do?
**Triggers:** When should the agent use it?
**Dependencies:** What other skills/tools needed?
**Scope:** What's in/out?
```

### 2. Write the SKILL.md

Keep it minimal (~100 tokens):

```markdown
---
name: skill-name
description: One line description
metadata: {"openclaw":{"emoji":"🔧"}}
---

# Skill Name

Brief intro.

## Modules

| Module | Use For | Load |
|--------|---------|------|
| module1 | X | Read `{baseDir}/module1/PROCEDURES.md` |

## Quick Commands

- "do X" → Load module1
```

### 3. Write the PROCEDURES.md

Detailed instructions for each module:

- Step-by-step procedures
- Templates
- Examples
- Checklists
- Common pitfalls

### 4. Test the Skill

- Use it in a real task
- Note friction points
- Iterate on procedures

### 5. Document and Share

- Commit to repo
- Notify team via A2A
- Add to skill catalog

## Skill Quality Checklist

- [ ] SKILL.md is under 150 tokens
- [ ] Description is clear and specific
- [ ] Modules are well-organized
- [ ] Procedures are actionable
- [ ] Dependencies documented
- [ ] Tested in real use
- [ ] Committed to repo

## Improving Existing Skills

1. Identify friction in current skill
2. Propose specific change
3. Make the edit
4. Test
5. Commit with clear message

## Skill Organization

| Category | Skills |
|----------|--------|
| Marketing | content, social, email, campaigns |
| Sales | crm, outreach, pipeline, proposals |
| Operations | scheduling, documents, automation |
| Research | papers, data, experiments |
| Meta | learning, reflection, skills |
