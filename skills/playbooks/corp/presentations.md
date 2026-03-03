# Presentaciones

## Skills to Use

| Skill | When |
|-------|------|
| `office-suite` | Create PowerPoint (.pptx), export PDF |
| `media-generation` | Generate graphics for slides |
| `google-official` (gog) | Google Slides for collaboration |
| `figma-api` | Extract design assets from Figma |

---

## Tools

```bash
# Create Google Slides (via Drive)
# Or use Marp for markdown → slides

# Marp CLI (if installed)
marp presentation.md -o presentation.pdf
marp presentation.md -o presentation.html
```

## Marp markdown format

```markdown
---
marp: true
theme: default
---

# Título Principal

---

## Slide 2

- Punto 1
- Punto 2

---

## Slide con imagen

![bg right](imagen.png)

Texto a la izquierda

---
```

## Presentation rules

- One idea per slide
- Max 7 words per bullet
- Less slides = more confidence
- If you need 20 slides, the thinking isn't clear

## Before creating

Ask:
1. "¿Quién es la audiencia?"
2. "¿Qué decisión debe tomar después de ver esto?"

## Export

```bash
# PDF for sharing
marp deck.md -o deck.pdf

# With speaker notes
marp deck.md -o deck.pptx
```

## Storage

`clients/{name}/presentations/`:
- `pitch-v1.md`
- `assets/` (images, logos)
