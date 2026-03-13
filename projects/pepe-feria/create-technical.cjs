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
        children: [new TextRun({ text: "VULKN x Pepe Feria — Propuesta Técnica", italics: true, size: 20, color: "666666" })] 
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Página ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })]
      })] })
    },
    children: [
      // ===== TITLE =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN x Pepe Feria", bold: true, size: 48 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "Propuesta Técnica — Sistema de Agentes IA", size: 28, color: "666666" })] }),
      
      // ===== RESUMEN =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Resumen Ejecutivo")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun("VULKN desplegará un sistema completo de agentes IA para Pepe Feria que automatiza:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Atención al cliente 24/7 vía WhatsApp")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Recolección y verificación de documentos (INE, nómina, domicilio)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Análisis de riesgo crediticio con datos SAT/IMSS")] }),
      new Paragraph({ bullet: { level: 0 }, spacing: { after: 300 }, children: [new TextRun("Recordatorios y seguimiento de cobranza suave")] }),
      
      // ===== MODULE 1 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("Módulo 1: Agente WhatsApp — Atención al Cliente")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Funcionalidades")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "FAQs automáticos: ", bold: true }), new TextRun("Responde preguntas frecuentes 24/7")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Estado de solicitud: ", bold: true }), new TextRun("\"¿Ya me depositaron?\" → consulta sistema en tiempo real")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Elegibilidad: ", bold: true }), new TextRun("\"¿Cuánto puedo pedir?\" → calcula basado en reglas de negocio")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Guía de documentos: ", bold: true }), new TextRun("Explica qué necesitan y cómo enviarlos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Escalación inteligente: ", bold: true }), new TextRun("Detecta frustración o casos complejos → transfiere a humano")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Métricas de Éxito")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("70% de consultas resueltas sin intervención humana")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Tiempo de respuesta <2 minutos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("NPS de usuarios atendidos por IA >8")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requerimientos de Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("API de usuarios — consultar estatus, monto aprobado, fechas")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Base de conocimientos — FAQs, políticas, términos de servicio")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Acceso a WhatsApp Business (o utilizamos número Twilio)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Contactos de escalación — nombres, horarios")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Conversaciones de ejemplo — 20-30 chats reales (anonimizados)")] }),
      
      // ===== MODULE 2 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("Módulo 2: Verificación de Documentos")] }),
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
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("OCR + verificación de vigencia, extracción de CURP")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Recibo de nómina")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Extrae empresa, salario, fecha de pago")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Comprobante domicilio")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Verifica dirección, valida antigüedad <3 meses")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("CLABE bancaria")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Validación de formato (18 dígitos)")] }),
          ]}),
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Métricas de Éxito")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("90% de documentos procesados automáticamente")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("80% reducción en revisión manual")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Tiempo de onboarding: de días → horas")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requerimientos de Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Reglas de validación — qué hace un documento \"válido\"")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Endpoint de integración — dónde guardar documentos aprobados")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Formato de datos esperado — JSON schema para datos extraídos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Documentos de ejemplo — 5-10 buenos y rechazados de cada tipo")] }),
      
      // ===== MODULE 3 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("Módulo 3: Análisis de Riesgo SAT/IMSS")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Usando reportes tipo Majema para validar empleadores:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score crediticio empresa (0-1000): ", bold: true }), new TextRun("Validar confiabilidad del empleador")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Datos de nómina IMSS: ", bold: true }), new TextRun("Confirmar que el usuario está activo")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Historial de facturación: ", bold: true }), new TextRun("Detectar empresas en declive")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Alertas PROFECO/69-B: ", bold: true }), new TextRun("Rechazar automáticamente empresas problemáticas")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Flujo de Decisión")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score >700 + nómina activa + sin alertas = ", bold: true }), new TextRun({ text: "APROBADO AUTOMÁTICO", bold: true, color: "00AA00" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score 500-700 = ", bold: true }), new TextRun({ text: "REVISIÓN MANUAL", color: "FF8800" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score <500 o alertas = ", bold: true }), new TextRun({ text: "RECHAZADO + explicación", color: "CC0000" })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Métricas de Éxito")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("15-20% reducción en tasa de mora")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("50% de solicitudes aprobadas automáticamente")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Tiempo de decisión: de horas → segundos")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requerimientos de Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Acceso a reportes SAT/IMSS — API o base de datos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Lista de empleadores aprobados — empresas ya validadas")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Reglas de scoring actuales — qué score aprueban, criterios de rechazo")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Credenciales de API — acceso sandbox primero")] }),
      
      // ===== MODULE 4 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("Módulo 4: Recordatorios y Cobranza Suave")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Confirmación de depósito: ", bold: true }), new TextRun("Inmediato cuando llegan los fondos")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Recordatorio pre-quincena: ", bold: true }), new TextRun("3 días antes del descuento de nómina")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Notificación de descuento: ", bold: true }), new TextRun("El día del corte de nómina")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Seguimiento por falla: ", bold: true }), new TextRun("Si el descuento no se procesó")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Tono de Comunicación")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Amigable, no amenazante")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Lenguaje coloquial mexicano")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Emojis moderados")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requerimientos de Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Calendario de nóminas — fechas por empleador")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Webhooks — cuando se procesa o falla un pago")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Templates aprobados por legal")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Reglas de escalación — cuántos mensajes antes de llamar")] }),
      
      // ===== ARQUITECTURA =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("Arquitectura Técnica")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Stack Tecnológico")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Agente: ", bold: true }), new TextRun("OpenClaw + Claude (Anthropic)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "WhatsApp: ", bold: true }), new TextRun("Twilio Business API")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "OCR: ", bold: true }), new TextRun("Claude Vision / Google Document AI")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Hosting: ", bold: true }), new TextRun("Railway (servidores en México)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Base de datos: ", bold: true }), new TextRun("Supabase (PostgreSQL)")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Incluye")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Soporte técnico 24/7")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Actualizaciones continuas del agente")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Dashboard de métricas")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Hasta 50,000 conversaciones/mes")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Almacenamiento de documentos 1 año")] }),
      
      // Contact
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN — AI agents that actually work", italics: true, size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "bridget@vulkn-ai.com | johan@vulkn-ai.com", size: 20, color: "2E75B6" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("VULKN_PepeFeria_Propuesta_Tecnica.docx", buffer);
  console.log("Created: VULKN_PepeFeria_Propuesta_Tecnica.docx");
});
