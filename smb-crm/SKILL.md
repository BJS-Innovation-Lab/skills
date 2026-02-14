---
name: smb-crm
description: Customer database for Mexican SMBs using Google Sheets + Supabase hybrid. Import from Excel/CSV, create Google Sheets the user can see/edit, sync to Supabase for fast queries. Use when managing customers, importing client lists, answering "¿Quién me debe?", or setting up a simple CRM.
---

# SMB CRM - Hybrid Customer Database

A trust-first CRM: users see their data in Google Sheets (familiar), agent queries Supabase (fast).

## Prerequisites

Before using this skill, ensure:

1. **Node.js** installed (`node --version`)
2. **gog CLI** installed and authenticated:
   ```bash
   gog auth list  # Should show authenticated account
   # If not: gog auth login
   ```
3. **Supabase credentials** in environment:
   ```bash
   # Check if set
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_KEY
   ```

### First-Time Agent Setup

If credentials aren't configured:

1. **Get Supabase URL/Key** from 1Password:
   ```bash
   op read "op://BJS LABS/SUPABASE_URL HQ/url"
   op read "op://BJS LABS/SUPABASE_SERVICE_KEY HQ/credential"
   ```

2. **Add to shell profile** (`~/.zshrc` or `~/.bashrc`):
   ```bash
   export SUPABASE_URL="https://fcgiuzmmvcnovaciykbx.supabase.co"
   export SUPABASE_SERVICE_KEY="eyJ..."
   ```

3. **Or create `.env`** in the skill directory:
   ```bash
   cd ~/.openclaw/workspace/skills/smb-crm
   cp .env.example .env
   # Edit with credentials
   ```

4. **Install dependencies**:
   ```bash
   cd ~/.openclaw/workspace/skills/smb-crm
   npm install
   ```

## Architecture

```
┌─────────────────┐
│  User's Excel   │──import──┐
└─────────────────┘          │
                             ▼
┌─────────────────┐    ┌─────────────────┐
│  Google Sheet   │◄──►│    Supabase     │
│  (user sees)    │sync│  (agent uses)   │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  CSV Export     │──offline backup
└─────────────────┘
```

## Quick Start

### 1. Setup (First Time)

```bash
# Verify gog is authenticated
gog auth list

# Create Supabase tables (run once)
node scripts/setup-supabase.js
```

### 2. Import Customers

From Excel/CSV:
```bash
node scripts/import-customers.js /path/to/clientes.xlsx
```

Or interactively parse any format - see `references/import-patterns.md`.

### 3. Create Google Sheet

```bash
node scripts/create-sheet.js "Clientes - Mi Negocio"
```

Returns the Sheet ID. User can view/edit at any time.

### 4. Sync Operations

```bash
# Sheet → Supabase (user made changes)
node scripts/sync-to-supabase.js <sheetId>
node scripts/sync-to-supabase.js <sheetId> --dry-run    # Preview
node scripts/sync-to-supabase.js <sheetId> --force      # Overwrite conflicts

# Supabase → Sheet (agent made changes)
node scripts/sync-to-sheet.js <sheetId>
```

**Conflict Detection:** If Supabase was updated after the Sheet row, sync flags it as a conflict. Use `--force` to override or resolve manually.

### 5. Query Customers

```bash
# All customers
node scripts/query.js list

# Who owes money
node scripts/query.js deudores

# Search by name
node scripts/query.js search "García"

# Recent purchases
node scripts/query.js recientes 30

# Top customers by revenue
node scripts/query.js top 10
```

### 6. Offline Export

```bash
# Export all to CSV
node scripts/export-csv.js -o backup.csv

# Export only deudores
node scripts/export-csv.js --deudores -o deudores.csv

# Export search results
node scripts/export-csv.js --query "García" > garcia.csv
```

### 7. Scale Management

```bash
# Archive inactive customers (no purchase in 12 months)
node scripts/archive-inactive.js --months 12 --dry-run   # Preview
node scripts/archive-inactive.js --months 12             # Execute

# Restore an archived customer
node scripts/archive-inactive.js --restore <customer-id>

# View archive stats
node scripts/archive-inactive.js --stats
```

## Customer Schema

| Column | Spanish | Type | Notes |
|--------|---------|------|-------|
| id | ID | uuid | Auto-generated |
| nombre | Nombre | text | Required |
| telefono | Teléfono | text | Primary contact |
| email | Email | text | Optional |
| direccion | Dirección | text | Optional |
| notas | Notas | text | Free-form |
| ultima_compra | Última Compra | date | Last purchase |
| total_ventas | Total Ventas | numeric | Lifetime value |
| saldo_pendiente | Saldo Pendiente | numeric | Amount owed |
| created_at | Creado | timestamp | Auto |
| updated_at | Actualizado | timestamp | Auto-updates on change |

