# Google Workspace Setup for VULKN Agents

**Last Updated:** 2026-02-25 by Sybil  
**Status:** WORKING ✅

## Overview

All VULKN agents can access Google Workspace (Gmail, Calendar, Drive, Docs, Sheets, Contacts) via service account impersonation. No OAuth tokens needed — just configure the service account key and your email.

## Prerequisites

- `gog` CLI installed (`brew install steipete/tap/gogcli`)
- Service account key file (get from Bridget or Johan)
- Your @vulkn-ai.com email exists in Google Workspace

## Working Accounts

| Email | Status |
|-------|--------|
| scarlett@vulkn-ai.com | ✅ |
| saber@vulkn-ai.com | ✅ |
| santos@vulkn-ai.com | ✅ |
| sam@vulkn-ai.com | ✅ |
| sibyl@vulkn-ai.com | ✅ |
| sage@vulkn-ai.com | ✅ |

## Setup Steps

### 1. Get the Service Account Key

Request `vulkn-service-account.json` from Bridget or Johan. Save it to:
```
~/.config/gog/vulkn-service-account.json
```

### 2. Configure Service Account for Your Email

```bash
gog auth service-account set --key=~/.config/gog/vulkn-service-account.json YOUR_NAME@vulkn-ai.com
```

Example:
```bash
gog auth service-account set --key=~/.config/gog/vulkn-service-account.json saber@vulkn-ai.com
```

### 3. Set Default Account (Optional)

```bash
echo "YOUR_NAME@vulkn-ai.com" > ~/.config/gog/account.txt
```

Or use `--account` flag on each command.

### 4. Test

```bash
gog gmail search 'in:inbox' --max 3 --account YOUR_NAME@vulkn-ai.com
```

## Common Commands

### Gmail
```bash
# Search inbox
gog gmail search 'in:inbox newer_than:7d' --max 10

# Send email
gog gmail send --to recipient@example.com --subject "Subject" --body "Message"

# Send with multi-line body
gog gmail send --to recipient@example.com --subject "Subject" --body-file - <<'EOF'
Hi,

This is a multi-line message.

Best,
Agent Name
EOF
```

### Calendar
```bash
# List events
gog calendar events primary --from 2026-02-25 --to 2026-03-01

# Create event
gog calendar create primary --summary "Meeting" --from 2026-02-26T10:00:00 --to 2026-02-26T11:00:00
```

### Drive
```bash
# Search files
gog drive search "name contains 'report'" --max 10

# List recent files
gog drive search "modifiedTime > '2026-02-01'" --max 10
```

### Sheets
```bash
# Read data
gog sheets get SPREADSHEET_ID "Sheet1!A1:D10" --json

# Write data
gog sheets update SPREADSHEET_ID "Sheet1!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED
```

### Docs
```bash
# Read document
gog docs cat DOCUMENT_ID

# Export to text
gog docs export DOCUMENT_ID --format txt --out /tmp/doc.txt
```

## Service Account Details

- **Project:** hq-vulkn
- **Service Account:** vulkn-agents@hq-vulkn.iam.gserviceaccount.com
- **Client ID:** 112686295089031758606

## Authorized Scopes

These scopes are configured in Google Workspace Admin (Domain-wide Delegation):

- `gmail.modify`
- `gmail.send`
- `gmail.readonly`
- `gmail.labels`
- `gmail.settings.basic`
- `gmail.settings.sharing`
- `calendar`
- `drive`
- `documents`
- `spreadsheets`
- `contacts`

## Vertex AI / Imagen

The same service account also has **Vertex AI User** role for generative AI:

```bash
# Use with gcloud or API calls
# No additional setup needed — IAM role already granted
```

## Troubleshooting

### "unauthorized_client" Error
- Check that your @vulkn-ai.com account exists in Google Workspace
- Verify service account key is correct
- Re-run the `gog auth service-account set` command

### "User not found" Error  
- Your account doesn't exist in Google Workspace yet
- Ask Bridget/Johan to create it in admin.google.com

### Commands Hang
- You might have old OAuth tokens conflicting
- Clear tokens: `rm ~/.config/gog/tokens.json`
- Re-configure service account

## Adding New Agents

1. Create @vulkn-ai.com account in Google Workspace Admin
2. Send them the service account key file
3. They run the setup steps above

No changes needed to domain-wide delegation — it applies to all users in the domain.

---

*Questions? Ask Sybil or check the gog docs: https://gogcli.sh*
