const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType,
        Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 400, after: 200 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 300, after: 150 } } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "VULKN x Pepe Feria — Propuesta", italics: true, size: 20, color: "666666" })] 
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Página ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })]
      })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN x Pepe Feria", bold: true, size: 48 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "Propuesta de Agente IA Integral", size: 28, color: "666666" })] }),
      
      // Executive Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Resumen Ejecutivo")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun("VULKN desplegará un sistema completo de agentes IA para Pepe Feria que automatiza:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Atención al cliente 24/7 vía WhatsApp")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Recolección y verificación de documentos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Análisis de riesgo crediticio con datos SAT/IMSS")] }),
      new Paragraph({ bullet: { level: 0 }, spacing: { after: 300 }, children: [new TextRun("Recordatorios y seguimiento de cobranza")] }),
      
      // Investment summary table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Concepto", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Valor", bold: true, color: "FFFFFF" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Inversión mensual")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "$8,000 USD/mes", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Setup inicial")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "$5,000 USD (una vez)", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Implementación")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "3-4 semanas", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("ROI esperado")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "60-70% reducción costos soporte", bold: true })] })] }),
          ]}),
        ]
      }),
      
      // Module 1
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Módulo 1: Agente WhatsApp")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Funcionalidades")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "FAQs automáticos: ", bold: true }), new TextRun("Responde preguntas frecuentes 24/7")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Estado de solicitud: ", bold: true }), new TextRun("\"¿Ya me depositaron?\" → consulta sistema")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Elegibilidad: ", bold: true }), new TextRun("\"¿Cuánto puedo pedir?\" → calcula en tiempo real")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Guía de documentos: ", bold: true }), new TextRun("Explica qué necesitan y cómo enviarlos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Escalación inteligente: ", bold: true }), new TextRun("Detecta frustración → transfiere a humano")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Métricas de éxito")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("70% de consultas resueltas sin humano")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Tiempo de respuesta <2 minutos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("NPS de usuarios atendidos por IA >8")] }),
      
      // Module 2
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Módulo 2: Verificación de Documentos")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("El agente recibe documentos vía WhatsApp, los procesa con OCR, y valida automáticamente:")] }),
      
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 6240],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Documento", bold: true })] })] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Validación", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("INE/IFE")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("OCR + verificación de vigencia, extrae CURP")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Recibo de nómina")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Extrae empresa, salario, fecha")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Comprobante domicilio")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Verifica dirección, fecha <3 meses")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("CLABE bancaria")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Validación de formato (18 dígitos)")] }),
          ]}),
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Métricas de éxito")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("90% de documentos procesados automáticamente")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Reducción de 80% en revisión manual")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Tiempo de onboarding: de días → horas")] }),
      
      // Module 3
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Módulo 3: Análisis de Riesgo SAT/IMSS")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Usando reportes tipo Majema para validar empleadores:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score crediticio empresa (0-1000): ", bold: true }), new TextRun("Validar confiabilidad del empleador")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Datos de nómina IMSS: ", bold: true }), new TextRun("Confirmar que el usuario está activo")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Historial de facturación: ", bold: true }), new TextRun("Detectar empresas en declive")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Alertas PROFECO/69-B: ", bold: true }), new TextRun("Rechazar automáticamente empresas problemáticas")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Flujo de decisión")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score >700 + nómina activa + sin alertas = ", bold: true }), new TextRun({ text: "APROBADO AUTOMÁTICO", bold: true, color: "00AA00" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score 500-700 = ", bold: true }), new TextRun({ text: "REVISIÓN MANUAL", color: "FF8800" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score <500 o alertas = ", bold: true }), new TextRun({ text: "RECHAZADO + explicación", color: "CC0000" })] }),
      
      // Module 4
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Módulo 4: Recordatorios y Cobranza")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Confirmación de depósito: ", bold: true }), new TextRun("Inmediato al depositar")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Recordatorio pre-quincena: ", bold: true }), new TextRun("3 días antes del descuento")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Notificación de descuento: ", bold: true }), new TextRun("Día del corte de nómina")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Seguimiento si falla: ", bold: true }), new TextRun("Si no se descontó, contactar")] }),
      
      // Timeline
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Cronograma")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Semana", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Entregable", bold: true, color: "FFFFFF" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Semana 1")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Kick-off + integración APIs + WhatsApp conectado")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Semana 2")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Agente de soporte básico en producción")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Semana 3")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Módulo de documentos + OCR funcionando")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Semana 4")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Análisis de riesgo + recordatorios activos")] }),
          ]}),
        ]
      }),
      
      // Next steps
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Siguiente Paso")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "1. Reunión técnica ", bold: true }), new TextRun("(1 hora) — revisar APIs disponibles")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "2. Acceso a sandbox ", bold: true }), new TextRun("— probar integraciones")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "3. Firma de contrato ", bold: true }), new TextRun("— iniciar desarrollo")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "4. Go-live ", bold: true }), new TextRun("— 4 semanas después")] }),
      
      // Contact
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN — AI agents that actually work", italics: true, size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "bridget@vulkn-ai.com | johan@vulkn-ai.com", size: 20, color: "2E75B6" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Propuesta_VULKN_PepeFeria.docx", buffer);
  console.log("Created: Propuesta_VULKN_PepeFeria.docx");
});
