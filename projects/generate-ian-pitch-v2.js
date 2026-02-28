const pptxgen = require('pptxgenjs');

const pres = new pptxgen();

pres.title = 'VULKN + Ian Michael Partnership';
pres.author = 'VULKN / BJS Labs';

// Brand Colors
const NAVY = '1a1a2e';
const TEAL = '16a596';
const CORAL = 'e07a5f';
const GOLD = 'f2cc8f';
const CREAM = 'f8f4e8';
const WHITE = 'FFFFFF';
const LIGHT_TEAL = 'e8f6f5';

// ============ SLIDE 1: Title (Full bleed dark) ============
let slide = pres.addSlide();
slide.background = { color: NAVY };

slide.addText('VULKN', {
  x: 0.5, y: 1.5, w: 9, h: 0.8,
  fontSize: 28, color: TEAL, fontFace: 'Arial', bold: true,
  align: 'center'
});

slide.addText('+', {
  x: 0.5, y: 2.2, w: 9, h: 0.6,
  fontSize: 36, color: CORAL, fontFace: 'Arial',
  align: 'center'
});

slide.addText('Ian Michael', {
  x: 0.5, y: 2.7, w: 9, h: 0.8,
  fontSize: 28, color: GOLD, fontFace: 'Arial', bold: true,
  align: 'center'
});

slide.addShape(pres.ShapeType.rect, {
  x: 2.5, y: 3.6, w: 5, h: 0.05, fill: { color: TEAL }
});

slide.addText('The Future of Travel, Powered by AI', {
  x: 0.5, y: 3.9, w: 9, h: 0.6,
  fontSize: 24, color: WHITE, fontFace: 'Arial', italic: true,
  align: 'center'
});

slide.addText('Partnership Proposal  •  February 2026', {
  x: 0.5, y: 4.8, w: 9, h: 0.4,
  fontSize: 12, color: '888888', fontFace: 'Arial',
  align: 'center'
});

// ============ SLIDE 2: The Big Idea ============
slide = pres.addSlide();
slide.background = { color: CREAM };

slide.addText('💡', {
  x: 4.2, y: 0.6, w: 1.5, h: 1,
  fontSize: 48, align: 'center'
});

slide.addText('The Big Idea', {
  x: 0.5, y: 1.5, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: NAVY, fontFace: 'Arial',
  align: 'center'
});

slide.addShape(pres.ShapeType.rect, {
  x: 1, y: 2.3, w: 8, h: 2.2, fill: { color: WHITE },
  shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, opacity: 0.2 }
});

slide.addText('What if every travel agent had their own AI assistant —\none that actually understands the travel industry?', {
  x: 1.2, y: 2.5, w: 7.6, h: 1.8,
  fontSize: 22, color: NAVY, fontFace: 'Arial',
  align: 'center', valign: 'middle', italic: true
});

slide.addText('We make it happen. Together.', {
  x: 0.5, y: 4.7, w: 9, h: 0.5,
  fontSize: 18, color: TEAL, fontFace: 'Arial', bold: true,
  align: 'center'
});

// ============ SLIDE 3: The Problem ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 10, h: 1.2, fill: { color: CORAL }
});

slide.addText('😤  The Problem', {
  x: 0.5, y: 0.35, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: WHITE, fontFace: 'Arial'
});

const problems = [
  { icon: '🤯', text: 'Travel agents are overwhelmed with repetitive tasks' },
  { icon: '🤖', text: 'AI solutions exist, but they\'re generic and clunky' },
  { icon: '💻', text: 'Building custom AI requires technical skills agents don\'t have' },
  { icon: '💸', text: 'Enterprise solutions cost a fortune' }
];

problems.forEach((p, i) => {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.5 + (i * 0.85), w: 8.4, h: 0.75,
    fill: { color: i % 2 === 0 ? 'fff5f3' : WHITE }
  });
  slide.addText(`${p.icon}  ${p.text}`, {
    x: 1, y: 1.55 + (i * 0.85), w: 8, h: 0.65,
    fontSize: 18, color: NAVY, fontFace: 'Arial', valign: 'middle'
  });
});

