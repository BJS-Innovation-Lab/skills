# Content Log Procedures

## ⚠️ INTERNAL ONLY

**These files are NEVER shown to customers:**
- `memory/content-log.md` — what we posted/sent
- `clients/{name}/learnings.md` — what worked/failed
- `clients/{name}/` folder — all profile docs

**Customers only see:**
- The actual content (emails, posts, landing pages)
- Approval requests ("Here's the draft, approve?")

When presenting options to a customer, do NOT mention internal tracking files.

---

## Purpose

Track what we did, when, where. Not analytics - just a log so we know what happened.

## Log File Location

`memory/content-log.md` in the workspace

## Log Format

```markdown
# Content Log

## Week of [Date]

### [Date] - [Platform]
- **Type:** [post/email/landing page]
- **Topic:** [what it was about]
- **Status:** [drafted/approved/posted/sent]
- **Link:** [if posted, link here]
- **Notes:** [owner feedback, performance notes]
```

## When to Log

**Log EVERY content action:**
- Drafted a post → log it
- Owner approved → update status
- Posted/sent → update with link
- Got feedback → add notes

## Example Entries

```markdown
## Week of 2026-02-14

### 2026-02-14 - Instagram
- **Type:** post
- **Topic:** New product launch announcement
- **Status:** posted
- **Link:** https://instagram.com/p/xxx
- **Notes:** Owner loved the hook. 45 likes in first hour.

### 2026-02-14 - Email
- **Type:** campaign email
- **Topic:** Valentine's Day promo
- **Status:** sent
- **Link:** n/a
- **Notes:** Sent to 250 subscribers. 35% open rate.

### 2026-02-13 - Landing Page
- **Type:** landing page copy
- **Topic:** Webinar registration
- **Status:** approved (not deployed yet)
- **Link:** ~/drafts/webinar-lp.html
- **Notes:** Owner wants to change the headline. Revising.
```

## Weekly Summary

Every week (or on request), generate a summary:

```markdown
## Weekly Summary: [Week]

**Content Created:**
- X Instagram posts
- X Facebook posts  
- X emails
- X landing pages

**Posted/Sent:**
- X pieces published
- X awaiting approval

**Owner Feedback:**
- [Notable positive feedback]
- [Requested changes]

**Next Week:**
- [Planned content]
```

## Commands

**Add entry:**
```
Log: [platform] | [type] | [topic] | [status]
```

**View recent:**
```
Show me this week's content log
```

**Weekly summary:**
```
Generate weekly content summary
```

## Integration with Memory

The content log lives in `memory/content-log.md` so:
- It persists across sessions
- It's searchable via memory_search
- It doesn't bloat the main conversation

## Not Tracked Here

- Detailed analytics (that's Phase 3)
- A/B test results (future)
- Lead attribution (future)

This is just: **what did we do, when, where**
