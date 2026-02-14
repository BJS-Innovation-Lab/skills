# Quote Card & Image Templates

## Purpose

Quick branded images for social posts without designing from scratch every time.

---

## Template Types

### 1. Quote Cards

For sharing quotes, testimonials, or key statements.

**Prompt Template:**
```
Create a quote card image with:
- Background: {brand color - e.g., warm coral gradient}
- Quote: "{quote text}"
- Attribution: "— {name}, {title}" (if applicable)
- Style: Modern, minimal, clean
- Size: {platform size}
- Logo: Small in corner (optional)
- Font: Sans-serif, bold quote, light attribution
```

**Platform Sizes:**
| Platform | Size | Aspect |
|----------|------|--------|
| LinkedIn | 1200x627 | Landscape |
| Facebook | 1200x630 | Landscape |
| Instagram Feed | 1080x1080 | Square |
| Instagram Story | 1080x1920 | Portrait |
| Twitter/X | 1200x675 | Landscape |

---

### 2. Stat Cards

For sharing numbers, metrics, or data points.

**Prompt Template:**
```
Create a stat card image with:
- Big number: "{stat}" (e.g., "3x", "47%", "10,000+")
- Supporting text: "{context}"
- Background: {brand colors}
- Style: Bold, impactful, minimal
- Size: {platform size}
```

---

### 3. Tip Cards

For sharing quick tips or advice.

**Prompt Template:**
```
Create a tip card image with:
- Header: "Tip:" or "{number}" (if series)
- Tip text: "{short tip}"
- Background: {brand colors}
- Style: Clean, readable, friendly
- Size: {platform size}
- Icon: Optional relevant icon
```

---

### 4. Announcement Cards

For product launches, events, news.

**Prompt Template:**
```
Create an announcement image with:
- Headline: "{announcement}"
- Subtext: "{details}" (optional)
- CTA: "{action}" (optional)
- Background: {brand colors, more vibrant}
- Style: Bold, attention-grabbing
- Size: {platform size}
```

---

## Brand Color Presets

Store in `clients/{client}/brand-colors.md`:

```markdown
# Brand Colors - {Client}

## Primary
- Coral: #FF6B6B
- Warm Orange: #FFA07A
- Peach: #FFDAB9

## Secondary
- Soft Gray: #F5F5F5
- Dark Gray: #333333

## Gradients
- Primary: "warm gradient from coral to peach"
- Secondary: "soft peach to white"

## Usage
- Backgrounds: Primary gradient
- Text: Dark gray on light, white on dark
- Accents: Coral
```

---

## Quick Generation Commands

### Quote Card
```
Generate a quote card for LinkedIn:
Quote: "Human happiness comes first."
Brand: Vulkn (warm coral colors)
```

### Stat Card
```
Generate a stat card:
Stat: "3x"
Context: "faster than traditional development"
Platform: Instagram square
Brand: {client}
```

### Tip Card
```
Generate a tip card for Twitter:
Tip: "Start with the customer problem, not your solution"
Brand: {client}
```

---

## Image Generation Flow

```
1. Identify content type (quote/stat/tip/announcement)
2. Load brand colors from client profile
3. Select appropriate template prompt
4. Fill in content
5. Generate image via openai-image-gen or nano-banana-pro
6. Save to clients/{client}/assets/social/
7. Log in usage-log.md
```

---

## Batch Generation

For creating multiple images at once:

```bash
# Generate 4 quote cards with different quotes
python3 scripts/gen.py \
  --prompt "Quote card, warm coral gradient, modern minimal: '{quote}'" \
  --count 4 \
  --out-dir clients/{client}/assets/social/quotes/
```

---

## Anti-Generic Checklist

Before using a generated image:

- [ ] Uses brand colors (not generic blue/gray)?
- [ ] Text is readable at small sizes?
- [ ] Doesn't look like stock template?
- [ ] Matches the brand's warm/human feel?
- [ ] Would stop someone scrolling?

---

## Storage

Save templates in:
```
clients/{client}/assets/
├── templates/           # Reusable base templates
│   ├── quote-card.png
│   ├── stat-card.png
│   └── tip-card.png
└── social/              # Generated images
    └── {date}-{type}-{description}.png
```
