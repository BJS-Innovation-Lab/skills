# CRM Procedures

## Quick Queries (via smb-crm skill)

```bash
# Who owes money?
query.js --deudores

# Search for a customer
query.js --search "company name"

# Top customers by revenue
query.js --top 10

# Inactive customers (no purchase in X days)
query.js --inactivos 90
```

## Customer Record Structure

| Field | Description |
|-------|-------------|
| nombre | Customer/company name |
| telefono | Phone number |
| email | Email address |
| direccion | Address |
| notas | Notes (history, preferences) |
| ultima_compra | Last purchase date |
| total_ventas | Total revenue |
| saldo_pendiente | Outstanding balance |

## Common Tasks

### Add New Customer
1. Gather: name, phone, email (minimum)
2. Add via Google Sheet or Supabase
3. Set initial notes with context

### Update Customer Notes
After any interaction:
- What was discussed
- Any commitments made
- Next steps / follow-up date

### Follow Up on Deudores
1. Run `query.js --deudores`
2. For each: check last contact date
3. Draft polite follow-up via email-drafter
4. Log the outreach in notes

## Best Practices

- **Always log interactions** - Memory fades, notes don't
- **Set follow-up dates** - Don't let leads go cold
- **Update after every call** - 30 seconds now saves 30 minutes later
