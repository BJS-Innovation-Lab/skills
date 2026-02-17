#!/usr/bin/env node
/**
 * Field Report — Remote Analysis (runs on HQ/Sybil)
 * 
 * Pulls a field agent's daily documents from Supabase and generates
 * the nightly report WITHOUT needing access to the agent's filesystem.
 * 
 * The field agent just writes daily notes normally. This script does the rest.
 * 
 * Usage:
 *   node remote-analyze.cjs --agent sam --date 2026-02-16 [--send-hq]
 *   node remote-analyze.cjs --agent sam --days 1 --send-hq
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

// Load .env
const envFile = path.join(WS, 'rag/.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const AGENT_MAP = {
  sam:    '62bb0f39-2248-4b14-806d-1c498c654ee7',
  saber:  '415a84a4-af9e-4c98-9d48-040834436e44',
  santos: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb',
  sybil:  '5fae1839-ab85-412c-acc0-033cbbbbd15b',
};

// ============== ARGS ==============
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { agent: 'sam', date: null, days: 1, sendHQ: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--agent': opts.agent = args[++i].toLowerCase(); break;
      case '--date': opts.date = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--send-hq': opts.sendHQ = true; break;
    }
  }
  if (!opts.date) {
    const d = new Date(Date.now() - opts.days * 86400000);
    opts.date = d.toISOString().split('T')[0];
  }
  return opts;
}

// ============== SUPABASE FETCH ==============
async function fetchAgentDocs(agentId, date) {
  // Fetch all documents synced for this agent that match the date
  // Uses the REST API to query the documents table directly
  const dateFilter = encodeURIComponent(`%${date}%`);
  
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?agent_id=eq.${agentId}&file_path=like.${dateFilter}&select=file_path,title,content,metadata,created_at`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    }
  );
  
  if (!resp.ok) {
    console.error(`Supabase error: ${resp.status} ${await resp.text()}`);
    return [];
  }
  
  return resp.json();
}

async function fetchClientDocs(agentId) {
  // Fetch all docs with client_id metadata
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?agent_id=eq.${agentId}&select=file_path,title,content,metadata,created_at&order=created_at.desc&limit=500`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    }
  );
  
  if (!resp.ok) return [];
  
  const docs = await resp.json();
  return docs.filter(d => d.metadata?.client_id);
}

// ============== ANALYSIS ==============
// Reuse patterns from analyze-sessions.cjs
const POSITIVE = /\b(thanks?|thank\s+you|gracias|great|perfect|awesome|amazing|excellent|love\s+it|nice|helpful|buenísimo|genial|increíble)\b/gi;
const NEGATIVE = /\b(wrong|error|bad|broken|doesn't\s+work|no\s+funciona|frustrated|confused|useless|terrible)\b/gi;
const CONFUSED = /\b(don't\s+understand|no\s+entiendo|what\s+do\s+you\s+mean|confused|unclear)\b/gi;
const WORK_SIGNALS = /\b(client|customer|invoice|factura|policy|póliza|claim|siniestro|report|reporte|meeting|deadline|proyecto|contract|data|analysis|email)\b/gi;
const PERSONAL_SIGNALS = /\b(recipe|receta|movie|película|joke|chiste|weather|clima|personal|game|music|birthday|vacation)\b/gi;
const UPSELL = /\b(can\s+you\s+also|puedes\s+también|what\s+else|qué\s+más|is\s+it\s+possible|I\s+wish|would\s+be\s+nice)\b/gi;

const TOOL_PATTERNS = {
  'pdf': /\b(pdf|document|documento|extract|extraer)\b/gi,
  'search': /\b(search|buscar|find|encontrar|look\s+up)\b/gi,
  'content': /\b(write|escribir|draft|redactar|post|publicar)\b/gi,
  'data': /\b(data|datos|spreadsheet|excel|csv|analyze|analizar)\b/gi,
  'calendar': /\b(calendar|calendario|schedule|agenda|meeting|cita)\b/gi,
  'translation': /\b(translat|traducir|english|inglés|spanish|español)\b/gi,
};

function analyzeDoc(content, filePath) {
  // Extract user from path: clients/{client}/{user}/date.md
  const pathMatch = filePath.match(/clients\/([^/]+)\/([^/]+)\//);
  const clientId = pathMatch ? pathMatch[1] : 'unknown';
  let userName = pathMatch ? pathMatch[2] : 'unknown';
  
  // If userName looks like a date, it's a flat client file
  if (/^\d{4}-\d{2}/.test(userName)) userName = '_shared';
  
  const words = content.split(/\s+/).length;
  const lines = content.split('\n').filter(l => l.trim()).length;
  
  const posMatches = (content.match(POSITIVE) || []).length;
  const negMatches = (content.match(NEGATIVE) || []).length;
  const confusedMatches = (content.match(CONFUSED) || []).length;
  
  let sentiment = 'neutral';
  if (posMatches > negMatches + confusedMatches) sentiment = 'positive';
  if (negMatches > posMatches) sentiment = 'negative';
  if (confusedMatches > posMatches) sentiment = 'confused';
  
  const satisfaction = Math.min(10, Math.max(0, 5 + posMatches * 1.5 - negMatches * 2 - confusedMatches));
  
  const workMatches = (content.match(WORK_SIGNALS) || []).length;
  const personalMatches = (content.match(PERSONAL_SIGNALS) || []).length;
  const workRatio = workMatches / Math.max(1, workMatches + personalMatches);
  
  const toolsUsed = {};
  for (const [tool, pattern] of Object.entries(TOOL_PATTERNS)) {
    const count = (content.match(pattern) || []).length;
    if (count > 0) toolsUsed[tool] = count;
  }
  
  const spanishWords = (content.match(/\b(el|la|los|de|en|que|por|para|con|una|como|pero|más|también|puede|tiene|hacer|está|gracias|bueno)\b/gi) || []).length;
  const englishWords = (content.match(/\b(the|is|are|was|have|has|will|would|this|that|with|from|they|what|when|how|can|but|not|you|your|for)\b/gi) || []).length;
  const language = spanishWords > englishWords * 1.5 ? 'spanish' : englishWords > spanishWords * 1.5 ? 'english' : 'bilingual';
  
  let complexity = 'simple';
  if (words > 500) complexity = 'complex';
  else if (words > 200) complexity = 'medium';
  
  return {
    clientId,
    user: userName,
    words,
    lines,
    sentiment,
    satisfaction: Math.round(satisfaction * 10) / 10,
    workClassification: workRatio > 0.6 ? 'work' : workRatio < 0.3 ? 'personal' : 'mixed',
    toolsUsed,
    upsellSignals: (content.match(UPSELL) || []).map(m => m.trim()),
    language,
    complexity,
    confusionPoints: confusedMatches,
  };
}

// ============== HEALTH SCORE ==============
function computeHealth(metrics) {
  const freq = Math.min(10, (metrics.activeDays || 1) / Math.max(1, metrics.totalDays) * 12);
  const sat = Math.min(10, Math.max(0, metrics.avgSatisfaction || 5));
  const depth = Math.min(10, (metrics.avgLines || 10) / 20 * 10);
  const breadth = Math.min(10, (metrics.uniqueTools || 1) * 2);
  const recency = metrics.daysSinceActive <= 0 ? 10 : Math.max(0, 10 - metrics.daysSinceActive * 1.5);
  
  const composite = freq * 0.30 + sat * 0.25 + depth * 0.20 + breadth * 0.15 + recency * 0.10;
  return Math.round(composite * 10) / 10;
}

// ============== REPORT BUILDER ==============
function buildReport(agentName, date, docAnalyses) {
  // Group by client
  const byClient = {};
  for (const a of docAnalyses) {
    if (!byClient[a.clientId]) byClient[a.clientId] = [];
    byClient[a.clientId].push(a);
  }
  
  let fullReport = '';
  
  for (const [clientId, analyses] of Object.entries(byClient)) {
    // Group by user within client
    const byUser = {};
    for (const a of analyses) {
      if (!byUser[a.user]) byUser[a.user] = [];
      byUser[a.user].push(a);
    }
    
    const users = Object.keys(byUser).filter(u => u !== '_shared');
    const totalWords = analyses.reduce((s, a) => s + a.words, 0);
    const totalLines = analyses.reduce((s, a) => s + a.lines, 0);
    const avgSat = analyses.reduce((s, a) => s + a.satisfaction, 0) / analyses.length;
    
    // Tools across all users
    const allTools = {};
    const allUpsell = [];
    for (const a of analyses) {
      for (const [t, c] of Object.entries(a.toolsUsed)) allTools[t] = (allTools[t] || 0) + c;
      allUpsell.push(...a.upsellSignals);
    }
    
    // Health scores per user
    const healthScores = {};
    for (const [user, userAnalyses] of Object.entries(byUser)) {
      if (user === '_shared') continue;
      const health = computeHealth({
        activeDays: 1,
        totalDays: 7,
        avgSatisfaction: userAnalyses.reduce((s, a) => s + a.satisfaction, 0) / userAnalyses.length,
        avgLines: userAnalyses.reduce((s, a) => s + a.lines, 0) / userAnalyses.length,
        uniqueTools: new Set(userAnalyses.flatMap(a => Object.keys(a.toolsUsed))).size,
        daysSinceActive: 0,
      });
      healthScores[user] = health;
    }
    
    const clientHealth = users.length > 0 
      ? Math.round(Object.values(healthScores).reduce((s, h) => s + h, 0) / users.length * 10) / 10 
      : 0;
    
    const healthEmoji = clientHealth >= 7 ? '🟢' : clientHealth >= 5 ? '🟡' : '🔴';
    
    // Work/personal split
    const workCount = analyses.filter(a => a.workClassification === 'work').length;
    const personalCount = analyses.filter(a => a.workClassification === 'personal').length;
    
    // === MARKDOWN ===
    let md = `# 📋 Field Report: ${clientId}\n`;
    md += `**Date:** ${date} | **Agent:** ${agentName} | **Client Health:** ${clientHealth}/10 ${healthEmoji}\n\n`;
    
    // Dashboard
    md += `## 📊 Dashboard\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Active Users | ${users.length} |\n`;
    md += `| Total Words | ${totalWords.toLocaleString()} |\n`;
    md += `| Avg Satisfaction | ${avgSat.toFixed(1)}/10 |\n`;
    md += `| Work / Personal / Mixed | ${workCount} / ${personalCount} / ${analyses.length - workCount - personalCount} |\n`;
    md += `| Top Tools | ${Object.entries(allTools).sort((a,b) => b[1]-a[1]).map(([t]) => t).join(', ') || 'none detected'} |\n\n`;
    
    // Per-user
    md += `### Per-User\n\n`;
    md += `| User | Words | Satisfaction | Type | Sentiment | Language | Health |\n`;
    md += `|------|-------|-------------|------|-----------|----------|--------|\n`;
    for (const [user, userAnalyses] of Object.entries(byUser)) {
      if (user === '_shared') continue;
      const uWords = userAnalyses.reduce((s, a) => s + a.words, 0);
      const uSat = (userAnalyses.reduce((s, a) => s + a.satisfaction, 0) / userAnalyses.length).toFixed(1);
      const uType = userAnalyses[0].workClassification;
      const uSent = userAnalyses[0].sentiment;
      const uLang = userAnalyses[0].language;
      const h = healthScores[user] || 0;
      const hE = h >= 7 ? '🟢' : h >= 5 ? '🟡' : '🔴';
      md += `| ${user} | ${uWords} | ${uSat} | ${uType} | ${uSent} | ${uLang} | ${hE} ${h} |\n`;
    }
    md += `\n`;
    
    // Insights
    md += `## 🔍 Insights\n\n`;
    
    const langs = analyses.reduce((acc, a) => { acc[a.language] = (acc[a.language] || 0) + 1; return acc; }, {});
    md += `- 🗣️ **Language**: ${Object.entries(langs).map(([l, c]) => `${l}: ${c}`).join(', ')}\n`;
    
    if (allUpsell.length > 0) md += `- 💡 **Upsell signals** (${allUpsell.length}): Users asking for more capabilities\n`;
    
    const allPossible = ['pdf', 'search', 'content', 'data', 'calendar', 'translation'];
    const unused = allPossible.filter(t => !allTools[t]);
    if (unused.length > 0) md += `- 🔮 **Undiscovered features**: ${unused.join(', ')}\n`;
    
    const totalConfusion = analyses.reduce((s, a) => s + a.confusionPoints, 0);
    if (totalConfusion > 0) md += `- 🤔 **Confusion detected** (${totalConfusion} signals)\n`;
    
    const complexCount = analyses.filter(a => a.complexity === 'complex').length;
    if (complexCount > 0) md += `- 🧠 **Complex tasks**: ${complexCount}/${analyses.length} sessions were complex\n`;
    
    md += `\n`;
    
    // Alerts
    md += `## 🚨 Alerts\n\n`;
    let alerts = 0;
    
    for (const [user, h] of Object.entries(healthScores)) {
      if (h < 5) { md += `- 🔴 **At-risk: ${user}** (health: ${h}/10)\n`; alerts++; }
    }
    
    if (avgSat < 5) { md += `- 😟 **Low satisfaction** (${avgSat.toFixed(1)}/10) — review interactions\n`; alerts++; }
    
    if (alerts === 0) md += `✅ No alerts. All clear.\n`;
    
    fullReport += md + '\n---\n\n';
  }
  
  return fullReport;
}

// ============== SEND TO HQ ==============
function sendViaA2A(report, date, clientId) {
  const santosId = 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb';
  const sendScript = [
    path.join(WS, 'bjs-a2a-protocol/scripts/daemon-send.sh'),
    path.join(WS, 'a2a-protocol/scripts/daemon-send.sh'),
  ].find(p => fs.existsSync(p));
  
  if (!sendScript) { console.error('⚠️ No A2A send script found'); return; }
  
  const { execSync } = require('child_process');
  const truncated = report.length > 3000 ? report.slice(0, 2900) + '\n\n[truncated]' : report;
  
  const payload = JSON.stringify({
    type: 'field_report',
    from: 'Sybil',
    date,
    report: truncated,
  });
  
  try {
    execSync(`bash "${sendScript}" "${santosId}" '${payload.replace(/'/g, "\\'")}' --type report --subject "📋 Field Report: ${clientId || 'all'} (${date})"`, { timeout: 10000 });
    console.error('✅ Report sent to Santos');
  } catch (e) {
    console.error('⚠️ A2A send failed:', e.message?.slice(0, 100));
  }
}

// ============== MAIN ==============
async function main() {
  const opts = parseArgs();
  const agentId = AGENT_MAP[opts.agent];
  
  if (!agentId) {
    console.error(`Unknown agent: ${opts.agent}. Known: ${Object.keys(AGENT_MAP).join(', ')}`);
    process.exit(1);
  }
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or key. Check rag/.env');
    process.exit(1);
  }
  
  console.error(`📊 Analyzing ${opts.agent}'s activity for ${opts.date}...`);
  
  // Fetch docs from Supabase
  const docs = await fetchAgentDocs(agentId, opts.date);
  console.error(`   Found ${docs.length} document chunks`);
  
  if (docs.length === 0) {
    console.log(`No data for ${opts.agent} on ${opts.date}`);
    process.exit(0);
  }
  
  // Analyze each doc
  const analyses = docs
    .filter(d => d.metadata?.client_id) // Only client docs
    .map(d => analyzeDoc(d.content || '', d.file_path || ''));
  
  console.error(`   Analyzed ${analyses.length} client documents`);
  
  if (analyses.length === 0) {
    console.log(`No client activity for ${opts.agent} on ${opts.date}`);
    process.exit(0);
  }
  
  // Build report
  const report = buildReport(opts.agent, opts.date, analyses);
  console.log(report);
  
  // Save locally
  const reportDir = path.join(WS, 'memory/reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, `${opts.agent}-${opts.date}.md`), report);
  console.error(`📄 Saved to memory/reports/${opts.agent}-${opts.date}.md`);
  
  // Send to Santos
  if (opts.sendHQ) {
    sendViaA2A(report, opts.date, null);
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
