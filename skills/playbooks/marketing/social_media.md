# Redes Sociales

## Skills to Use

| Skill | When |
|-------|------|
| `media-generation` | Create images for posts (Gemini, DALL-E) |
| `manychat` | Automate Instagram/Facebook DM responses |
| `web_search` | Research trending topics, hashtags |
| `google-official` (gog) | Schedule via Google Calendar reminders |

---

## No direct API access

Most social posting requires owner to post manually or use their scheduling tool.
Agent role: **draft content, owner posts**.

## Content drafts

Store drafts in `clients/{name}/content/`:
```markdown
# Post: [fecha]
**Platform:** Instagram
**Type:** Carousel / Reel / Single
**Caption:**
[caption here]

**Hashtags:**
#tag1 #tag2 #tag3

**Image prompt (if AI):**
[prompt for image generation]

**Status:** draft / approved / posted
```

## Platform specs

| Platform | Image | Video | Caption |
|----------|-------|-------|---------|
| IG Feed | 1080x1080 | 60s max | 2200 chars |
| IG Reels | 1080x1920 | 90s sweet spot | short |
| IG Stories | 1080x1920 | 15s per slide | minimal |
| Facebook | 1200x630 | native > links | 40-80 chars best |
| LinkedIn | 1200x627 | native | no links in body |
| TikTok | 1080x1920 | 15-60s | hook in 1s |

## Hashtag strategy

- Instagram: 5-15, mix popular + niche
- LinkedIn: 3-5 max, at bottom
- TikTok: 3-5, trending first
- Facebook: 1-2 or none

## Posting frequency

| Platform | Minimum | Growth mode |
|----------|---------|-------------|
| Instagram | 3x/week | 5-7x/week |
| Stories | daily | 3-5x/day |
| LinkedIn | 2x/week | 3-5x/week |
| Facebook | 3x/week | daily |
| TikTok | 3x/week | 1-3x/day |

## Client first session

Store in `clients/{name}/social.md`:
- Which platforms active?
- Brand voice (formal/casual/playful)
- Content pillars (3 max topics)
- Posting schedule owner can sustain
- Who actually posts? (owner, employee, agency)
