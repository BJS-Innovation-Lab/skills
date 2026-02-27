#!/usr/bin/env node
/**
 * Generador de Cotizaciones VULKN
 * 
 * Uso:
 *   node generar-cotizacion.js --cliente "Mi Cliente" --rfc "XAXX010101000" \
 *     --items '[{"desc":"Servicio A","cant":1,"precio":5000}]' \
 *     --output cotizacion.docx
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, BorderStyle, HeadingLevel } = require('docx');
const fs = require('fs');

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const cliente = getArg('cliente') || 'Cliente';
const rfc = getArg('rfc') || 'XAXX010101000';
const itemsJson = getArg('items') || '[]';
const output = getArg('output') || 'cotizacion.docx';
const vigencia = getArg('vigencia') || '30';
const empresa = getArg('empresa') || 'VULKN';

// Parse items
let items;
try {
  items = JSON.parse(itemsJson);
} catch (e) {
  console.error('Error parsing items JSON:', e.message);
  process.exit(1);
}

// Calculate totals
const subtotal = items.reduce((sum, item) => sum + (item.cant * item.precio), 0);
const iva = subtotal * 0.16;
const total = subtotal + iva;

// Format currency
const formatMXN = (amount) => {
  return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Generate folio
const folio = `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

// Format date
const fecha = new Date().toLocaleDateString('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

// Build document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 22 } // 11pt
      }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Header
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: empresa, bold: true, size: 36 }),
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: 'COTIZACIÓN', bold: true, size: 28 }),
        ]
      }),
      
      // Folio and Date
      new Paragraph({
        children: [
          new TextRun({ text: `Folio: ${folio}`, bold: true }),
        ]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `Fecha: ${fecha}` }),
        ]
      }),
      
      // Client info
      new Paragraph({
        children: [
          new TextRun({ text: 'Cliente: ', bold: true }),
          new TextRun({ text: cliente }),
        ]
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({ text: 'RFC: ', bold: true }),
          new TextRun({ text: rfc }),
        ]
      }),
      
      // Items table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                shading: { fill: '1a1a2e' },
                children: [new Paragraph({
                  children: [new TextRun({ text: 'Descripción', bold: true, color: 'FFFFFF' })]
                })]
              }),
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: '1a1a2e' },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Cant.', bold: true, color: 'FFFFFF' })]
                })]
              }),
              new TableCell({
                width: { size: 17, type: WidthType.PERCENTAGE },
                shading: { fill: '1a1a2e' },
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'P. Unitario', bold: true, color: 'FFFFFF' })]
                })]
              }),
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                shading: { fill: '1a1a2e' },
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: 'Subtotal', bold: true, color: 'FFFFFF' })]
                })]
              }),
            ]
          }),
          // Item rows
          ...items.map(item => new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun(item.desc)] })]
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun(String(item.cant))]
                })]
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun(formatMXN(item.precio))]
                })]
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun(formatMXN(item.cant * item.precio))]
                })]
              }),
            ]
          })),
        ]
      }),
      
      // Totals
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `Subtotal: ${formatMXN(subtotal)}` }),
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `IVA (16%): ${formatMXN(iva)}` }),
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: `TOTAL: ${formatMXN(total)}`, bold: true, size: 26 }),
        ]
      }),
      
      // Terms
      new Paragraph({
        spacing: { before: 400 },
        children: [
          new TextRun({ text: 'Condiciones:', bold: true }),
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `• Esta cotización tiene una vigencia de ${vigencia} días.` }),
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Precios expresados en pesos mexicanos (MXN).' }),
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• IVA incluido en el total.' }),
        ]
      }),
    ]
  }]
});

// Write file
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(output, buffer);
  console.log(`✅ Cotización generada: ${output}`);
  console.log(`   Cliente: ${cliente}`);
  console.log(`   Folio: ${folio}`);
  console.log(`   Total: ${formatMXN(total)} MXN`);
}).catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