## Common Queries (Spanish)

| User Says | Query |
|-----------|-------|
| "¿Quién me debe dinero?" | `deudores` - saldo_pendiente > 0 |
| "Mis mejores clientes" | `top` - order by total_ventas desc |
| "¿Quién no ha comprado?" | `inactivos 90` - no purchase in 90 days |
| "Busca a Juan" | `search "Juan"` |
| "Exportar a Excel" | `export-csv.js -o export.csv` |

## Files

### Scripts
- `scripts/setup-supabase.js` - Create tables
- `scripts/import-customers.js` - Parse Excel/CSV
- `scripts/create-sheet.js` - Create Google Sheet
- `scripts/sync-to-supabase.js` - Sheet → DB (with conflict detection)
- `scripts/sync-to-sheet.js` - DB → Sheet  
- `scripts/query.js` - Query interface
- `scripts/export-csv.js` - Offline CSV export
- `scripts/archive-inactive.js` - Archive old customers for scale

### Libraries
- `lib/supabase.js` - Supabase client
- `lib/sheets.js` - Google Sheets helpers (dynamic range detection)

### References
- `references/import-patterns.md` - Excel parsing patterns
- `references/schema.sql` - Database schema

## Features

### ✅ Conflict Detection
- Tracks `updated_at` in both Sheet and Supabase
- Flags conflicts when DB record is newer than Sheet
- Options: `--force` to overwrite, or resolve manually

### ✅ Offline Support
- CSV export for backup/offline use
- Filter by deudores or search query
- Import back via `import-customers.js`

### ✅ Scale Management
- Dynamic range detection (handles >1000 rows)
- Archive inactive customers to separate table
- Restore archived customers when needed
- Warning when approaching Sheet limits

## Configuration

Store in `~/.openclaw/workspace/TOOLS.md`:

```markdown
### SMB CRM
- Supabase URL: https://xxx.supabase.co
- Supabase Key: (use env SUPABASE_KEY)
- Default Sheet: <sheetId>
- GOG Account: user@gmail.com
```

Environment variables (in `.env`):
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GOG_ACCOUNT=user@gmail.com
```

## End-to-End Example

**Scenario:** Client "Tacos El Rey" has an Excel file with 200 customers. They want to track who owes money.

```bash
# 1. Import their Excel
cd ~/.openclaw/workspace/skills/smb-crm
node scripts/import-customers.js ~/Downloads/clientes-tacos.xlsx
# → "Imported 200 customers to Supabase"

# 2. Create their Google Sheet
node scripts/create-sheet.js "Clientes - Tacos El Rey"
# → Sheet ID: 1abc...xyz
# → Share link: https://docs.google.com/spreadsheets/d/1abc...xyz

# 3. Sync data to Sheet
node scripts/sync-to-sheet.js 1abc...xyz
# → "Synced 200 customers to Sheet"

# 4. Show them who owes money
node scripts/query.js deudores
# → Lists customers with saldo_pendiente > 0

# 5. Give them the Sheet link
# They can view/edit at: https://docs.google.com/spreadsheets/d/1abc...xyz
```

## Troubleshooting

### "gog command not found"
```bash
# Install gog CLI
npm install -g gog
gog auth login
```

### "SUPABASE_URL is not defined"
```bash
# Check environment
echo $SUPABASE_URL

# If empty, get from 1Password
op read "op://BJS LABS/SUPABASE_URL HQ/url"

# Add to ~/.zshrc
export SUPABASE_URL="https://..."
source ~/.zshrc
```

### "Permission denied" on Supabase
- Check you're using the SERVICE_KEY (not anon key)
- Verify the key hasn't expired
- Check Row Level Security policies

### "Sheet not found"
- Verify the Sheet ID is correct (from URL)
- Check gog account has access to the Sheet
- Try `gog sheets metadata <sheetId>` to test access

### Sync conflicts
```bash
# Preview conflicts
node scripts/sync-to-supabase.js <sheetId> --dry-run

# Force overwrite (Sheet wins)
node scripts/sync-to-supabase.js <sheetId> --force

# Or manually resolve in Sheet, then sync
```

### Sheet is slow (too many rows)
```bash
# Archive inactive customers
node scripts/archive-inactive.js --months 12 --dry-run
node scripts/archive-inactive.js --months 12

# Check stats
node scripts/archive-inactive.js --stats
```

## Trust Principles

1. **User owns their data** - Sheet is theirs, exportable anytime
2. **Transparency** - User can see/edit the Sheet directly
3. **No lock-in** - Export to CSV/Excel works
4. **Familiar interface** - Looks like Excel they know
5. **Family sharing** - Can share Sheet with spouse/employees
6. **Offline access** - CSV export for when internet is spotty