// ============ SLIDE 4: The Solution ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 10, h: 1.2, fill: { color: TEAL }
});

slide.addText('✨  The Solution', {
  x: 0.5, y: 0.35, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: WHITE, fontFace: 'Arial'
});

slide.addText('A fully-hosted AI platform built specifically for travel professionals', {
  x: 0.5, y: 1.4, w: 9, h: 0.5,
  fontSize: 18, color: NAVY, fontFace: 'Arial', italic: true, align: 'center'
});

const solutions = [
  { icon: '🚀', title: 'Turnkey Setup', desc: 'No coding, no servers, no headaches' },
  { icon: '✈️', title: 'Travel-Native', desc: 'Built by travel experts, for travel experts' },
  { icon: '💬', title: 'Always On', desc: '24/7 AI assistance for clients' },
  { icon: '📈', title: 'Scalable', desc: 'Grows with your business' }
];

solutions.forEach((s, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5 + (col * 4.5), y: 2.1 + (row * 1.4), w: 4.2, h: 1.2,
    fill: { color: LIGHT_TEAL },
    shadow: { type: 'outer', blur: 4, offset: 1, angle: 45, opacity: 0.15 }
  });
  slide.addText(s.icon, {
    x: 0.7 + (col * 4.5), y: 2.2 + (row * 1.4), w: 0.8, h: 0.8,
    fontSize: 28
  });
  slide.addText(s.title, {
    x: 1.5 + (col * 4.5), y: 2.25 + (row * 1.4), w: 3, h: 0.4,
    fontSize: 16, bold: true, color: NAVY, fontFace: 'Arial'
  });
  slide.addText(s.desc, {
    x: 1.5 + (col * 4.5), y: 2.65 + (row * 1.4), w: 3, h: 0.4,
    fontSize: 13, color: '555555', fontFace: 'Arial'
  });
});

// ============ SLIDE 5: Why Us? ============
slide = pres.addSlide();
slide.background = { color: NAVY };

slide.addText('Why This Team Wins', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 32, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});

// VULKN side
slide.addShape(pres.ShapeType.rect, {
  x: 0.5, y: 1.2, w: 4.2, h: 3.5, fill: { color: '2a2a4e' }
});
slide.addText('VULKN', {
  x: 0.5, y: 1.4, w: 4.2, h: 0.5,
  fontSize: 24, bold: true, color: TEAL, fontFace: 'Arial', align: 'center'
});
slide.addText('The Engine', {
  x: 0.5, y: 1.9, w: 4.2, h: 0.4,
  fontSize: 14, color: GOLD, fontFace: 'Arial', align: 'center', italic: true
});
slide.addText([
  '✓ Proven AI platform\n\n',
  '✓ Cloud infrastructure\n\n',
  '✓ 24/7 operations\n\n',
  '✓ Continuous development\n\n',
  '✓ Security & compliance'
].join(''), {
  x: 0.8, y: 2.4, w: 3.6, h: 2.2,
  fontSize: 14, color: WHITE, fontFace: 'Arial', valign: 'top'
});

// Ian side
slide.addShape(pres.ShapeType.rect, {
  x: 5.3, y: 1.2, w: 4.2, h: 3.5, fill: { color: '2a2a4e' }
});
slide.addText('Ian Michael', {
  x: 5.3, y: 1.4, w: 4.2, h: 0.5,
  fontSize: 24, bold: true, color: CORAL, fontFace: 'Arial', align: 'center'
});
slide.addText('The Expertise', {
  x: 5.3, y: 1.9, w: 4.2, h: 0.4,
  fontSize: 14, color: GOLD, fontFace: 'Arial', align: 'center', italic: true
});
slide.addText([
  '✓ Deep travel industry knowledge\n\n',
  '✓ Pre-built travel skills\n\n',
  '✓ Sales & relationships\n\n',
  '✓ Customer success\n\n',
  '✓ $25K investment'
].join(''), {
  x: 5.6, y: 2.4, w: 3.6, h: 2.2,
  fontSize: 14, color: WHITE, fontFace: 'Arial', valign: 'top'
});

