# Video

## Skills to Use

| Skill | When |
|-------|------|
| `media-generation` | Generate video stills, thumbnails |
| `figma-api` | Extract storyboard frames from Figma |

**Note:** Full video generation (Veo) requires Vertex AI setup. For now, create scripts and storyboards.

---

## Current status

AI video generation (Veo, etc.) may not be configured. Check first:
```bash
which veo 2>/dev/null || echo "Not available as CLI"
```

If not available, agent role: **script and storyboard, client produces**.

## Video script format

```markdown
## Video: [Name]
**Duration:** [8-30 seconds]
**Platform:** [IG Reel / TikTok / YouTube Short]
**Aspect:** 9:16 vertical

### Storyboard

| Time | Visual | Audio/Text |
|------|--------|------------|
| 0-2s | [Hook visual] | [Hook text] |
| 2-8s | [Main content] | [Narration] |
| 8-10s | [CTA] | [CTA text] |

### Shot list
1. [Shot 1 description]
2. [Shot 2 description]
...
```

## Platform specs

| Platform | Duration | Aspect |
|----------|----------|--------|
| IG Reels | 15-90s (30s sweet spot) | 9:16 |
| TikTok | 15-60s (21-34s optimal) | 9:16 |
| YouTube Shorts | <60s | 9:16 |
| Stories | 15s per slide | 9:16 |

## Gotchas

- Hook in first 1-3 seconds or they scroll
- 80% watch on mute — captions mandatory
- Trending audio boosts reach
- Vertical only (9:16)
- Repurpose across platforms: Reel → TikTok → Short

## Storage

`clients/{name}/video/`:
- `scripts/`
- `assets/`
