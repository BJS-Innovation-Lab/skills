const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Colors
const VULKN_BLUE = "2E75B6";
const VULKN_LIGHT = "D5E8F0";
const GRAY = "666666";
const LIGHT_GRAY = "F5F5F5";

// Helper for table borders
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, 
                   left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// Helper to create a styled table
function createTable(headers, rows, colWidths) {
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: VULKN_BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ 
        children: [new TextRun({ text: h, bold: true, color: "FFFFFF", font: "Arial", size: 20 })]
      })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ 
        children: [new TextRun({ text: cell, font: "Arial", size: 20 })]
      })]
    }))
  }));

  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

// Create the document
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: VULKN_BLUE },
        paragraph: { spacing: { before: 400, after: 200 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: VULKN_BLUE },
        paragraph: { spacing: { before: 300, after: 150 } } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: VULKN_BLUE } },
          children: [
            new TextRun({ text: "VULKN", bold: true, color: VULKN_BLUE, size: 24, font: "Arial" }),
            new TextRun({ text: "  |  Propuesta de Servicios Tecnológicos", color: GRAY, size: 20, font: "Arial" })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Página ", size: 18, color: GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Arial" }),
            new TextRun({ text: " de ", size: 18, color: GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: "Arial" })
          ]
        })]
      })
    },
    children: [
      // Title Page
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "PROPUESTA DE SERVICIOS", bold: true, size: 56, color: VULKN_BLUE, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "TECNOLÓGICOS", bold: true, size: 56, color: VULKN_BLUE, font: "Arial" })]
      }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Preparado para", size: 24, color: GRAY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Click Seguros Inc. S.A. de C.V.", bold: true, size: 32, font: "Arial" })]
      }),
      new Paragraph({ spacing: { before: 1500 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "12 de marzo de 2026", size: 22, color: GRAY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Versión 1.0", size: 22, color: GRAY, font: "Arial" })]
      }),
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN / BJS LABS", bold: true, size: 28, color: VULKN_BLUE, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Inteligencia Artificial para Negocios", italics: true, size: 22, color: GRAY, font: "Arial" })]
      }),

      // Page Break
      new Paragraph({ children: [new PageBreak()] }),

      // Section 1: Resumen
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Resumen Ejecutivo")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "Este documento presenta las opciones de servicio disponibles para Click Seguros, incluyendo costos, garantías de seguridad, certificaciones y términos de servicio.",
          font: "Arial", size: 22
        })]
      }),

      // Section 2: Aplicaciones
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Aplicaciones Desarrolladas")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "VULKN ha desarrollado y mantiene las siguientes aplicaciones:", font: "Arial", size: 22 })] }),
      createTable(
        ["Aplicación", "Descripción", "Estado"],
        [
          ["CrediCLICK", "Sistema de gestión de créditos (7 pasos)", "✅ Producción"],
          ["CLK Agentes", "Portal de registro de agentes", "✅ Producción"],
          ["CLK BI Dashboard", "Tablero de inteligencia de negocios", "95% completo"],
          ["Cargue de Pólizas", "Sistema de carga y procesamiento", "✅ Producción"],
          ["Landing Pages", "Páginas de marca", "✅ Producción"],
        ],
        [2500, 4500, 2360]
      ),

      // Section 3: Seguridad
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Infraestructura y Seguridad")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Arquitectura Cloud")] }),
      createTable(
        ["Componente", "Proveedor", "Certificaciones"],
        [
          ["Hosting de Aplicaciones", "Vercel", "SOC 2 Type II, ISO 27001"],
          ["Base de Datos", "Supabase (PostgreSQL)", "SOC 2 Type II, HIPAA Ready"],
          ["CDN Global", "Cloudflare (vía Vercel)", "ISO 27001, PCI DSS"],
        ],
        [3000, 3000, 3360]
      ),

      new Paragraph({ spacing: { before: 300 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("Seguridad de Datos")] }),
      createTable(
        ["Medida de Seguridad", "Implementación"],
        [
          ["Encriptación en reposo", "AES-256 (estándar bancario)"],
          ["Encriptación en tránsito", "TLS 1.3 / SSL automático"],
          ["Protección DDoS", "Cloudflare Enterprise"],
          ["Respaldos automáticos", "Diarios, retención 30 días"],
          ["Control de acceso", "Row Level Security (RLS), JWT tokens"],
          ["Gestión de parches", "Automática (servicios administrados)"],
        ],
        [4680, 4680]
      ),

      new Paragraph({ spacing: { before: 300 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("Disponibilidad (SLA)")] }),
      createTable(
        ["Métrica", "Garantía"],
        [
          ["Uptime", "99.9% mensual"],
          ["Tiempo de respuesta", "< 200ms (promedio global)"],
          ["RPO (Recovery Point)", "24 horas"],
          ["RTO (Recovery Time)", "4 horas"],
        ],
        [4680, 4680]
      ),

      // Section 4: Opciones
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Opciones de Servicio")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Opción A: Servicio Administrado (Recomendado)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "VULKN continúa operando y manteniendo toda la infraestructura.", font: "Arial", size: 22 })] }),
      createTable(
        ["Concepto", "Costo Mensual"],
        [
          ["Licencia de aplicaciones (5 apps)", "$50,000 MXN"],
          ["Infraestructura cloud", "$15,000 MXN"],
          ["Soporte prioritario", "$10,000 MXN"],
          ["TOTAL", "$75,000 MXN"],
        ],
        [6000, 3360]
      ),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Incluye: Hosting, base de datos, respaldos, actualizaciones de seguridad, soporte 24/7, SLA 99.9%", font: "Arial", size: 20, italics: true, color: GRAY })] }),

      new Paragraph({ spacing: { before: 400 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("Opción B: Migración a Infraestructura Propia")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "VULKN apoya la migración de aplicaciones y datos a servidores de Click Seguros.", font: "Arial", size: 22 })] }),
      createTable(
        ["Concepto", "Costo Único"],
        [
          ["Documentación y análisis", "$25,000 MXN"],
          ["Scripts de migración y testing", "$35,000 MXN"],
          ["Soporte de implementación (80 hrs)", "$120,000 MXN"],
          ["Soporte post-migración (30 días)", "$50,000 MXN"],
          ["TOTAL", "$230,000 MXN"],
        ],
        [6000, 3360]
      ),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Exclusiones: Licencias Microsoft, configuración de hardware/red, certificados SSL, soporte después de 30 días.", font: "Arial", size: 20, italics: true, color: GRAY })] }),

      // Section 5: Comparativa
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Comparativa de Opciones")] }),
      createTable(
        ["Factor", "Opción A (Administrado)", "Opción B (Migración)"],
        [
          ["Costo inicial", "$0", "$230,000 MXN"],
          ["Costo mensual", "$75,000 MXN", "$4,000-10,000 MXN + IT"],
          ["Seguridad", "SOC 2, encriptación, DDoS", "Depende de implementación"],
          ["Respaldos", "Automáticos", "Responsabilidad de CLK"],
          ["Actualizaciones", "Automáticas", "Responsabilidad de CLK"],
          ["Escalabilidad", "Automática global", "Limitada a servidor"],
          ["Soporte", "Incluido 24/7", "30 días incluidos"],
          ["Tiempo de implementación", "Inmediato", "4-8 semanas"],
        ],
        [2800, 3280, 3280]
      ),

      // Section 6: Comparativa de Seguridad
      new Paragraph({ spacing: { before: 400 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Comparativa de Seguridad")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Análisis técnico de seguridad entre infraestructura cloud administrada vs. servidores on-premise:", font: "Arial", size: 22 })] }),
      createTable(
        ["Aspecto", "Cloud (Actual)", "On-Premise (Migración)"],
        [
          ["Encriptación en reposo", "✅ AES-256 automático", "⚠️ Depende de config"],
          ["Encriptación en tránsito", "✅ TLS 1.3 automático", "⚠️ Requiere configurar"],
          ["Protección DDoS", "✅ Cloudflare incluido", "❌ Requiere comprar"],
          ["Respaldos", "✅ Diarios automáticos", "⚠️ Requiere configurar"],
          ["Cumplimiento SOC 2", "✅ Certificado", "⚠️ Depende de hosting"],
          ["Uptime SLA", "✅ 99.9% garantizado", "⚠️ Depende de IT"],
          ["Control de acceso", "✅ RLS + JWT", "❌ Construir desde cero"],
          ["Parches de seguridad", "✅ Automáticos", "❌ Manuales (Hugo)"],
        ],
        [3000, 3180, 3180]
      ),

      // Section 7: NDA
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Confidencialidad")] }),
      new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: "VULKN se compromete a:", font: "Arial", size: 22 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "• Confidencialidad de datos: Todos los datos son tratados como información confidencial.", font: "Arial", size: 22 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "• Acceso restringido: Solo personal autorizado tiene acceso a los sistemas.", font: "Arial", size: 22 })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "• No divulgación: La información no será compartida con terceros.", font: "Arial", size: 22 })] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "• Eliminación de datos: En caso de terminación, datos exportados y eliminados en 30 días.", font: "Arial", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "NDA formal disponible para firma por separado.", font: "Arial", size: 22, bold: true })] }),

      // Section 8: Contact
      new Paragraph({ spacing: { before: 600 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Contacto")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Johan Rios", font: "Arial", size: 24, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "CEO, VULKN / BJS LABS", font: "Arial", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "📧 johan@vulkn-ai.com", font: "Arial", size: 22 })] }),
      new Paragraph({ children: [new TextRun({ text: "📱 +52 55 3590 4118", font: "Arial", size: 22 })] }),

      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Esta propuesta es válida por 30 días a partir de la fecha de emisión.", font: "Arial", size: 20, italics: true, color: GRAY })
      ]}),
    ]
  }]
});

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/sybil/.openclaw/workspace/projects/click-seguros/Propuesta-Click-Seguros-VULKN.docx', buffer);
  console.log('✅ Document created: Propuesta-Click-Seguros-VULKN.docx');
});
