# CRM & Pipeline

## Commands

```bash
# Read from sheet
gog sheets get "1abc123spreadsheetId" "Clientes!A:F" --json

# Add new contact (append row)
gog sheets append "1abc123spreadsheetId" "Clientes!A:F" \
  "Juan Pérez" "Acme Corp" "+521234567890" "juan@acme.com" "prospecto" "2026-02-27"

# Update cell
gog sheets update "1abc123spreadsheetId" "Clientes!E2" "cerrado"

# Get sheet metadata (find sheet names)
gog sheets metadata "1abc123spreadsheetId"
```

## First session with client

Ask and store in `clients/{name}/crm.md`:
- Spreadsheet ID (from URL: `docs.google.com/spreadsheets/d/{THIS_PART}/`)
- Sheet name for contacts (e.g., "Clientes", "Leads")
- Column mapping: A=name, B=company, C=phone, D=email, E=stage, F=last_contact
- Pipeline stages (e.g., prospecto → contactado → cotizado → cerrado → perdido)

## Gotchas

- Spreadsheet ID is the long string in the URL, not the title
- Range format: `SheetName!A1:F100` or `SheetName!A:F` for whole columns
- `append` adds after last row with data (may skip blank rows)
- `update` overwrites — use `gog sheets get` first to verify
- Check for duplicates before adding: `gog sheets get ... --json | grep "phone"`

## Weekly pipeline report

```bash
# Get all deals
gog sheets get "1abc..." "Pipeline!A:G" --json

# Count by stage (in your response, not a command)
# "5 prospectos, 3 en negociación, 2 por cerrar esta semana"
```

## Red flags

- Contact not updated in 30+ days → stale, needs action
- >50% contacts in "prospecto" stage → pipeline not moving
- No new contacts in 2 weeks → lead gen problem
