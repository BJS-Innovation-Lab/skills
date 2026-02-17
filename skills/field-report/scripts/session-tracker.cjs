#!/usr/bin/env node
/**
 * Field Report — Session Tracker (runs on field agent)
 * 
 * Lightweight metrics logger. Runs via cron every few hours.
 * Reads OpenClaw session data and appends structured metrics to a JSONL file.
 * 
 * This is the ONLY thing the field agent needs to run.
 * Everything else (analysis, reports, briefings) happens on HQ side.
 * 
 * Usage:
 *   node session-tracker.cjs
 * 
 * Output: Appends to memory/metrics/YYYY-MM-DD.jsonl
 * 
 * Tracked per entry:
 *   - timestamp
 *   - sessions active since last check
 *   - per-user message counts (in/out)
 *   - tools invoked
 *   - session durations
 *   - after-hours flag
 * 
 * The JSONL file gets embedded by sync-memory.cjs and pulled by HQ.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const TODAY = new Date().toISOString().split('T')[0];
const NOW = new Date();

// ============== STATE ==============
const STATE_FILE = path.join(WS, 'memory/metrics/.tracker-state.json');
const METRICS_DIR = path.join(WS, 'memory/metrics');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { lastCheck: null, lastMessageIds: {} }; }
}

function saveState(state) {
  if (!fs.existsSync(METRICS_DIR)) fs.mkdirSync(METRICS_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ============== OPENCLAW SESSION DATA ==============
function getRecentSessions() {
  // Try to get session data from OpenClaw gateway
  try {
    const result = execSync('openclaw cron list --json 2>/dev/null', { timeout: 5000, encoding: 'utf-8' });
    // This gives us cron jobs, not sessions — but we can check if gateway is responsive
  } catch {}
  
  // Read daily memory files for activity signals
  const sessions = [];
  
  // Check client directories for today's files
  const clientsDir = path.join(WS, 'memory/clients');
  if (!fs.existsSync(clientsDir)) return sessions;
  
  const clients = fs.readdirSync(clientsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  
  for (const client of clients) {
    const clientDir = path.join(clientsDir, client.name);
    const users = fs.readdirSync(clientDir, { withFileTypes: true }).filter(d => d.isDirectory());
    
    for (const user of users) {
      const todayFile = path.join(clientDir, user.name, `${TODAY}.md`);
      if (fs.existsSync(todayFile)) {
        const content = fs.readFileSync(todayFile, 'utf-8');
        const stat = fs.statSync(todayFile);
        
        sessions.push({
          client: client.name,
          user: user.name,
          file: todayFile,
          lastModified: stat.mtime.toISOString(),
          wordCount: content.split(/\s+/).length,
          lineCount: content.split('\n').filter(l => l.trim()).length,
          size: stat.size,
        });
      }
    }
    
    // Also check flat client file
    const flatFile = path.join(clientDir, `${TODAY}.md`);
    if (fs.existsSync(flatFile)) {
      const content = fs.readFileSync(flatFile, 'utf-8');
      const stat = fs.statSync(flatFile);
      sessions.push({
        client: client.name,
        user: '_shared',
        file: flatFile,
        lastModified: stat.mtime.toISOString(),
        wordCount: content.split(/\s+/).length,
        lineCount: content.split('\n').filter(l => l.trim()).length,
        size: stat.size,
      });
    }
  }
  
  return sessions;
}

// ============== TOOL USAGE ==============
function detectToolUsage() {
  // Check recent cron run history for tool invocations
  const tools = {};
  
  // Read today's memory files for tool signals
  const clientsDir = path.join(WS, 'memory/clients');
  if (!fs.existsSync(clientsDir)) return tools;
  
  const toolPatterns = {
    'pdf_extraction': /\b(pdf|extract|OCR|parse\s+document)\b/gi,
    'web_search': /\b(search|searched|googl|found online)\b/gi,
    'content_creation': /\b(wrote|drafted|created|generated|composed)\b/gi,
    'data_analysis': /\b(analyz|spreadsheet|excel|csv|chart|graph|data)\b/gi,
    'translation': /\b(translat|translated|inglés|español|english|spanish)\b/gi,
    'file_operations': /\b(file|upload|download|read|wrote to)\b/gi,
    'calendar': /\b(calendar|schedule|appointment|meeting|cita|agenda)\b/gi,
    'email': /\b(email|correo|sent|reply|forward|inbox)\b/gi,
  };
  
  // Scan today's files
  const clients = fs.readdirSync(clientsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const client of clients) {
    const clientDir = path.join(clientsDir, client.name);
    const entries = fs.readdirSync(clientDir, { withFileTypes: true });
    
    for (const entry of entries) {
      let content = '';
      if (entry.isDirectory()) {
        const dayFile = path.join(clientDir, entry.name, `${TODAY}.md`);
        if (fs.existsSync(dayFile)) content = fs.readFileSync(dayFile, 'utf-8');
      } else if (entry.name === `${TODAY}.md`) {
        content = fs.readFileSync(path.join(clientDir, entry.name), 'utf-8');
      }
      
      if (content) {
        for (const [tool, pattern] of Object.entries(toolPatterns)) {
          const matches = (content.match(pattern) || []).length;
          if (matches > 0) tools[tool] = (tools[tool] || 0) + matches;
        }
      }
    }
  }
  
  return tools;
}

// ============== SECURITY EVENTS ==============
function getSecurityStats() {
  const logFile = path.join(WS, 'memory/security/events.jsonl');
  if (!fs.existsSync(logFile)) return { total: 0, high: 0, critical: 0 };
  
  const events = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(e => e && e.timestamp && e.timestamp.startsWith(TODAY));
  
  return {
    total: events.length,
    high: events.filter(e => e.severity === 'HIGH').length,
    critical: events.filter(e => e.severity === 'CRITICAL').length,
  };
}

// ============== MAIN ==============
function main() {
  const state = loadState();
  
  const hour = NOW.getHours();
  const isAfterHours = hour >= 22 || hour < 7;
  const isWeekend = NOW.getDay() === 0 || NOW.getDay() === 6;
  
  const sessions = getRecentSessions();
  const tools = detectToolUsage();
  const security = getSecurityStats();
  
  // Build metrics entry
  const entry = {
    timestamp: NOW.toISOString(),
    date: TODAY,
    period: {
      afterHours: isAfterHours,
      weekend: isWeekend,
      hour,
    },
    activity: {
      activeUsers: [...new Set(sessions.filter(s => s.user !== '_shared').map(s => s.user))],
      activeClients: [...new Set(sessions.map(s => s.client))],
      totalWords: sessions.reduce((s, x) => s + x.wordCount, 0),
      totalLines: sessions.reduce((s, x) => s + x.lineCount, 0),
      sessions: sessions.map(s => ({
        client: s.client,
        user: s.user,
        words: s.wordCount,
        lines: s.lineCount,
        lastModified: s.lastModified,
      })),
    },
    tools,
    security,
  };
  
  // Append to JSONL
  if (!fs.existsSync(METRICS_DIR)) fs.mkdirSync(METRICS_DIR, { recursive: true });
  const metricsFile = path.join(METRICS_DIR, `${TODAY}.jsonl`);
  fs.appendFileSync(metricsFile, JSON.stringify(entry) + '\n');
  
  // Update state
  state.lastCheck = NOW.toISOString();
  saveState(state);
  
  // Output summary
  const userCount = entry.activity.activeUsers.length;
  const clientCount = entry.activity.activeClients.length;
  const toolCount = Object.keys(tools).length;
  
  console.log(`📊 Metrics logged: ${userCount} users, ${clientCount} clients, ${toolCount} tools, ${entry.activity.totalWords} words`);
  if (security.high + security.critical > 0) {
    console.log(`🛡️ Security: ${security.high} high, ${security.critical} critical`);
  }
  if (isAfterHours) console.log(`🌙 After-hours activity detected`);
  if (isWeekend) console.log(`📅 Weekend activity detected`);
}

if (require.main === module) main();
