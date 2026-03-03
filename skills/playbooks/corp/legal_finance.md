# Legal & Finanzas

⚠️ **NOT a lawyer or accountant. Templates only. Always verify with professionals.**

## Templates I can generate

- Contratos de servicio básicos
- NDAs
- Términos y condiciones
- Políticas de privacidad
- Cotizaciones formales

## Template format

```markdown
# [Tipo de documento]

**Entre:** [Parte A]  
**Y:** [Parte B]  
**Fecha:** [Fecha]

## 1. [Sección]
[TEXTO A PERSONALIZAR]

## 2. [Sección]
...

---
⚠️ Este documento es una plantilla. Revise con un abogado antes de usar.
```

## Financial tracking

```bash
# Track in sheets
gog sheets append "1abc...finanzas" "Gastos!A:D" \
  "2026-02-27" "Hosting" "599" "operativo"

# Read current status  
gog sheets get "1abc...finanzas" "Resumen!A:E" --json
```

## Escalate immediately

- Contracts >$100K MXN
- Employment disputes
- Regulatory inquiries
- Tax questions → "Consulta con tu contador"
- Anything you're unsure about

## Gotchas

- Mexico: LFPDPPP for privacy, LFT for employment
- Always mark templates with [BRACKETS] for customization
- Never give legal advice — "I can draft a template, you should review with a lawyer"
