#!/usr/bin/env node
/**
 * Field Report — Session Analyzer
 * 
 * Parses daily memory logs from a field agent and extracts structured metrics.
 * Designed to read memory/clients/{client}/{user}/YYYY-MM-DD.md files.
 * 
 * Usage:
 *   node analyze-sessions.cjs --date 2026-02-16 --client click-seguros
 *   node analyze-sessions.cjs --days 1  (default: yesterday)
 * 
 * Output: JSON with per-user and aggregate metrics.
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

// ============== ARGS ==============
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { days: 1, client: null, date: null, json: true };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--date': opts.date = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--client': opts.client = args[++i]; break;
      case '--json': opts.json = true; break;
    }
  }
  if (!opts.date) {
    const d = new Date(Date.now() - opts.days * 86400000);
    opts.date = d.toISOString().split('T')[0];
  }
  return opts;
}

// ============== FILE DISCOVERY ==============
function findDailyFiles(clientId, date) {
  const clientDir = path.join(WS, 'memory/clients', clientId);
  if (!fs.existsSync(clientDir)) return [];
  
  const files = [];
  
  // Check per-user dirs
  const entries = fs.readdirSync(clientDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const userFile = path.join(clientDir, entry.name, `${date}.md`);
      if (fs.existsSync(userFile)) {
        files.push({ user: entry.name, path: userFile });
      }
    }
    // Also check flat client-level file
    if (entry.isFile() && entry.name === `${date}.md`) {
      files.push({ user: '_shared', path: path.join(clientDir, entry.name) });
    }
  }
  
  return files;
}

// ============== CONTENT ANALYSIS ==============
// Sentiment keywords
const POSITIVE = /\b(thanks?|thank\s+you|gracias|great|perfect|awesome|amazing|excellent|love\s+it|nice|helpful|buenísimo|genial|increíble)\b/gi;
const NEGATIVE = /\b(wrong|error|bad|broken|doesn't\s+work|no\s+funciona|frustrated|confused|useless|terrible|hate|awful|horrible)\b/gi;
const CONFUSED = /\b(don't\s+understand|no\s+entiendo|what\s+do\s+you\s+mean|how\s+do\s+i|confused|unclear|que\s+significa|I\s+don't\s+get)\b/gi;

// Work vs personal signals
const WORK_SIGNALS = /\b(client|customer|invoice|factura|policy|póliza|claim|siniestro|report|reporte|meeting|junta|deadline|proyecto|contract|contrato|data|datos|analysis|análisis|presentation|presentación|email|correo)\b/gi;
const PERSONAL_SIGNALS = /\b(recipe|receta|movie|película|joke|chiste|weather|clima|personal|game|juego|music|música|birthday|cumpleaños|vacation|vacaciones)\b/gi;

// Upsell signals
const UPSELL = /\b(can\s+you\s+also|puedes\s+también|what\s+else|qué\s+más|do\s+you\s+know\s+how|sabes\s+cómo|is\s+it\s+possible|es\s+posible|I\s+wish|ojalá|would\s+be\s+nice|sería\s+bueno)\b/gi;

// Tool/skill usage
const TOOL_PATTERNS = {
  'pdf': /\b(pdf|document|documento|extract|extraer)\b/gi,
  'search': /\b(search|buscar|find|encontrar|look\s+up)\b/gi,
  'content': /\b(write|escribir|draft|redactar|post|publicar|email|correo)\b/gi,
  'data': /\b(data|datos|spreadsheet|excel|csv|analyze|analizar|chart|gráfica)\b/gi,
  'calendar': /\b(calendar|calendario|schedule|agenda|meeting|junta|appointment|cita)\b/gi,
  'translation': /\b(translat|traducir|english|inglés|spanish|español)\b/gi,
};

function analyzeContent(text, userName) {
  const lines = text.split('\n').filter(l => l.trim());
  const msgCount = lines.length;
  
  // Sentiment
  const posMatches = (text.match(POSITIVE) || []).length;
  const negMatches = (text.match(NEGATIVE) || []).length;
  const confusedMatches = (text.match(CONFUSED) || []).length;
  
  let sentiment = 'neutral';
  if (posMatches > negMatches + confusedMatches) sentiment = 'positive';
  if (negMatches > posMatches) sentiment = 'negative';
  if (confusedMatches > posMatches) sentiment = 'confused';
  
  const satisfactionScore = Math.min(10, Math.max(0, 
    5 + posMatches * 1.5 - negMatches * 2 - confusedMatches * 1
  ));
  
  // Work vs personal
  const workMatches = (text.match(WORK_SIGNALS) || []).length;
  const personalMatches = (text.match(PERSONAL_SIGNALS) || []).length;
  const workRatio = workMatches / Math.max(1, workMatches + personalMatches);
  const classification = workRatio > 0.6 ? 'work' : workRatio < 0.3 ? 'personal' : 'mixed';
  
  // Upsell signals
  const upsellMatches = text.match(UPSELL) || [];
  
  // Tools used
  const toolsUsed = {};
  for (const [tool, pattern] of Object.entries(TOOL_PATTERNS)) {
    const count = (text.match(pattern) || []).length;
    if (count > 0) toolsUsed[tool] = count;
  }
  
  // Language detection (simple)
  const spanishWords = (text.match(/\b(el|la|los|las|de|en|que|por|para|con|una|este|esta|como|pero|más|también|puede|tiene|hacer|está|son|muy|todo|hay|ser|esto|fue|han|era|hola|gracias|bueno)\b/gi) || []).length;
  const englishWords = (text.match(/\b(the|is|are|was|were|have|has|been|will|would|could|should|this|that|with|from|they|their|what|when|where|which|how|who|can|but|not|you|your|for|all|about)\b/gi) || []).length;
  const language = spanishWords > englishWords * 1.5 ? 'spanish' : englishWords > spanishWords * 1.5 ? 'english' : 'bilingual';
  
  // Session depth (rough estimate from sections/headers)
  const sections = text.split(/^#{1,3}\s/m).length - 1;
  const sessionDepth = Math.max(1, sections);
  
  // Complexity estimate
  const wordCount = text.split(/\s+/).length;
  let complexity = 'simple';
  if (wordCount > 500 || sections > 3) complexity = 'complex';
  else if (wordCount > 200 || sections > 1) complexity = 'medium';
  
  // Timestamps (look for time patterns)
  const times = text.match(/\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?\b/g) || [];
  const afterHours = times.filter(t => {
    const hour = parseInt(t);
    return hour >= 22 || hour <= 6;
  }).length;
  
  return {
    user: userName,
    messageEstimate: msgCount,
    wordCount,
    sentiment,
    satisfactionScore: Math.round(satisfactionScore * 10) / 10,
    workClassification: classification,
    workRatio: Math.round(workRatio * 100),
    toolsUsed,
    upsellSignals: upsellMatches.map(m => m.trim()),
    language,
    complexity,
    sessionDepth,
    afterHoursSignals: afterHours,
    confusionPoints: confusedMatches,
  };
}

// ============== AGGREGATE ==============
function aggregate(userMetrics) {
  if (userMetrics.length === 0) return null;
  
  const total = {
    uniqueUsers: userMetrics.length,
    totalMessages: userMetrics.reduce((s, u) => s + u.messageEstimate, 0),
    totalWords: userMetrics.reduce((s, u) => s + u.wordCount, 0),
    avgSatisfaction: Math.round(userMetrics.reduce((s, u) => s + u.satisfactionScore, 0) / userMetrics.length * 10) / 10,
    avgSessionDepth: Math.round(userMetrics.reduce((s, u) => s + u.sessionDepth, 0) / userMetrics.length * 10) / 10,
    workSplit: {
      work: userMetrics.filter(u => u.workClassification === 'work').length,
      personal: userMetrics.filter(u => u.workClassification === 'personal').length,
      mixed: userMetrics.filter(u => u.workClassification === 'mixed').length,
    },
    sentimentBreakdown: {
      positive: userMetrics.filter(u => u.sentiment === 'positive').length,
      neutral: userMetrics.filter(u => u.sentiment === 'neutral').length,
      negative: userMetrics.filter(u => u.sentiment === 'negative').length,
      confused: userMetrics.filter(u => u.sentiment === 'confused').length,
    },
    languageBreakdown: {
      spanish: userMetrics.filter(u => u.language === 'spanish').length,
      english: userMetrics.filter(u => u.language === 'english').length,
      bilingual: userMetrics.filter(u => u.language === 'bilingual').length,
    },
    allToolsUsed: {},
    allUpsellSignals: [],
    complexityBreakdown: {
      simple: userMetrics.filter(u => u.complexity === 'simple').length,
      medium: userMetrics.filter(u => u.complexity === 'medium').length,
      complex: userMetrics.filter(u => u.complexity === 'complex').length,
    },
    afterHoursTotal: userMetrics.reduce((s, u) => s + u.afterHoursSignals, 0),
    confusionTotal: userMetrics.reduce((s, u) => s + u.confusionPoints, 0),
  };
  
  // Merge tools
  for (const u of userMetrics) {
    for (const [tool, count] of Object.entries(u.toolsUsed)) {
      total.allToolsUsed[tool] = (total.allToolsUsed[tool] || 0) + count;
    }
    total.allUpsellSignals.push(...u.upsellSignals);
  }
  
  return total;
}

// ============== MAIN ==============
function main() {
  const opts = parseArgs();
  
  // Discover clients if not specified
  const clientsDir = path.join(WS, 'memory/clients');
  let clients = [];
  
  if (opts.client) {
    clients = [opts.client];
  } else if (fs.existsSync(clientsDir)) {
    clients = fs.readdirSync(clientsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }
  
  if (clients.length === 0) {
    console.log(JSON.stringify({ error: 'No clients found', date: opts.date }));
    process.exit(0);
  }
  
  const report = { date: opts.date, clients: {} };
  
  for (const clientId of clients) {
    const files = findDailyFiles(clientId, opts.date);
    
    if (files.length === 0) {
      report.clients[clientId] = { noData: true, date: opts.date };
      continue;
    }
    
    const userMetrics = [];
    for (const file of files) {
      const content = fs.readFileSync(file.path, 'utf-8');
      const metrics = analyzeContent(content, file.user);
      userMetrics.push(metrics);
    }
    
    report.clients[clientId] = {
      date: opts.date,
      users: userMetrics,
      aggregate: aggregate(userMetrics),
    };
  }
  
  console.log(JSON.stringify(report, null, 2));
}

module.exports = { analyzeContent, aggregate, findDailyFiles };

if (require.main === module) main();
