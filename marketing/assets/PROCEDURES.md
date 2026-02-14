# Marketing Assets Management

## Purpose

Centralized storage for all marketing assets with tracking of when/where/how they were used.

---

## Folder Structure

```
clients/{client-name}/
├── profile/
│   ├── story.md
│   ├── voice.md
│   ├── customers.md
│   └── learnings.md
│
├── assets/
│   ├── logos/
│   │   └── {version}-{description}.png
│   ├── covers/
│   │   └── {platform}-{version}.png
│   ├── social/
│   │   └── {date}-{platform}-{description}.png
│   ├── landing-pages/
│   │   └── {page-name}/
│   │       ├── copy.md
│   │       └── images/
│   └── email/
│       └── {campaign-name}/
│           ├── copy.md
│           └── images/
│
├── copy/
│   ├── taglines.md          # All approved taglines
│   ├── descriptions.md      # Bio/about copy for platforms
│   ├── social-posts.md      # All social post copy
│   ├── email-campaigns.md   # All email copy
│   └── landing-pages.md     # All landing page copy
│
└── usage-log.md              # When/where/how assets were used
```

---

## Usage Log Format (usage-log.md)

```markdown
# Asset Usage Log

## {Date}

### {Asset Name/Description}
- **Type:** logo | cover | social image | copy | email | landing page
- **File:** {path to file}
- **Used On:** {platform/channel}
- **Used For:** {campaign/purpose}
- **Status:** draft | approved | published | archived
- **Published URL:** {link if applicable}
- **Performance:** {metrics if available}
- **Notes:** {any feedback or learnings}

---
```

---

## Copy Storage Format (e.g., social-posts.md)

```markdown
# Social Posts - {Client Name}

## {Post ID/Date} - {Platform}

**Status:** draft | approved | published
**Published:** {date} | Not yet
**URL:** {link if published}

### Copy
{The actual post text}

### Image
- File: {path}
- Alt text: {description}

### Performance
- Likes: 
- Comments:
- Shares:
- Impressions:

### Learnings
{What worked, what didn't}

---
```

---

## When to Update

| Action | Update |
|--------|--------|
| Generate new asset | Add to assets/ folder |
| Write new copy | Add to copy/{type}.md |
| Approve content | Update status in copy file |
| Publish content | Add to usage-log.md with URL |
| Get performance data | Update metrics in copy file + learnings.md |

---

## Quick Commands

**Save new copy:**
```
1. Append to clients/{client}/copy/{type}.md
2. Include date, status, platform
```

**Log usage:**
```
1. Append to clients/{client}/usage-log.md
2. Include what, where, when, link
```

**Find all assets:**
```
ls clients/{client}/assets/
```

**Find all copy:**
```
ls clients/{client}/copy/
```

---

## Integration with Other Procedures

### After content creation:
1. Save copy to `copy/{type}.md`
2. Save images to `assets/{type}/`
3. Update status when approved

### After publishing:
1. Add entry to `usage-log.md`
2. Update copy file with URL
3. Add to `content-log.md` (memory)

### After getting feedback:
1. Update performance metrics
2. Add learnings to `learnings.md`
