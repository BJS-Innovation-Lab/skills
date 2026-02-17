#!/usr/bin/env node
/**
 * Field Report — Nightly Report Generator
 * 
 * Generates the 3-section report (Dashboard, Insights, Alerts) and optionally
 * sends to HQ via A2A.
 * 
 * Usage:
 *   node generate-report.cjs --client click-seguros [--date 2026-02-16] [--send-hq]
 *   node generate-report.cjs --all --send-hq
 * 
 * Output: Markdown report + optional A2A delivery to Santos/Sybil
 */

const fs = require('fs');
const path = require('path');
const { analyzeContent, findDailyFiles } = require('./analyze-sessions.cjs');
const { computeHealthScore } = require('./health-score.cjs');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

// ============== ARGS ==============
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { client: null, date: null, sendHQ: false, all: false, days: 1 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--client': opts.client = args[++i]; break;
      case '--date': opts.date = args[++i]; break;
      case '--send-hq': opts.sendHQ = true; break;
      case '--all': opts.all = true; break;
      case '--days': opts.days = parseInt(args[++i]); break;
    }
  }
  if (!opts.date) {
    const d = new Date(Date.now() - opts.days * 86400000);
    opts.date = d.toISOString().split('T')[0];
  }
  return opts;
}

// ============== SECURITY EVENTS ==============
function getSecurityEvents(date) {
  const logFile = path.join(WS, 'memory/security/events.jsonl');
  if (!fs.existsSync(logFile)) return [];
  
  return fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(e => e && e.timestamp && e.timestamp.startsWith(date));
}