// ============ SLIDE 6: How It Works ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addText('🔄  How It Works', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
});

const steps = [
  { num: '1', title: 'Travel agent signs up', color: TEAL },
  { num: '2', title: 'We deploy their AI assistant', color: CORAL },
  { num: '3', title: 'Agent customizes for their style', color: GOLD },
  { num: '4', title: 'AI handles clients 24/7', color: TEAL }
];

steps.forEach((s, i) => {
  slide.addShape(pres.ShapeType.ellipse, {
    x: 0.8 + (i * 2.3), y: 1.4, w: 0.7, h: 0.7, fill: { color: s.color }
  });
  slide.addText(s.num, {
    x: 0.8 + (i * 2.3), y: 1.45, w: 0.7, h: 0.6,
    fontSize: 24, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
  });
  slide.addText(s.title, {
    x: 0.3 + (i * 2.3), y: 2.2, w: 1.8, h: 0.8,
    fontSize: 12, color: NAVY, fontFace: 'Arial', align: 'center'
  });
  if (i < 3) {
    slide.addText('→', {
      x: 1.6 + (i * 2.3), y: 1.5, w: 0.5, h: 0.5,
      fontSize: 20, color: '999999', fontFace: 'Arial'
    });
  }
});

slide.addShape(pres.ShapeType.rect, {
  x: 0.5, y: 3.2, w: 9, h: 1.8, fill: { color: LIGHT_TEAL }
});
slide.addText('🎯 Result:', {
  x: 0.7, y: 3.4, w: 8.6, h: 0.4,
  fontSize: 16, bold: true, color: NAVY, fontFace: 'Arial'
});
slide.addText('Travel agents save hours every day.\nClients get instant, expert responses.\nEveryone wins.', {
  x: 0.7, y: 3.85, w: 8.6, h: 1,
  fontSize: 15, color: NAVY, fontFace: 'Arial'
});

// ============ SLIDE 7: Pricing ============
slide = pres.addSlide();
slide.background = { color: CREAM };

slide.addText('💎  Simple, Profitable Pricing', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
});

// Starter
slide.addShape(pres.ShapeType.rect, {
  x: 0.4, y: 1.2, w: 2.9, h: 3.3, fill: { color: WHITE },
  shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, opacity: 0.15 }
});
slide.addText('Starter', {
  x: 0.4, y: 1.4, w: 2.9, h: 0.4,
  fontSize: 18, bold: true, color: NAVY, fontFace: 'Arial', align: 'center'
});
slide.addText('$250', {
  x: 0.4, y: 1.9, w: 2.9, h: 0.6,
  fontSize: 36, bold: true, color: TEAL, fontFace: 'Arial', align: 'center'
});
slide.addText('/month', {
  x: 0.4, y: 2.45, w: 2.9, h: 0.3,
  fontSize: 12, color: '888888', fontFace: 'Arial', align: 'center'
});
slide.addText('• 1 AI Agent\n• Core travel skills\n• Email support', {
  x: 0.6, y: 2.9, w: 2.5, h: 1.4,
  fontSize: 12, color: '555555', fontFace: 'Arial'
});

// Professional
slide.addShape(pres.ShapeType.rect, {
  x: 3.55, y: 1.0, w: 2.9, h: 3.7, fill: { color: TEAL },
  shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, opacity: 0.2 }
});
slide.addText('⭐ POPULAR', {
  x: 3.55, y: 1.1, w: 2.9, h: 0.3,
  fontSize: 10, bold: true, color: GOLD, fontFace: 'Arial', align: 'center'
});
slide.addText('Professional', {
  x: 3.55, y: 1.45, w: 2.9, h: 0.4,
  fontSize: 18, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});
