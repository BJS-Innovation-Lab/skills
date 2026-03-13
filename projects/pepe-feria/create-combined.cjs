const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType,
        Header, Footer, PageNumber, PageBreak } = require('docx');
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
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "444444" },
        paragraph: { spacing: { before: 200, after: 100 } } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "VULKN x Pepe Feria — Full Proposal", italics: true, size: 20, color: "666666" })] 
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 })]
      })] })
    },
    children: [
      // ===== TITLE =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN x Pepe Feria", bold: true, size: 48 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "Complete AI Agent System — Proposal & Requirements", size: 28, color: "666666" })] }),
      
      // ===== EXECUTIVE SUMMARY =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun("VULKN will deploy a complete AI agent system for Pepe Feria that automates:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("24/7 customer support via WhatsApp")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Document collection and verification (INE, payroll, address)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Credit risk analysis using SAT/IMSS data")] }),
      new Paragraph({ bullet: { level: 0 }, spacing: { after: 300 }, children: [new TextRun("Payment reminders and soft collections")] }),
      
      // Investment table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true, color: "FFFFFF" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Monthly Investment")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "$8,000 USD/month", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Initial Setup")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "$5,000 USD (one-time)", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Implementation")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "3-4 weeks", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph("Expected ROI")] }),
            new TableCell({ borders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "60-70% reduction in support costs", bold: true })] })] }),
          ]}),
        ]
      }),
      
      // ===== MODULE 1 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Module 1: WhatsApp Support Agent")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Features")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Automatic FAQs: ", bold: true }), new TextRun("Answers common questions 24/7")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Application status: ", bold: true }), new TextRun("\"Did my money arrive?\" → checks system")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Eligibility: ", bold: true }), new TextRun("\"How much can I request?\" → calculates in real-time")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Document guidance: ", bold: true }), new TextRun("Explains what's needed and how to send")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Smart escalation: ", bold: true }), new TextRun("Detects frustration → transfers to human")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Success Metrics")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("70% of inquiries resolved without human")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Response time <2 minutes")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("NPS of AI-served users >8")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requirements from Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("User API — check status, approved amount, dates")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Knowledge base — FAQs, policies, terms of service")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("WhatsApp Business access (or we use our Twilio number)")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Escalation contacts — names, schedules")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Example conversations — 20-30 real chats (anonymized)")] }),
      
      // ===== MODULE 2 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Module 2: Document Verification")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Agent receives documents via WhatsApp, processes with OCR, validates automatically:")] }),
      
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 6240],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Document", bold: true })] })] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Validation", bold: true })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("INE/IFE (ID card)")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("OCR + expiration check, extracts CURP")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Payroll receipt")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Extracts employer, salary, date")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Proof of address")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Verifies address, date <3 months old")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Bank account (CLABE)")] }),
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Format validation (18 digits)")] }),
          ]}),
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Success Metrics")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("90% of documents processed automatically")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("80% reduction in manual review")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Onboarding time: from days → hours")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requirements from Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Validation rules — what makes a document \"valid\"")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Integration endpoint — where to save approved documents")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Expected data format — JSON schema for extracted data")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Example documents — 5-10 good and rejected samples of each type")] }),
      
      // ===== MODULE 3 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Module 3: SAT/IMSS Risk Analysis")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Using Majema-style reports to validate employers:")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Company credit score (0-1000): ", bold: true }), new TextRun("Validate employer reliability")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "IMSS payroll data: ", bold: true }), new TextRun("Confirm user is actively employed")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Invoice history: ", bold: true }), new TextRun("Detect declining companies")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "PROFECO/69-B alerts: ", bold: true }), new TextRun("Auto-reject problematic employers")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Decision Flow")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score >700 + active payroll + no alerts = ", bold: true }), new TextRun({ text: "AUTO-APPROVED", bold: true, color: "00AA00" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score 500-700 = ", bold: true }), new TextRun({ text: "MANUAL REVIEW", color: "FF8800" })] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Score <500 or alerts = ", bold: true }), new TextRun({ text: "REJECTED + explanation", color: "CC0000" })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Success Metrics")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("15-20% reduction in default rate")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("50% of applications auto-approved")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Decision time: from hours → seconds")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requirements from Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("SAT/IMSS report access — API or database dump")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Approved employer list — companies already validated")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Current scoring rules — what score they approve today, rejection criteria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("API credentials — sandbox access first")] }),
      
      // ===== MODULE 4 =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Module 4: Reminders & Soft Collections")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Deposit confirmation: ", bold: true }), new TextRun("Immediate when funds arrive")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Pre-payday reminder: ", bold: true }), new TextRun("3 days before payroll deduction")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Deduction notification: ", bold: true }), new TextRun("On payroll cutoff day")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "Failed payment follow-up: ", bold: true }), new TextRun("If deduction didn't process")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Requirements from Pepe Feria")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Payroll calendar — dates by employer")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Webhooks — when payment processes or fails")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Legal-approved message templates")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Escalation rules — how many messages before calling")] }),
      
      // ===== PAGE BREAK =====
      new Paragraph({ children: [new PageBreak()] }),
      
      // ===== PRICING BREAKDOWN =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Pricing Breakdown")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Monthly")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6240, 3120],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Module", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Monthly", bold: true, color: "FFFFFF" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("WhatsApp Agent (unlimited)")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$3,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Document Verification")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$2,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("SAT/IMSS Risk Analysis")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$2,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Reminders & Collections")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$1,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "$8,000/month", bold: true })] })] }),
          ]}),
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("One-Time Setup")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6240, 3120],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Pepe Feria API integration")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$3,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("Training with historical data")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("$2,000")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, children: [new Paragraph("WhatsApp Business setup")] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph("Included")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6240, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL SETUP", bold: true })] })] }),
            new TableCell({ borders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: "E8F4FD", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "$5,000", bold: true })] })] }),
          ]}),
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("Includes")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("24/7 technical support")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Continuous agent updates")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Metrics dashboard")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Up to 50,000 conversations/month")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("1 year document storage")] }),
      
      // ===== TIMELINE =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Timeline")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 7020],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Week", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: "Deliverable", bold: true, color: "FFFFFF" })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Week 1")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Kick-off + API integration + WhatsApp connected")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Week 2")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Basic support agent in production")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Week 3")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Document module + OCR working")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Week 4")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Risk analysis + reminders active")] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph("Week 5+")] }),
            new TableCell({ borders, width: { size: 7020, type: WidthType.DXA }, children: [new Paragraph("Continuous optimization based on metrics")] }),
          ]}),
        ]
      }),
      
      // ===== QUESTIONS FOR FIRST MEETING =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Questions for First Meeting")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Do you have documented APIs or will we need to reverse-engineer?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("How many support conversations do you handle per month?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("What's your current rejection rate and why?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("How automated is your process today?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("Who makes the final decision to approve an application?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("What's your default rate? What percentage?")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun("How many employers do you currently have agreements with?")] }),
      
      // ===== NEXT STEPS =====
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600 }, children: [new TextRun("Next Steps")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "1. Technical meeting ", bold: true }), new TextRun("(1 hour) — review available APIs")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "2. Sandbox access ", bold: true }), new TextRun("— test integrations")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "3. Contract signing ", bold: true }), new TextRun("— begin development")] }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: "4. Go-live ", bold: true }), new TextRun("— 4 weeks later")] }),
      
      // Contact
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "VULKN — AI agents that actually work", italics: true, size: 20, color: "666666" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "bridget@vulkn-ai.com | johan@vulkn-ai.com", size: 20, color: "2E75B6" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("VULKN_PepeFeria_Proposal_EN.docx", buffer);
  console.log("Created: VULKN_PepeFeria_Proposal_EN.docx");
});