// ============== REPORT GENERATION ==============
function generateReport(clientId, date) {
  const files = findDailyFiles(clientId, date);
  
  if (files.length === 0) {
    return {
      client: clientId,
      date,
      noData: true,
      markdown: `# 📋 Field Report: ${clientId}\n**Date:** ${date}\n\n⚠️ No activity recorded for this date.`
    };
  }
  
  // Analyze each user
  const userMetrics = [];
  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf-8');
    userMetrics.push(analyzeContent(content, file.user));
  }
  
  // Aggregate
  const totalMsgs = userMetrics.reduce((s, u) => s + u.messageEstimate, 0);
  const totalWords = userMetrics.reduce((s, u) => s + u.wordCount, 0);
  const avgSatisfaction = userMetrics.reduce((s, u) => s + u.satisfactionScore, 0) / userMetrics.length;
  const avgDepth = userMetrics.reduce((s, u) => s + u.sessionDepth, 0) / userMetrics.length;
  
  // Health scores (7-day window)
  const healthData = {};
  const clientDir = path.join(WS, 'memory/clients', clientId);
  const users = fs.readdirSync(clientDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  
  for (const user of users) {
    // Simple health data from today's metrics
    const um = userMetrics.find(u => u.user === user);
    healthData[user] = computeHealthScore({
      activeDays: um ? 1 : 0,
      totalDays: 7,
      avgSatisfaction: um ? um.satisfactionScore : 5,
      avgSessionDepth: um ? um.sessionDepth : 1,
      avgMessages: um ? um.messageEstimate : 0,
      uniqueTools: um ? Object.keys(um.toolsUsed).length : 0,
      daysSinceLastInteraction: um ? 0 : 7,
    });
  }
  
  const clientHealth = Object.values(healthData).length > 0
    ? Math.round(Object.values(healthData).reduce((s, h) => s + h.composite, 0) / Object.values(healthData).length * 10) / 10
    : 0;
  
  // Security events
  const secEvents = getSecurityEvents(date);
  const highSec = secEvents.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');
  
  // Work vs personal
  const workCount = userMetrics.filter(u => u.workClassification === 'work').length;
  const personalCount = userMetrics.filter(u => u.workClassification === 'personal').length;
  
  // All tools
  const allTools = {};
  for (const u of userMetrics) {
    for (const [tool, count] of Object.entries(u.toolsUsed)) {
      allTools[tool] = (allTools[tool] || 0) + count;
    }
  }
  const toolsSorted = Object.entries(allTools).sort((a, b) => b[1] - a[1]);
  
  // All upsell signals
  const upsellSignals = userMetrics.flatMap(u => u.upsellSignals);
  
  // After hours
  const afterHours = userMetrics.reduce((s, u) => s + u.afterHoursSignals, 0);
  
  // === BUILD MARKDOWN ===
  let md = `# 📋 Field Report: ${clientId}\n`;
  md += `**Date:** ${date} | **Agent:** Sam | **Client Health:** ${clientHealth}/10 ${clientHealth >= 7 ? '🟢' : clientHealth >= 5 ? '🟡' : '🔴'}\n\n`;
  
  // Section 1: Dashboard
  md += `## 📊 Dashboard\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Active Users | ${userMetrics.length} / ${users.length} |\n`;
  md += `| Total Messages | ~${totalMsgs} |\n`;
  md += `| Total Words | ${totalWords.toLocaleString()} |\n`;
  md += `| Avg Satisfaction | ${avgSatisfaction.toFixed(1)}/10 |\n`;
  md += `| Avg Session Depth | ${avgDepth.toFixed(1)} |\n`;
  md += `| Work / Personal | ${workCount} / ${personalCount} |\n`;
  md += `| After-Hours Signals | ${afterHours} |\n`;
  md += `| Security Events | ${secEvents.length} (${highSec.length} high/critical) |\n\n`;
  
  // Per-user breakdown
  md += `### Per-User Breakdown\n\n`;
  md += `| User | Messages | Satisfaction | Complexity | Sentiment | Health |\n`;
  md += `|------|----------|-------------|------------|-----------|--------|\n`;
  for (const u of userMetrics) {
    const h = healthData[u.user];
    const healthEmoji = h ? (h.composite >= 7 ? '🟢' : h.composite >= 5 ? '🟡' : '🔴') : '❓';
    const healthVal = h ? h.composite.toFixed(1) : 'N/A';
    md += `| ${u.user} | ~${u.messageEstimate} | ${u.satisfactionScore.toFixed(1)} | ${u.complexity} | ${u.sentiment} | ${healthEmoji} ${healthVal} |\n`;
  }
  md += `\n`;
  
  // Tools
  if (toolsSorted.length > 0) {
    md += `### Tools Used\n`;
    for (const [tool, count] of toolsSorted) {
      md += `- **${tool}**: ${count} references\n`;
    }
    md += `\n`;
  }
  
  // Section 2: Insights
  md += `## 🔍 Insights\n\n`;
  
  // Engagement pattern
  const activeRatio = userMetrics.length / Math.max(1, users.length);
  if (activeRatio < 0.5) {
    md += `- ⚠️ **Low engagement**: Only ${userMetrics.length}/${users.length} users active today. Reach out to inactive users.\n`;
  } else if (activeRatio === 1) {
    md += `- ✅ **Full engagement**: All ${users.length} users active today.\n`;
  }
  
  // Satisfaction
  if (avgSatisfaction >= 7) {
    md += `- 😊 **High satisfaction** (${avgSatisfaction.toFixed(1)}/10): Users are happy with Sam's responses.\n`;
  } else if (avgSatisfaction < 5) {
    md += `- 😟 **Low satisfaction** (${avgSatisfaction.toFixed(1)}/10): Review negative interactions and improve.\n`;
  }
  
  // Language
  const langBreakdown = userMetrics.reduce((acc, u) => { acc[u.language] = (acc[u.language] || 0) + 1; return acc; }, {});
  md += `- 🗣️ **Language**: ${Object.entries(langBreakdown).map(([l, c]) => `${l}: ${c}`).join(', ')}\n`;
  
  // Upsell
  if (upsellSignals.length > 0) {
    md += `- 💡 **Upsell signals** (${upsellSignals.length}): Users asking for capabilities beyond current scope.\n`;
  }
  
  // Feature discovery
  const allPossibleTools = ['pdf', 'search', 'content', 'data', 'calendar', 'translation'];
  const unusedTools = allPossibleTools.filter(t => !allTools[t]);
  if (unusedTools.length > 0) {
    md += `- 🔮 **Undiscovered features**: ${unusedTools.join(', ')} — consider proactive suggestions.\n`;
  }
  
  // Confusion
  const totalConfusion = userMetrics.reduce((s, u) => s + u.confusionPoints, 0);
  if (totalConfusion > 0) {
    md += `- 🤔 **Confusion detected** (${totalConfusion} signals): Users struggling to understand capabilities.\n`;
  }
  
  md += `\n`;
  
  // Section 3: Alerts
  md += `## 🚨 Alerts\n\n`;
  
  let alertCount = 0;
  
  // Health alerts
  for (const [user, health] of Object.entries(healthData)) {
    if (health.alert) {
      md += `- 🔴 **At-risk user: ${user}** (health: ${health.composite.toFixed(1)}/10) — engagement declining.\n`;
      alertCount++;
    }
  }
  
  // Security alerts
  if (highSec.length > 0) {
    md += `- 🛡️ **Security**: ${highSec.length} high/critical events detected. Review security log.\n`;
    alertCount++;
  }
  
  // Inactive users
  const inactiveUsers = users.filter(u => !userMetrics.find(m => m.user === u));
  if (inactiveUsers.length > 0) {
    md += `- 👻 **Inactive users today**: ${inactiveUsers.join(', ')}\n`;
    alertCount++;
  }
  
  if (alertCount === 0) {
    md += `✅ No alerts. All clear.\n`;
  }
  
  return {
    client: clientId,
    date,
    markdown: md,
    metrics: {
      clientHealth,
      activeUsers: userMetrics.length,
      totalUsers: users.length,
      totalMessages: totalMsgs,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      securityEvents: secEvents.length,
      alerts: alertCount,
    },
    userMetrics,
    healthData,
  };
}

