# Key Learnings from Anthropic's Skill Creator

*Extracted by Sybil, Feb 27, 2026*

## The Golden Rules

### 1. Skill Descriptions Are Everything
The description field is the PRIMARY triggering mechanism. Make it "pushy" to combat undertriggering.

**Bad:** "How to build a dashboard"
**Good:** "How to build a dashboard. Use this whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of data, even if they don't explicitly ask for a 'dashboard.'"

### 2. Explain the Why, Not Just the What
> "Today's LLMs are *smart*. They have good theory of mind. If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag — reframe and explain the reasoning."

Instead of: `NEVER use Unicode bullets`
Write: `Unicode bullets render as black boxes in ReportLab because built-in fonts lack those glyphs. Use <sub> tags instead.`

### 3. Progressive Disclosure
```
SKILL.md (always loaded, <500 lines)
└── references/ (loaded only when needed)
    ├── domain1.md
    ├── domain2.md
```
Keep the main skill lean. Put deep documentation in references.

### 4. Look for Repeated Work
> "If all 3 test cases resulted in the subagent writing a `create_docx.py`, that's a strong signal the skill should bundle that script."

When I notice myself doing the same thing repeatedly, I should extract it into a reusable script.

### 5. Generalize from Feedback
> "If the skill works only for those examples, it's useless. Rather than put in fiddly overfitty changes, try branching out and using different metaphors."

Don't overfit to specific test cases. Build skills that work for the next million uses.

## The Eval Loop

1. Write skill draft
2. Create 2-3 realistic test prompts
3. Run tests (with skill AND baseline)
4. Grade with assertions where objective
5. Have human review subjective quality
6. Read feedback, improve skill
7. Repeat until quality plateaus

## Skill Structure

```
skill-name/
├── SKILL.md          # Required: <500 lines, frontmatter with name + description
├── scripts/          # Reusable code for deterministic tasks
├── references/       # Deep docs loaded on demand
└── assets/           # Templates, icons, fonts
```

## Description Optimization

Create 20 eval queries mixing should-trigger and should-not-trigger. Test edge cases:
- Lowercase, typos, casual speech
- Mix of lengths
- Realistic user context (file paths, company names, etc.)

## Applying This to My Skills

### Immediate Actions:
1. Audit all my skill descriptions — make them pushier
2. Extract repeated patterns into bundled scripts
3. Add references/ for large documentation
4. Remove ALWAYS/NEVER caps in favor of explanations

### Skills to Review:
- [ ] field-admin
- [ ] hive-mind
- [ ] agentic-learning
- [ ] research-intelligence
- [ ] a2a-protocol

---

*"This task is pretty important (we are trying to create billions a year in economic value here!) — take your time and really mull things over."*
