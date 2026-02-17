#!/usr/bin/env node
/**
 * Field Report — Client Health Score Calculator
 * 
 * Computes a 1-10 health score per user and per client, combining:
 *   frequency (30%), satisfaction (25%), depth (20%), breadth (15%), recency (10%)
 * 
 * Usage:
 *   node health-score.cjs --client click-seguros --days 7
 *   node health-score.cjs --all --days 14
 * 
 * Reads: memory/security/reputation.json, daily analysis files
 * Writes: memory/clients/{client}/health-scores.json
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

// ============== ARGS ==============
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { client: null, days: 7, all: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--client': opts.client = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--all': opts.all = true; break;
    }
  }
  return opts;
}

// ============== SCORING ==============

/**
 * Frequency score (0-10): How often does the user interact?
 * 10 = daily, 7 = every other day, 4 = once a week, 1 = once in period
 */
function frequencyScore(activeDays, totalDays) {
  const ratio = activeDays / Math.max(1, totalDays);
  return Math.min(10, Math.round(ratio * 12 * 10) / 10);
}

/**
 * Satisfaction score (0-10): From sentiment analysis
 * Direct passthrough from analyze-sessions.cjs (already 0-10)
 */
function satisfactionScore(avgSatisfaction) {
  return Math.min(10, Math.max(0, avgSatisfaction || 5));
}

/**
 * Depth score (0-10): Engagement depth
 * 10 = deep multi-turn conversations, 1 = single-message interactions
 */
function depthScore(avgSessionDepth, avgMessages) {
  const depthSignal = Math.min(10, (avgSessionDepth || 1) * 2);
  const msgSignal = Math.min(10, (avgMessages || 1) / 5);
  return Math.round((depthSignal * 0.6 + msgSignal * 0.4) * 10) / 10;
}

/**
 * Breadth score (0-10): Feature diversity
 * 10 = uses 5+ different tools, 1 = only one tool
 */
function breadthScore(uniqueToolsUsed) {
  return Math.min(10, Math.round(uniqueToolsUsed * 2 * 10) / 10);
}

/**
 * Recency score (0-10): How recently did they interact?
 * 10 = today, 8 = yesterday, 5 = 3 days ago, 0 = 7+ days ago
 */
function recencyScore(daysSinceLastInteraction) {
  if (daysSinceLastInteraction <= 0) return 10;
  if (daysSinceLastInteraction <= 1) return 8;
  return Math.max(0, Math.round((10 - daysSinceLastInteraction * 1.5) * 10) / 10);
}

/**
 * Compute composite health score
 */
function computeHealthScore(metrics) {
  const freq = frequencyScore(metrics.activeDays || 1, metrics.totalDays || 7);
  const sat = satisfactionScore(metrics.avgSatisfaction);
  const depth = depthScore(metrics.avgSessionDepth, metrics.avgMessages);
  const breadth = breadthScore(metrics.uniqueTools || 1);
  const recency = recencyScore(metrics.daysSinceLastInteraction || 0);
  
  const composite = (
    freq * 0.30 +
    sat * 0.25 +
    depth * 0.20 +
    breadth * 0.15 +
    recency * 0.10
  );
  
  return {
    composite: Math.round(composite * 10) / 10,
    breakdown: {
      frequency: freq,
      satisfaction: sat,
      depth: depth,
      breadth: breadth,
      recency: recency,
    },
    status: composite >= 7 ? 'healthy' : composite >= 5 ? 'watch' : 'at-risk',
    alert: composite < 5,
  };
}

// ============== GATHER DATA ==============
function gatherUserData(clientId, userName, days) {
  const clientDir = path.join(WS, 'memory/clients', clientId);
  let activeDays = 0;
  let totalSatisfaction = 0;
  let totalSessionDepth = 0;
  let totalMessages = 0;
  let allTools = new Set();
  let dayCount = 0;
  let lastActiveDay = null;
  
  for (let d = 0; d < days; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
    
    // Check per-user file
    const userFile = path.join(clientDir, userName, `${date}.md`);
    // Also check flat file
    const flatFile = path.join(clientDir, `${date}.md`);
    
    let content = null;
    if (fs.existsSync(userFile)) {
      content = fs.readFileSync(userFile, 'utf-8');
    } else if (fs.existsSync(flatFile)) {
      content = fs.readFileSync(flatFile, 'utf-8');
    }
    
    if (content && content.trim().length > 0) {
      activeDays++;
      if (!lastActiveDay) lastActiveDay = d;
      
      // Quick analysis
      const lines = content.split('\n').filter(l => l.trim()).length;
      totalMessages += lines;
      
      const sections = content.split(/^#{1,3}\s/m).length - 1;
      totalSessionDepth += Math.max(1, sections);
      
      // Satisfaction (simple)
      const pos = (content.match(/\b(thanks?|great|perfect|awesome|excellent|gracias|genial)\b/gi) || []).length;
      const neg = (content.match(/\b(wrong|error|bad|broken|frustrated|confused)\b/gi) || []).length;
      totalSatisfaction += Math.min(10, Math.max(0, 5 + pos * 1.5 - neg * 2));
      
      // Tools
      const toolPatterns = { pdf: /pdf/i, search: /search|buscar/i, content: /write|draft|post/i, data: /data|excel|csv/i, calendar: /calendar|schedule/i };
      for (const [tool, pattern] of Object.entries(toolPatterns)) {
        if (pattern.test(content)) allTools.add(tool);
      }
      
      dayCount++;
    }
  }
  
  return {
    activeDays,
    totalDays: days,
    avgSatisfaction: dayCount > 0 ? totalSatisfaction / dayCount : 5,
    avgSessionDepth: dayCount > 0 ? totalSessionDepth / dayCount : 1,
    avgMessages: dayCount > 0 ? totalMessages / dayCount : 0,
    uniqueTools: allTools.size,
    daysSinceLastInteraction: lastActiveDay !== null ? lastActiveDay : days,
  };
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
    console.error('Usage: node health-score.cjs --client <name> [--days 7] or --all');
    process.exit(1);
  }
  
  const results = {};
  
  for (const clientId of clients) {
    const clientDir = path.join(clientsDir, clientId);
    if (!fs.existsSync(clientDir)) continue;
    
    // Find users
    const users = fs.readdirSync(clientDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
    
    const userScores = {};
    let compositeSum = 0;
    
    for (const user of users) {
      const data = gatherUserData(clientId, user, opts.days);
      const score = computeHealthScore(data);
      userScores[user] = { ...score, data };
      compositeSum += score.composite;
    }
    
    const clientComposite = users.length > 0 ? Math.round(compositeSum / users.length * 10) / 10 : 0;
    
    results[clientId] = {
      clientHealthScore: clientComposite,
      clientStatus: clientComposite >= 7 ? 'healthy' : clientComposite >= 5 ? 'watch' : 'at-risk',
      clientAlert: clientComposite < 5 || Object.values(userScores).some(u => u.alert),
      users: userScores,
      period: `${opts.days} days`,
      computed: new Date().toISOString(),
    };
    
    // Save to client dir
    const outFile = path.join(clientDir, 'health-scores.json');
    fs.writeFileSync(outFile, JSON.stringify(results[clientId], null, 2));
  }
  
  console.log(JSON.stringify(results, null, 2));
}

module.exports = { computeHealthScore, frequencyScore, satisfactionScore, depthScore, breadthScore, recencyScore };

if (require.main === module) main();
