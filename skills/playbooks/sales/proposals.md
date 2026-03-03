# Propuestas y Cotizaciones

## Skills to Use

| Skill | When |
|-------|------|
| `office-suite` | Create Word docs, Excel pricing sheets, PDF exports |
| `vulkn-office` | Mexican business docs (if CFDI/RFC needed) |
| `google-official` (gog) | Google Docs/Sheets for collaborative proposals |

---

## Commands

```bash
# Create Google Doc
gog docs create "Propuesta - Cliente XYZ" --json
# Returns docId

# Export as PDF
gog drive export "docId123" --format pdf --output "propuesta-xyz.pdf"

# Send with attachment
gog gmail send \
  --to "cliente@email.com" \
  --subject "Propuesta: [Proyecto]" \
  --body "Hola, adjunto la propuesta..." \
  --attach "propuesta-xyz.pdf"
```

## Proposal structure

```markdown
# Propuesta: [Nombre del proyecto]
**Para:** [Cliente]  
**Fecha:** [Fecha]  
**Válida hasta:** [+14-30 días]

## Resumen ejecutivo
[2-3 líneas: problema que resolvemos y resultado esperado]

## Alcance
### Incluye:
- [Item 1]
- [Item 2]

### NO incluye:
- [Exclusión explícita]

## Opciones

| | Básico | Recomendado | Premium |
|---|--------|-------------|---------|
| [Feature 1] | ✓ | ✓ | ✓ |
| [Feature 2] | - | ✓ | ✓ |
| **Inversión** | $X | $Y | $Z |

## Siguiente paso
[Una acción clara y de baja fricción]
```

## Gotchas

- Show value before price — always
- 3 options anchors high (premium first in conversation)
- Expiration date prevents "let me think about it" forever
- Log in CRM immediately after sending
- Follow up day 3-5 if no response

## Trust tiers

| Action | Always confirm |
|--------|----------------|
| Draft proposal | ✅ Auto |
| Send proposal | ❓ Confirm |
| Follow up >5 days | ✅ Auto |
