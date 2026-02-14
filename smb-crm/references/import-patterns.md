# Import Patterns for Mexican SMB Data

## Common File Formats

### WhatsApp Contacts Export
Users often have customer data scattered in WhatsApp. To extract:

1. Export WhatsApp contacts → VCF file
2. Convert VCF to CSV: `vcf-to-csv contacts.vcf > contacts.csv`
3. Import: `node scripts/import-customers.js contacts.csv`

### Excel Files (Most Common)

Mexican SMBs typically use column names like:
- "Cliente" or "Nombre del Cliente" → nombre
- "Tel" or "Celular" or "WhatsApp" → telefono
- "Correo" → email
- "Domicilio" → direccion
- "Observaciones" → notas
- "Debe" or "Saldo" → saldo_pendiente

### Paper → Digital

For users with paper notebooks:
1. Take photos of customer pages
2. Use OCR (or manually transcribe key fields)
3. Create simple CSV with: Nombre, Teléfono, Debe
4. Import

### CONTPAQi / Aspel Export

If using accounting software:
1. Export clients to Excel/CSV
2. Map columns:
   - "Razón Social" → nombre
   - "RFC" → notas (store for reference)
   - "Teléfono 1" → telefono
   - "Saldo" → saldo_pendiente

## Column Auto-Detection

The import script recognizes these variations:

| Field | Spanish | English | Other |
|-------|---------|---------|-------|
| nombre | nombre, cliente, razón social | name, customer, client | |
| telefono | teléfono, tel, celular, móvil | phone | whatsapp |
| email | correo, correo electrónico | email, e-mail, mail | |
| direccion | dirección, domicilio, ubicación | address | |
| notas | notas, comentarios, observaciones | notes, comments | |
| ultima_compra | última compra, fecha | last_purchase, last order | |
| total_ventas | total ventas, ventas, total | sales, revenue | |
| saldo_pendiente | saldo pendiente, saldo, debe, adeudo | balance, owed | |

## Manual Import (Conversational)

If user provides data via chat, parse like:

```
User: "Tengo estos clientes:
- Juan García, 55-1234-5678, me debe $500
- María López, 55-8765-4321, buena clienta"

Agent: *Creates CSV in memory*
nombre,telefono,saldo_pendiente,notas
Juan García,55-1234-5678,500,
María López,55-8765-4321,0,buena clienta
```

## Data Cleaning Tips

1. **Phone numbers**: Mexican format varies
   - Remove country code if present (+52)
   - Keep area code (55, 33, 81, etc.)
   - Format: XX-XXXX-XXXX or XXXXXXXXXX
   
2. **Money amounts**: 
   - Remove $ and commas
   - Handle "mil" → 1000 (e.g., "5 mil" = 5000)
   - Default currency: MXN

3. **Dates**:
   - Accept DD/MM/YYYY (Mexican format)
   - Also MM/DD/YYYY (American)
   - ISO YYYY-MM-DD always works

4. **Encoding**:
   - UTF-8 preferred
   - Handle Latin1/Windows-1252 for old Excel files
   - Preserve ñ, accents (á, é, í, ó, ú)

## Privacy Considerations

- Never store RFC (tax ID) without encryption
- Phone numbers are PII - handle carefully
- Ask before importing sensitive notes
- User owns their data - make export easy
