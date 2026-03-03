# Reportes y Datos

## Skills to Use

| Skill | When |
|-------|------|
| `office-suite` | Excel spreadsheets, Word reports, PDF export |
| `google-official` (gog) | Google Sheets for live data, Docs for reports |
| `notion` | Notion databases and dashboards |
| `firecrawl` | Scrape data sources |

---

## Commands

```bash
# Read spreadsheet data
gog sheets get "1abc123spreadsheetId" "Ventas!A1:E50" --json

# Read entire sheet
gog sheets get "1abc123spreadsheetId" "Ventas!A:Z" --plain

# Update values
gog sheets update "1abc123spreadsheetId" "Resumen!B2:B5" "1500" "2300" "1800" "5600"

# Create new spreadsheet
gog sheets create "Reporte Mensual Feb 2026" --json
# Returns spreadsheetId to use in subsequent commands

# Export as PDF
gog sheets export "1abc123spreadsheetId" --format pdf --output "reporte.pdf"

# Export as CSV
gog sheets export "1abc123spreadsheetId" --format csv --output "datos.csv"
```

## Chart generation (no API needed)

Use QuickChart.io — just construct URL:
```
https://quickchart.io/chart?c={type:'bar',data:{labels:['Ene','Feb','Mar'],datasets:[{data:[10,20,30]}]}}
```

Encode the JSON and embed in reports or send as image.

## Gotchas

- Range `A1:E50` = specific cells; `A:E` = entire columns
- `--plain` outputs TSV (tab-separated) — good for parsing
- `--json` returns nested arrays — good for code
- Numbers as strings in sheets: "1,500" won't sum. Use 1500.
- Currency format: do in sheets formulas, not in data

## Report structure

```markdown
## Resumen Ejecutivo (2 líneas)
[Número principal] vs [período anterior] — [por qué]

## Métricas Clave
| Métrica | Este mes | Mes anterior | Cambio |
|---------|----------|--------------|--------|

## Siguiente paso
[Una acción concreta basada en los datos]
```

## Before generating reports

- Verify data source is current (check last update timestamp)
- Ask: "¿Qué decisión quieres tomar con este reporte?"