slide.addText('$500', {
  x: 3.55, y: 2.0, w: 2.9, h: 0.6,
  fontSize: 36, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});
slide.addText('/month', {
  x: 3.55, y: 2.55, w: 2.9, h: 0.3,
  fontSize: 12, color: 'cceeee', fontFace: 'Arial', align: 'center'
});
slide.addText('• 2 AI Agents\n• All travel skills\n• Priority support\n• Custom branding', {
  x: 3.75, y: 3.0, w: 2.5, h: 1.5,
  fontSize: 12, color: WHITE, fontFace: 'Arial'
});

// Agency
slide.addShape(pres.ShapeType.rect, {
  x: 6.7, y: 1.2, w: 2.9, h: 3.3, fill: { color: WHITE },
  shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, opacity: 0.15 }
});
slide.addText('Agency', {
  x: 6.7, y: 1.4, w: 2.9, h: 0.4,
  fontSize: 18, bold: true, color: NAVY, fontFace: 'Arial', align: 'center'
});
slide.addText('$1,000', {
  x: 6.7, y: 1.9, w: 2.9, h: 0.6,
  fontSize: 36, bold: true, color: CORAL, fontFace: 'Arial', align: 'center'
});
slide.addText('/month', {
  x: 6.7, y: 2.45, w: 2.9, h: 0.3,
  fontSize: 12, color: '888888', fontFace: 'Arial', align: 'center'
});
slide.addText('• 3 AI Agents\n• All skills + custom\n• Agent Network™\n• Dedicated support', {
  x: 6.9, y: 2.9, w: 2.5, h: 1.4,
  fontSize: 12, color: '555555', fontFace: 'Arial'
});

slide.addText('Agent Network™ = Your AI assistants can communicate and collaborate with each other', {
  x: 0.5, y: 4.7, w: 9, h: 0.3,
  fontSize: 11, italic: true, color: '777777', fontFace: 'Arial', align: 'center'
});

// ============ SLIDE 8: The Numbers ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addText('📊  Let\'s Talk Numbers', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
});

slide.addShape(pres.ShapeType.rect, {
  x: 0.5, y: 1.2, w: 4.2, h: 2, fill: { color: LIGHT_TEAL }
});
slide.addText('Average Customer', {
  x: 0.5, y: 1.35, w: 4.2, h: 0.35,
  fontSize: 14, bold: true, color: NAVY, fontFace: 'Arial', align: 'center'
});
slide.addText('~$500/mo', {
  x: 0.5, y: 1.8, w: 4.2, h: 0.6,
  fontSize: 32, bold: true, color: TEAL, fontFace: 'Arial', align: 'center'
});
slide.addText('Most will choose Professional', {
  x: 0.5, y: 2.5, w: 4.2, h: 0.4,
  fontSize: 12, italic: true, color: '666666', fontFace: 'Arial', align: 'center'
});

slide.addShape(pres.ShapeType.rect, {
  x: 5.3, y: 1.2, w: 4.2, h: 2, fill: { color: 'fff5f3' }
});
slide.addText('Target Year 1', {
  x: 5.3, y: 1.35, w: 4.2, h: 0.35,
  fontSize: 14, bold: true, color: NAVY, fontFace: 'Arial', align: 'center'
});
slide.addText('$250K ARR', {
  x: 5.3, y: 1.8, w: 4.2, h: 0.6,
  fontSize: 32, bold: true, color: CORAL, fontFace: 'Arial', align: 'center'
});
slide.addText('~42 customers', {
  x: 5.3, y: 2.5, w: 4.2, h: 0.4,
  fontSize: 12, italic: true, color: '666666', fontFace: 'Arial', align: 'center'
});

slide.addText('Revenue Flow:', {
  x: 0.5, y: 3.5, w: 9, h: 0.4,
  fontSize: 16, bold: true, color: NAVY, fontFace: 'Arial'
});
slide.addText('1️⃣  VULKN covers platform costs + 15% margin\n2️⃣  Company pays all marketing & sales\n3️⃣  Remaining profit splits 70/30', {
  x: 0.5, y: 4.0, w: 9, h: 1.2,
  fontSize: 14, color: '444444', fontFace: 'Arial'
});

