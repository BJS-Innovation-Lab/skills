# Copywriting y Contenido

## Skills to Use

| Skill | When |
|-------|------|
| `media-generation` | Generate images for blog posts, social |
| `web_search` | Research topics, find sources |
| `firecrawl` | Scrape reference content |
| `google-official` (gog) | Google Docs for collaborative writing |

---

## Copywriting frameworks

**Ad copy (Problem → Agitate → Solution → CTA):**
```
¿Cansado de [problema]?
Sabemos lo frustrante que es [agitar].
Con [solución], puedes [beneficio].
[CTA claro]
```

**Social copy (Hook → Value → CTA):**
```
[Hook que detiene el scroll]
[Valor en 2-3 líneas]
[CTA de baja fricción]
```

## Before writing

Ask:
1. "¿Quién es la audiencia?"
2. "¿Qué quieres que hagan después de leer?"
3. "¿Cuál es la voz de la marca?"

## Deliverables

Always write **3 variants** — let client pick or A/B test.

## Platform character limits

| Platform | Limit | Sweet spot |
|----------|-------|------------|
| Instagram caption | 2200 | 150-300 |
| Tweet | 280 | 240 |
| LinkedIn post | 3000 | 150-250 |
| Email subject | ~60 | 40-50 |
| Meta ad primary | 125 | 80-100 |

## Image generation

Use OpenClaw `image` tool:
```
image(prompt="[detailed English prompt]")
```

See `design/image.md` for full workflow.

## Storage

`clients/{name}/copy/`:
- `ad-variants.md`
- `social-calendar.md`
- `brand-voice.md`

## Gotchas

- Headlines: specific > clever
- One CTA per piece
- If client says "this doesn't sound like us" — start over
