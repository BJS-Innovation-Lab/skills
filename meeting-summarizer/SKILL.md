---
name: meeting-summarizer
description: Transform voice-dictated meeting notes into structured summaries with action items. Uses native phone keyboard voice-to-text (no audio files needed).
metadata: {"openclaw":{"emoji":"📝"}}
---

# Meeting Summarizer

Transform rambling voice-dictated meeting notes into clean, structured summaries.

## How It Works

1. **User speaks** into phone keyboard mic (iPhone dictation or Android Gboard)
2. **Phone transcribes** speech to text automatically
3. **User sends** the transcribed text to agent
4. **Agent extracts** structured notes using the template below

**No audio files needed** — the phone handles transcription natively.

## Activation

When you receive a long, conversational message that sounds like meeting notes (mentions of discussions, decisions, people, tasks), automatically process it as a meeting summary.

Trigger phrases:
- "meeting notes"
- "just had a meeting"
- "let me tell you about the call"
- "here's what we discussed"
- Or any rambling voice-dictated text about a meeting/call

## Output Template

```markdown
# Meeting Summary
**Date:** [extract or use today]
**Attendees:** [names mentioned, or "Not specified"]
**Duration:** [if mentioned, otherwise omit]

## Key Topics
- [Topic 1]
- [Topic 2]
- [Topic 3]

## Decisions Made
- [Decision 1]
- [Decision 2]

## Action Items
| Task | Owner | Due |
|------|-------|-----|
| [Task description] | [Person] | [Date if mentioned] |

## Open Questions
- [Questions that weren't resolved]

## Notes
[Any other important context]
```

## Processing Rules

1. **Extract structure** from conversational text — don't just reformat
2. **Infer attendees** from names mentioned (e.g., "I talked to Maria" → Maria was there)
3. **Identify action items** from phrases like "need to", "should", "will", "have to", "going to"
4. **Capture decisions** from "we decided", "agreed", "going with", "the plan is"
5. **Flag open questions** from "not sure", "need to figure out", "TBD", questions without answers
6. **Use original language** — if input is Spanish, output in Spanish
7. **Be concise** — don't pad, just extract the value

## Follow-up Actions

After generating the summary, offer:
- **Save to memory** — store in `memory/meetings/YYYY-MM-DD-[topic].md`
- **Email summary** — send to specified recipients
- **Create tasks** — add action items to Things/Reminders
- **Add to Notion** — create page under a meetings database

## Example

**Input (voice-dictated):**
> Ok so I just got off the call with Carlos about the website project and basically we decided to go with the blue design he showed us last week. Maria is going to send the final mockups by Friday and then Carlos needs to get the developer quotes. Oh and we still need to figure out the hosting situation, not sure if we're going with AWS or something simpler. The budget is around 50,000 pesos but might be flexible.

**Output:**
```markdown
# Meeting Summary
**Date:** 2026-02-13
**Attendees:** Carlos, Maria, [You]

## Key Topics
- Website project design decision
- Timeline for mockups and developer quotes
- Hosting platform selection
- Budget discussion

## Decisions Made
- Going with the blue design Carlos showed last week
- Budget set at ~50,000 pesos (flexible)

## Action Items
| Task | Owner | Due |
|------|-------|-----|
| Send final mockups | Maria | Friday |
| Get developer quotes | Carlos | TBD |

## Open Questions
- Hosting platform: AWS vs simpler alternative?

## Notes
- Budget has some flexibility beyond 50K pesos
```

## Spanish Example

**Input:**
> Acabo de hablar con el contador y me dijo que necesitamos tener todas las facturas listas para el día 15. También mencionó que hay un problema con el RFC de uno de los proveedores y que Lupita tiene que verificar eso. No estoy segura si vamos a alcanzar a hacer todo pero vamos a intentar.

**Output:**
```markdown
# Resumen de Junta
**Fecha:** 2026-02-13
**Asistentes:** Contador, [Tú]

## Temas Principales
- Fecha límite de facturas
- Problema con RFC de proveedor

## Decisiones
- Todas las facturas deben estar listas para el día 15

## Tareas
| Tarea | Responsable | Fecha |
|-------|-------------|-------|
| Verificar RFC del proveedor | Lupita | Antes del 15 |
| Preparar facturas | [Por asignar] | 15 de este mes |

## Preguntas Abiertas
- ¿Se alcanzará a completar todo a tiempo?
```

## Integration with Other Skills

- **gog** — Email the summary via Gmail
- **notion** — Save to Notion meetings database
- **things-mac** / **apple-reminders** — Create tasks from action items
- **smb-crm** — Link meeting to customer record if applicable
