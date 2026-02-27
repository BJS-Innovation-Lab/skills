---
name: vulkn-office
description: "Documentos profesionales para PyMEs mexicanas. USA ESTE SKILL cuando: el cliente pida facturas, cotizaciones, contratos, reportes, presentaciones, o cualquier documento de negocio. También para extraer datos de PDFs recibidos, llenar formularios, crear presupuestos en Excel, o generar pitch decks. Triggers: factura, CFDI, cotización, contrato, reporte, presentación, presupuesto, RFC, SAT, documento, Word, Excel, PowerPoint, PDF."
---

# VULKN Office - Documentos para PyMEs Mexicanas

Toolkit completo para crear, editar y manipular documentos de negocio adaptados al mercado mexicano.

## Cuándo Usar Este Skill

| Situación | Acción |
|-----------|--------|
| Cliente pide cotización | → Crear DOCX con plantilla VULKN |
| Recibe factura PDF | → Extraer datos (RFC, monto, fecha) |
| Necesita presentación | → Generar PPTX profesional |
| Quiere reporte financiero | → Crear XLSX con fórmulas |
| Contrato para firmar | → DOCX con campos editables |

## Guía Rápida

### 📄 PDFs (Facturas, Formularios)

```bash
# Extraer texto de factura
python ~/.openclaw/workspace/skills/office-suite/pdf/scripts/extract_form_structure.py factura.pdf

# Llenar formulario PDF
python ~/.openclaw/workspace/skills/office-suite/pdf/scripts/fill_fillable_fields.py \
  formulario.pdf salida.pdf --data '{"rfc": "XAXX010101000", "nombre": "Mi Empresa"}'
```

**Para facturas CFDI:** Extraer RFC emisor, RFC receptor, UUID, monto total, fecha de emisión.

Ver: `../office-suite/pdf/SKILL.md` para operaciones avanzadas.

### 📝 Word (Cotizaciones, Contratos)

```javascript
// Crear cotización profesional
const { Document, Packer, Paragraph, Table } = require('docx');

const doc = new Document({
  styles: { /* ver plantilla VULKN */ },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 } } // Carta US
    },
    children: [
      // Header con logo
      // Datos del cliente
      // Tabla de productos/servicios
      // Totales con IVA
      // Términos y condiciones
    ]
  }]
});
```

Ver: `../office-suite/docx/SKILL.md` para sintaxis completa.

### 📊 Excel (Presupuestos, Reportes)

```python
from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = "Presupuesto 2026"

# Headers
ws['A1'] = 'Concepto'
ws['B1'] = 'Cantidad'
ws['C1'] = 'Precio Unitario'
ws['D1'] = 'Subtotal'

# Fórmula de subtotal
ws['D2'] = '=B2*C2'

# Total con IVA (16%)
ws['D10'] = '=SUM(D2:D9)'
ws['D11'] = '=D10*0.16'
ws['D12'] = '=D10+D11'
```

Ver: `../office-suite/xlsx/SKILL.md` para fórmulas avanzadas.

### 📽️ PowerPoint (Pitch Decks, Presentaciones)

```javascript
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();

// Slide de título
let slide = pres.addSlide();
slide.addText('Propuesta Comercial', {
  x: 0.5, y: 2, w: 9, h: 1.5,
  fontSize: 44, bold: true, color: '1a1a2e'
});

// Slide de servicios
slide = pres.addSlide();
slide.addTable(serviciosData, { /* estilos */ });

pres.writeFile({ fileName: 'propuesta.pptx' });
```

Ver: `../office-suite/pptx/SKILL.md` para layouts y animaciones.

---

## Plantillas VULKN

### Cotización Estándar

```
┌─────────────────────────────────────────┐
│ [LOGO]          COTIZACIÓN              │
│                 Folio: COT-2026-XXX     │
│─────────────────────────────────────────│
│ Cliente: [Nombre]                       │
│ RFC: [RFC del cliente]                  │
│ Fecha: [Fecha actual]                   │
│ Vigencia: 30 días                       │
│─────────────────────────────────────────│
│ Concepto    | Cant | P.Unit | Subtotal  │
│─────────────────────────────────────────│
│ [Items...]                              │
│─────────────────────────────────────────│
│                      Subtotal: $X,XXX   │
│                      IVA 16%:  $X,XXX   │
│                      TOTAL:    $X,XXX   │
│─────────────────────────────────────────│
│ Términos: [Condiciones de pago]         │
│ Cuenta: [Datos bancarios]               │
└─────────────────────────────────────────┘
```

### Datos Fiscales México

| Campo | Formato | Ejemplo |
|-------|---------|---------|
| RFC Persona Física | 4 letras + 6 dígitos + 3 alfanum | GARC850101ABC |
| RFC Persona Moral | 3 letras + 6 dígitos + 3 alfanum | VUL260101XYZ |
| CURP | 18 caracteres | GARC850101HDFRRL09 |
| UUID CFDI | 36 caracteres (8-4-4-4-12) | 6F5A52D1-... |

---

## Flujos Comunes

### 1. Cliente Recibe Factura → Extraer Datos

```bash
# 1. Convertir a texto
pdftotext -layout factura.pdf factura.txt

# 2. O extraer estructura
python ../office-suite/pdf/scripts/extract_form_structure.py factura.pdf

# 3. Buscar campos clave
grep -E "(RFC|UUID|Total|Fecha)" factura.txt
```

### 2. Generar Cotización desde Conversación

1. Extraer: cliente, productos, cantidades, precios
2. Calcular: subtotales, IVA, total
3. Generar: DOCX o PDF con plantilla VULKN
4. Entregar: enviar por WhatsApp/email

### 3. Crear Reporte Mensual

1. Recopilar: datos de ventas del mes
2. Procesar: agrupar por categoría, calcular totales
3. Generar: XLSX con gráficas + PPTX resumen
4. Entregar: enviar a dueño del negocio

---

## Dependencias

```bash
# Python
pip install pypdf pdfplumber reportlab openpyxl python-docx

# Node
npm install docx pptxgenjs

# Sistema (macOS)
brew install poppler qpdf libreoffice
```

## Notas para Field Agents

1. **Siempre preguntar** el RFC del cliente antes de generar documentos fiscales
2. **IVA es 16%** en México (no 15%, no 10%)
3. **Moneda**: usar formato mexicano ($1,234.56 MXN)
4. **Fechas**: formato dd/mm/yyyy o "27 de febrero de 2026"
5. **Cotizaciones** típicamente tienen vigencia de 15-30 días

---

*Adaptado de Anthropic Claude Cowork skills para VULKN field agents, Feb 2026*