// ============== SEND TO HQ ==============
function sendToHQ(report) {
  // Load config
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.join(WS, '.field-security.json'), 'utf-8'));
  } catch {}
  
  const hqAgentId = config.hq_agent_id || '5fae1839-ab85-412c-acc0-033cbbbbd15b'; // Sybil
  const santosId = 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb'; // Santos for CS analysis
  
  const sendScript = path.join(WS, 'bjs-a2a-protocol/scripts/daemon-send.sh');
  if (!fs.existsSync(sendScript)) {
    // Try alternate path
    const altScript = path.join(WS, 'a2a-protocol/scripts/daemon-send.sh');
    if (!fs.existsSync(altScript)) {
      console.error('⚠️ A2A send script not found. Report saved locally only.');
      return;
    }
  }
  
  const scriptPath = fs.existsSync(sendScript) ? sendScript : path.join(WS, 'a2a-protocol/scripts/daemon-send.sh');
  
  const { execSync } = require('child_process');
  
  // Truncate markdown for A2A (max ~3KB)
  const truncatedMd = report.markdown.length > 3000 
    ? report.markdown.slice(0, 2900) + '\n\n... [truncated, see full report in memory/clients/]'
    : report.markdown;
  
  const payload = JSON.stringify({
    type: 'field_report',
    from: process.env.AGENT_NAME || 'Sam',
    client: report.client,
    date: report.date,
    metrics: report.metrics,
    report: truncatedMd,
  });
  
  // Send to Santos (primary recipient for CS analysis)
  try {
    execSync(`bash "${scriptPath}" "${santosId}" '${payload.replace(/'/g, "\\'")}' --type report --subject "📋 Field Report: ${report.client} (${report.date})" --priority normal`, {
      timeout: 10000
    });
    console.log('✅ Report sent to Santos via A2A');
  } catch (e) {
    console.error('⚠️ Failed to send to Santos:', e.message?.slice(0, 100));
  }
  
  // Also send to Sybil (HQ backup)
  try {
    execSync(`bash "${scriptPath}" "${hqAgentId}" '${payload.replace(/'/g, "\\'")}' --type report --subject "📋 Field Report: ${report.client} (${report.date})"`, {
      timeout: 10000
    });
    console.log('✅ Report sent to Sybil via A2A');
  } catch (e) {
    console.error('⚠️ Failed to send to Sybil:', e.message?.slice(0, 100));
  }
}

// ============== MAIN ==============
function main() {
  const opts = parseArgs();
  
  const clientsDir = path.join(WS, 'memory/clients');
  let clients = [];
  
  if (opts.client) {
    clients = [opts.client];
  } else if (opts.all && fs.existsSync(clientsDir)) {
    clients = fs.readdirSync(clientsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
  } else {
    // Auto-detect from client map
    try {
      const { CLIENT_MAP } = require('../../../rag/client-router.cjs');
      clients = [...new Set(Object.values(CLIENT_MAP))];
    } catch {
      console.error('Usage: node generate-report.cjs --client <name> or --all');
      process.exit(1);
    }
  }
  
  for (const clientId of clients) {
    const report = generateReport(clientId, opts.date);
    
    // Print report
    console.log(report.markdown);
    
    // Save report
    const reportDir = path.join(WS, 'memory/clients', clientId, 'reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, `${opts.date}.md`), report.markdown);
    fs.writeFileSync(path.join(reportDir, `${opts.date}.json`), JSON.stringify(report.metrics, null, 2));
    console.error(`📄 Report saved to memory/clients/${clientId}/reports/${opts.date}.md`);
    
    // Send to HQ
    if (opts.sendHQ && !report.noData) {
      sendToHQ(report);
    }
  }
}

if (require.main === module) main();
