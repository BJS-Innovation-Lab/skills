# Document Procedures

## Document Organization

### Folder Structure
```
Drive/
├── Clients/
│   └── [Client Name]/
│       ├── Contracts/
│       ├── Projects/
│       └── Communications/
├── Internal/
│   ├── Templates/
│   ├── SOPs/
│   └── Reports/
└── Archive/
```

### Naming Convention
`YYYY-MM-DD_Description_Version.ext`

Example: `2024-01-15_Proposal_Acme_v2.pdf`

## Google Drive Commands (via gog)

```bash
# Search for files
gog drive search "proposal"

# List folder contents
gog drive ls "Clients/Acme"

# Upload file
gog drive upload ./file.pdf --folder "Clients/Acme"

# Download file
gog drive download "file-id" -o ./local.pdf
```

## Template Library

Keep templates in `Internal/Templates/`:
- Proposal template
- Invoice template
- Contract template
- Meeting notes template
- Project brief template

## Document Workflows

### Creating New Document
1. Check if template exists
2. Copy template to appropriate folder
3. Rename with date/description
4. Fill in details
5. Share with relevant people

### Finding Documents
1. Try search first (faster)
2. Check likely folders
3. Check recent files
4. Ask owner if still not found

### Archiving
Move completed projects to Archive/ quarterly:
- Keeps active folders clean
- Maintains history
- Reduces clutter