// ============ SLIDE 9: Equity Structure ============
slide = pres.addSlide();
slide.background = { color: NAVY };

slide.addText('🤝  The Partnership', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: WHITE, fontFace: 'Arial'
});

slide.addText('Base Equity', {
  x: 0.5, y: 1.1, w: 4.5, h: 0.4,
  fontSize: 18, bold: true, color: TEAL, fontFace: 'Arial', align: 'center'
});

// Pie chart visual (simplified)
slide.addShape(pres.ShapeType.ellipse, {
  x: 1.5, y: 1.6, w: 2.5, h: 2.5, fill: { color: TEAL }
});
slide.addShape(pres.ShapeType.pie, {
  x: 1.5, y: 1.6, w: 2.5, h: 2.5, fill: { color: CORAL },
  shapeOptions: { startAngle: 0, endAngle: 108 }
});
slide.addText('70%\nVULKN', {
  x: 0.5, y: 2.3, w: 1.2, h: 0.8,
  fontSize: 11, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});
slide.addText('30%\nIan', {
  x: 3.8, y: 1.8, w: 1, h: 0.8,
  fontSize: 11, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});

slide.addText('Earn-Up Potential', {
  x: 5, y: 1.1, w: 4.5, h: 0.4,
  fontSize: 18, bold: true, color: GOLD, fontFace: 'Arial', align: 'center'
});
slide.addText('Ian can earn up to 40%', {
  x: 5, y: 1.5, w: 4.5, h: 0.3,
  fontSize: 12, color: 'aaaaaa', fontFace: 'Arial', align: 'center'
});

slide.addShape(pres.ShapeType.rect, {
  x: 5.2, y: 1.9, w: 4.2, h: 2.2, fill: { color: '2a2a4e' }
});
slide.addText('$250K ARR → +3%\n\n$500K ARR → +4%\n\n$750K ARR → +3%', {
  x: 5.4, y: 2.1, w: 3.8, h: 1.8,
  fontSize: 15, color: WHITE, fontFace: 'Arial'
});

slide.addText('Vesting: 3 years with 12-month cliff  •  Investment: $25,000', {
  x: 0.5, y: 4.5, w: 9, h: 0.4,
  fontSize: 12, color: '888888', fontFace: 'Arial', align: 'center'
});

// ============ SLIDE 10: Timeline ============
slide = pres.addSlide();
slide.background = { color: CREAM };

slide.addText('🚀  Ready to Launch in 30 Days', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
});

const timeline = [
  { week: 'Week 1', task: 'Sign & Form Company', icon: '📝', color: TEAL },
  { week: 'Week 2', task: 'Legal + Integration', icon: '⚙️', color: CORAL },
  { week: 'Week 3', task: 'Beta with 5 Customers', icon: '🧪', color: GOLD },
  { week: 'Week 4', task: 'PUBLIC LAUNCH! 🎉', icon: '🚀', color: TEAL }
];

timeline.forEach((t, i) => {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 1.2 + (i * 0.95), w: 9, h: 0.85,
    fill: { color: i === 3 ? LIGHT_TEAL : WHITE },
    line: { color: t.color, pt: 2 }
  });
  slide.addText(t.icon, {
    x: 0.7, y: 1.3 + (i * 0.95), w: 0.7, h: 0.65,
    fontSize: 24, align: 'center'
  });
  slide.addText(t.week, {
    x: 1.5, y: 1.35 + (i * 0.95), w: 1.8, h: 0.55,
    fontSize: 14, bold: true, color: NAVY, fontFace: 'Arial', valign: 'middle'
  });
  slide.addText(t.task, {
    x: 3.5, y: 1.35 + (i * 0.95), w: 5.5, h: 0.55,
    fontSize: 16, color: i === 3 ? TEAL : '444444', fontFace: 'Arial', valign: 'middle',
    bold: i === 3
  });
});

