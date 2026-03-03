# Imagen

## Skills to Use

| Skill | When |
|-------|------|
| `media-generation` | Generate images (Gemini, DALL-E, GPT-image) |
| `figma-api` | Extract assets from Figma designs |
| Native `image` tool | OpenClaw built-in image generation |

---

## Tool

OpenClaw native `image` tool — uses configured image model.

## Workflow

1. **Ask before generating:**
   - "¿Qué estilo visual? (fotorrealista, ilustración, minimalista, etc.)"
   - "¿Colores, mood, o detalles específicos?"

2. **Generate with detailed prompt (in English for better results):**
   ```
   image(prompt="Professional product photo of artisan coffee bag, 
   warm natural lighting, wooden table background, 
   minimalist style, 1080x1080 Instagram format")
   ```

3. **Show result and iterate:**
   - "¿Te gusta o ajustamos algo?"

## Platform sizes

| Platform | Size | Aspect |
|----------|------|--------|
| Instagram feed | 1080x1080 | 1:1 |
| Instagram/TikTok story | 1080x1920 | 9:16 |
| LinkedIn post | 1200x627 | 1.91:1 |
| YouTube thumbnail | 1920x1080 | 16:9 |
| Facebook cover | 820x312 | 2.63:1 |

## Prompt structure

```
[Subject] + [Style] + [Lighting] + [Composition] + [Mood] + [Format]

Example: "Mexican street taco close-up, food photography style, 
natural daylight, shallow depth of field, vibrant and appetizing, 
square format for Instagram"
```

## Gotchas

- English prompts work better than Spanish
- Be specific: "professional headshot" > "photo of person"
- Avoid: AI-generated faces for branding (uncanny valley)
- Always offer 2-3 variations
- For final customer-facing assets (logo, business card), recommend real designer

## Client preferences

Store in `clients/{name}/brand.md`:
- Brand colors (hex codes)
- Visual style references
- Logo file location
- Fonts if known
