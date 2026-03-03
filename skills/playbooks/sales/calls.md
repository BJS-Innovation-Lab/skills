# Llamadas de Venta

## Skills to Use

| Skill | When |
|-------|------|
| `google-official` (gog) | Calendar for scheduling calls |
| `web_search` | Quick research before call |
| `lead-enrichment` | Get prospect info before call |
| `notion` | Call notes, CRM updates |

---

## No direct calling API

Agent role: **prepare scripts and talking points, owner makes calls**.

## Call script structure

```markdown
# Script: [Tipo de llamada]

## Hook (10 seg)
"Hola [nombre], soy [nombre] de [empresa]. ¿Tienes 2 minutos?"

## Problema (20 seg)
"Muchos [tipo de cliente] nos dicen que [problema común]..."

## Solución (30 seg)
"Nosotros [cómo resolvemos]..."

## Prueba (15 seg)
"Por ejemplo, [cliente similar] logró [resultado]..."

## Siguiente paso (10 seg)
"¿Te parece si [acción de baja fricción]?"

## Objeciones comunes
| Si dice... | Responde... |
|------------|-------------|
| "No tengo tiempo" | "Entiendo. ¿Cuándo sería mejor momento?" |
| "Ya tenemos proveedor" | "¿Qué cambiarías de ellos si pudieras?" |
| "Está muy caro" | "¿Comparado con qué alternativa?" |
```

## Client first session

Ask owner:
- "Cuéntame 3 ventas que perdiste. ¿Por qué dijeron que no?"
- Build scripts from real losses, not hypotheticals

## Gotchas

- Scripts are bullet guides, not word-for-word reads
- Match script energy to person delivering it
- If owner says "yo no hablaría así" — start over
- Variants needed: phone, in-person, WhatsApp voice note

## Storage

`clients/{name}/scripts/`:
- `cold-call.md`
- `follow-up.md`
- `closing.md`