// ============ SLIDE 11: Why Now ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 10, h: 5.63, fill: { color: NAVY }
});

slide.addText('⏰', {
  x: 4.2, y: 1, w: 1.5, h: 1,
  fontSize: 56, align: 'center'
});

slide.addText('Why Now?', {
  x: 0.5, y: 2, w: 9, h: 0.6,
  fontSize: 36, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});

slide.addText('AI is transforming every industry.\nTravel agents who don\'t adapt will be left behind.\n\nWe\'re not just selling software —\nwe\'re helping travel professionals thrive.', {
  x: 0.5, y: 2.8, w: 9, h: 1.6,
  fontSize: 18, color: CREAM, fontFace: 'Arial', align: 'center', italic: true
});

slide.addText('The question isn\'t "if" — it\'s "how fast can we move?"', {
  x: 0.5, y: 4.6, w: 9, h: 0.5,
  fontSize: 16, bold: true, color: TEAL, fontFace: 'Arial', align: 'center'
});

// ============ SLIDE 12: The Deal Summary ============
slide = pres.addSlide();
slide.background = { color: WHITE };

slide.addText('📋  The Deal', {
  x: 0.5, y: 0.4, w: 9, h: 0.6,
  fontSize: 28, bold: true, color: NAVY, fontFace: 'Arial'
});

const dealTerms = [
  ['Equity', '70% VULKN / 30% Ian (earn up to 40%)'],
  ['Vesting', '3 years, 12-month cliff'],
  ['Investment', '$25,000 from Ian'],
  ['Platform Fee', 'VULKN gets costs + 15%'],
  ['Profit Split', '70/30 after all costs'],
  ['Pricing', '$250 / $500 / $1,000 per month'],
  ['Launch', '30 days from signing']
];

dealTerms.forEach((term, i) => {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 1.15 + (i * 0.55), w: 9, h: 0.5,
    fill: { color: i % 2 === 0 ? LIGHT_TEAL : WHITE }
  });
  slide.addText(term[0], {
    x: 0.7, y: 1.2 + (i * 0.55), w: 2.5, h: 0.4,
    fontSize: 13, bold: true, color: NAVY, fontFace: 'Arial', valign: 'middle'
  });
  slide.addText(term[1], {
    x: 3.2, y: 1.2 + (i * 0.55), w: 6, h: 0.4,
    fontSize: 13, color: '444444', fontFace: 'Arial', valign: 'middle'
  });
});

// ============ SLIDE 13: Next Steps ============
slide = pres.addSlide();
slide.background = { color: TEAL };

slide.addText('Let\'s Do This! 🚀', {
  x: 0.5, y: 0.8, w: 9, h: 0.7,
  fontSize: 36, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});

slide.addShape(pres.ShapeType.rect, {
  x: 1.5, y: 1.7, w: 7, h: 2.6, fill: { color: WHITE },
  shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, opacity: 0.2 }
});

slide.addText('Next Steps:', {
  x: 1.7, y: 1.9, w: 6.6, h: 0.4,
  fontSize: 18, bold: true, color: NAVY, fontFace: 'Arial'
});

slide.addText('1.  Let\'s talk through any questions\n\n2.  Sign the Letter of Intent\n\n3.  We launch in 30 days', {
  x: 1.9, y: 2.4, w: 6.2, h: 1.6,
  fontSize: 16, color: '444444', fontFace: 'Arial'
});

slide.addText('Contact: bridget4g@gmail.com', {
  x: 0.5, y: 4.6, w: 9, h: 0.4,
  fontSize: 16, bold: true, color: WHITE, fontFace: 'Arial', align: 'center'
});

// Save
const outputPath = '/Users/sybil/.openclaw/workspace/projects/ian-michael-pitch-deck-v2.pptx';
pres.writeFile({ fileName: outputPath })
  .then(() => console.log('✅ Pitch deck v2 generated:', outputPath))
  .catch(err => console.error('Error:', err));
