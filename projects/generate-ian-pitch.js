const pptxgen = require('pptxgenjs');
const fs = require('fs');

const pres = new pptxgen();

// Set presentation properties
pres.title = 'VULKN + Ian Michael Partnership';
pres.author = 'VULKN / BJS Labs';
pres.subject = 'AI-Powered Travel Agent Platform';

// Colors
const DARK = '1a1a2e';
const ACCENT = '4a90a4';
const WHITE = 'FFFFFF';

// ============ SLIDE 1: Title ============
let slide = pres.addSlide();
slide.addText('VULKN + Ian Michael', {
  x: 0.5, y: 2.2, w: 9, h: 1,
  fontSize: 44, bold: true, color: DARK,
  fontFace: 'Arial'
});
slide.addText('AI-Powered Travel Agent Platform', {
  x: 0.5, y: 3.2, w: 9, h: 0.6,
  fontSize: 24, color: ACCENT,
  fontFace: 'Arial'
});
slide.addText('Partnership Proposal — February 2026', {
  x: 0.5, y: 4.8, w: 9, h: 0.4,
  fontSize: 14, color: '666666',
  fontFace: 'Arial'
});

// ============ SLIDE 2: The Opportunity ============
slide = pres.addSlide();
slide.addText('The Opportunity', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});
slide.addText('The Problem', {
  x: 0.5, y: 1.2, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: ACCENT,
  fontFace: 'Arial'
});
slide.addText([
  { text: '• Travel agents need AI but can\'t build it\n', options: { bullet: false } },
  { text: '• Existing solutions are generic\n', options: { bullet: false } },
  { text: '• Great skills exist but need a platform', options: { bullet: false } }
], {
  x: 0.5, y: 1.7, w: 4.2, h: 1.5,
  fontSize: 16, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

slide.addText('Our Solution', {
  x: 5, y: 1.2, w: 4, h: 0.4,
  fontSize: 18, bold: true, color: ACCENT,
  fontFace: 'Arial'
});
slide.addText([
  { text: '• Fully hosted AI platform\n', options: { bullet: false } },
  { text: '• Pre-built travel agent skills\n', options: { bullet: false } },
  { text: '• No technical setup required\n', options: { bullet: false } },
  { text: '• Subscription = recurring revenue', options: { bullet: false } }
], {
  x: 5, y: 1.7, w: 4.2, h: 1.8,
  fontSize: 16, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

slide.addText('Target: Independent travel agents, small agencies, travel advisors', {
  x: 0.5, y: 4.5, w: 9, h: 0.4,
  fontSize: 14, italic: true, color: '666666',
  fontFace: 'Arial'
});

// ============ SLIDE 3: What We Each Bring ============
slide = pres.addSlide();
slide.addText('What We Each Bring', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

// VULKN side
slide.addShape(pres.ShapeType.rect, {
  x: 0.5, y: 1.2, w: 4.2, h: 3.2,
  fill: { color: 'f0f4f8' }
});
slide.addText('VULKN', {
  x: 0.7, y: 1.4, w: 3.8, h: 0.4,
  fontSize: 20, bold: true, color: DARK,
  fontFace: 'Arial'
});
slide.addText([
  { text: '✓ Proven AI platform\n' },
  { text: '✓ Cloud infrastructure\n' },
  { text: '✓ Technical support\n' },
  { text: '✓ Ongoing development\n' },
  { text: '✓ Security & compliance' }
], {
  x: 0.7, y: 1.9, w: 3.8, h: 2.2,
  fontSize: 15, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

// Ian side
slide.addShape(pres.ShapeType.rect, {
  x: 5.3, y: 1.2, w: 4.2, h: 3.2,
  fill: { color: 'e8f4f8' }
});
slide.addText('Ian Michael', {
  x: 5.5, y: 1.4, w: 3.8, h: 0.4,
  fontSize: 20, bold: true, color: DARK,
  fontFace: 'Arial'
});
slide.addText([
  { text: '✓ Travel industry expertise\n' },
  { text: '✓ Skills & workflows built\n' },
  { text: '✓ Sales & BD\n' },
  { text: '✓ Customer relationships\n' },
  { text: '✓ $25K investment' }
], {
  x: 5.5, y: 1.9, w: 3.8, h: 2.2,
  fontSize: 15, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

// ============ SLIDE 4: Business Model ============
slide = pres.addSlide();
slide.addText('Business Model', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

slide.addTable([
  [
    { text: 'Tier', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Price/Month', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Includes', options: { bold: true, fill: { color: DARK }, color: WHITE } }
  ],
  ['Starter', '$99', '1 agent, basic skills'],
  ['Professional', '$249', '3 agents, all skills'],
  ['Agency', '$499', '10 agents, custom skills']
], {
  x: 0.5, y: 1.3, w: 9,
  fontFace: 'Arial', fontSize: 14,
  border: { pt: 0.5, color: 'CCCCCC' },
  colW: [2, 2, 5]
});

slide.addText('Average customer: ~$200/month', {
  x: 0.5, y: 3.0, w: 9, h: 0.4,
  fontSize: 14, italic: true, color: '666666',
  fontFace: 'Arial'
});

slide.addText('How Revenue Flows:', {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 18, bold: true, color: ACCENT,
  fontFace: 'Arial'
});
slide.addText([
  { text: '1. VULKN receives platform costs + 15% margin\n' },
  { text: '2. Company pays all marketing & sales\n' },
  { text: '3. Remaining profit split 70/30' }
], {
  x: 0.5, y: 4.0, w: 9, h: 1.2,
  fontSize: 15, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

// ============ SLIDE 5: Equity Structure ============
slide = pres.addSlide();
slide.addText('Equity Structure', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

slide.addText('Base: 70% VULKN / 30% Ian', {
  x: 0.5, y: 1.2, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: ACCENT,
  fontFace: 'Arial'
});

slide.addText('Earn-Up: Ian can reach 40% by hitting milestones', {
  x: 0.5, y: 1.8, w: 9, h: 0.4,
  fontSize: 16, color: '333333',
  fontFace: 'Arial'
});

slide.addTable([
  [
    { text: 'Milestone', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Bonus Equity', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Deadline', options: { bold: true, fill: { color: DARK }, color: WHITE } }
  ],
  ['$250K ARR', '+3%', 'Month 12'],
  ['$500K ARR', '+4%', 'Month 18'],
  ['$750K ARR', '+3%', 'Month 24']
], {
  x: 0.5, y: 2.4, w: 9,
  fontFace: 'Arial', fontSize: 14,
  border: { pt: 0.5, color: 'CCCCCC' },
  colW: [3, 3, 3]
});

slide.addText('Vesting: 3 years with 12-month cliff', {
  x: 0.5, y: 4.2, w: 9, h: 0.4,
  fontSize: 14, italic: true, color: '666666',
  fontFace: 'Arial'
});

// ============ SLIDE 6: Timeline ============
slide = pres.addSlide();
slide.addText('Timeline: Launch in 1 Month', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

slide.addTable([
  [
    { text: 'Week', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Milestone', options: { bold: true, fill: { color: DARK }, color: WHITE } }
  ],
  ['Week 1', 'Sign agreement, form company'],
  ['Week 2', 'Legal setup, integrate skills'],
  ['Week 3', 'Beta testing with 5 customers'],
  ['Week 4', '🚀 PUBLIC LAUNCH']
], {
  x: 0.5, y: 1.3, w: 9,
  fontFace: 'Arial', fontSize: 16,
  border: { pt: 0.5, color: 'CCCCCC' },
  colW: [2, 7]
});

// ============ SLIDE 7: Summary ============
slide = pres.addSlide();
slide.addText('The Deal', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

slide.addTable([
  [
    { text: 'Term', options: { bold: true, fill: { color: DARK }, color: WHITE } },
    { text: 'Agreement', options: { bold: true, fill: { color: DARK }, color: WHITE } }
  ],
  ['Base Equity', '70% VULKN / 30% Ian'],
  ['Earn-Up', 'Up to 40% at revenue milestones'],
  ['Vesting', '3 years, 12-month cliff'],
  ['Investment', '$25,000 from Ian'],
  ['Platform Fee', 'VULKN gets costs + 15%'],
  ['Profit Split', '70/30 after all costs'],
  ['Launch', '1 month']
], {
  x: 0.5, y: 1.1, w: 9,
  fontFace: 'Arial', fontSize: 15,
  border: { pt: 0.5, color: 'CCCCCC' },
  colW: [3, 6]
});

// ============ SLIDE 8: Next Steps ============
slide = pres.addSlide();
slide.addText('Next Steps', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: DARK,
  fontFace: 'Arial'
});

slide.addText([
  { text: '1. Review this proposal\n\n' },
  { text: '2. Discuss any questions\n\n' },
  { text: '3. Sign Letter of Intent\n\n' },
  { text: '4. Form company & begin integration\n\n' },
  { text: '5. Launch in 30 days 🚀' }
], {
  x: 0.5, y: 1.3, w: 9, h: 3,
  fontSize: 20, color: '333333',
  fontFace: 'Arial', valign: 'top'
});

slide.addText('Contact: bridget4g@gmail.com', {
  x: 0.5, y: 4.5, w: 9, h: 0.4,
  fontSize: 16, color: ACCENT,
  fontFace: 'Arial'
});

// Save
const outputPath = '/Users/sybil/.openclaw/workspace/projects/ian-michael-pitch-deck.pptx';
pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log('✅ Pitch deck generated:', outputPath);
  })
  .catch(err => {
    console.error('Error:', err);
  });
