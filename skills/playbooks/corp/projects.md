# Proyectos

## Skills to Use

| Skill | When |
|-------|------|
| `notion` | Project databases, task tracking, wikis |
| `google-official` (gog) | Calendar for deadlines, Drive for files |
| `office-suite` | Project plans in Excel, status reports |

---

## Commands

```bash
# Read project tasks
gog sheets get "1abc123spreadsheetId" "Tareas!A:F" --json

# Add task
gog sheets append "1abc123spreadsheetId" "Tareas!A:F" \
  "Diseñar logo" "María" "2026-03-01" "pendiente" "1" "Espera assets del cliente"

# Update task status
gog sheets update "1abc123spreadsheetId" "Tareas!D5" "completado"

# For Notion (if client uses it)
# Use notion skill — different commands
```

## Task structure

| Column | Content |
|--------|---------|
| A | Task name |
| B | Owner |
| C | Due date |
| D | Status (pendiente/en progreso/bloqueado/completado) |
| E | Priority (1/2/3) |
| F | Notes |

## Weekly status update

Format for owner:
```markdown
## Esta semana
- ✅ [Completado 1]
- ✅ [Completado 2]

## En progreso
- 🔄 [Tarea] — [quién] — [fecha]

## Bloqueado
- 🚫 [Tarea] — [razón] — [necesita: acción específica]

## Próxima semana
- [ ] [Prioridad 1]
- [ ] [Prioridad 2]
```

## Gotchas

- Everything "high priority" = nothing is. Force a rank.
- If blocked >48h, escalate immediately
- Match tool complexity to business — taco shop doesn't need Jira
- Keep it in ONE tool — don't split across platforms

## Client first session

Store in `clients/{name}/projects.md`:
- Spreadsheet ID or Notion workspace
- Who assigns tasks? Who updates?
- Status update frequency (daily/weekly)
- Escalation contact for blockers
