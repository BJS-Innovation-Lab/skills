# Diseño UI/UX

## Skills to Use

| Skill | When |
|-------|------|
| `figma-api` | Extract design tokens, components, specs |
| `media-generation` | Generate UI mockups, icons |
| `firecrawl` | Scrape design inspiration sites |

---

## Figma setup

If client has Figma and we need access:

1. figma.com → Profile → Settings → Personal Access Tokens
2. Generate token named "VULKN Agent"
3. Save to `clients/{name}/credentials.md` (encrypted if possible)

## Extracting from Figma

```markdown
## Design Tokens: [Project]

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| primary | #XXXXXX | buttons, links |
| secondary | #XXXXXX | accents |

### Typography
| Style | Font | Size | Weight |
|-------|------|------|--------|
| H1 | [Font] | 32px | 700 |
| Body | [Font] | 16px | 400 |

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
```

## Implementation checklist

- [ ] Design tokens extracted
- [ ] All states checked (default, hover, active, disabled, error, loading)
- [ ] Responsive breakpoints defined
- [ ] Assets exported (icons: SVG, photos: WebP)
- [ ] Side-by-side comparison done

## Gotchas

- Icons = SVG always. Photos = WebP/PNG optimized.
- Never rasterize vectors
- Figma is source of truth — code that doesn't match design is wrong
- Confirm frame is approved before implementing
- Flag technically impractical designs BEFORE building
