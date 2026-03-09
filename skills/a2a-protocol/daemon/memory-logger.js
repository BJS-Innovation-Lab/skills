/**
 * memory-logger.js — A2A Auto-Logger for durable memory
 * 
 * Hooks into the A2A daemon to automatically log all sent/received messages
 * to daily memory files and working memory state files.
 * 
 * Two modes:
 *   - BASE: One-liner per message in daily file + working memory threads (all agents)
 *   - CS: Enhanced format with escalation tracking, response times, client index (CS agent)
 * 
 * Config via env:
 *   A2A_MEMORY_MODE=base|cs        (default: base)
 *   WORKSPACE=/path/to/workspace   (default: ~/.openclaw/workspace)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const WORKING_DIR = path.join(MEMORY_DIR, 'working');
const MODE = process.env.A2A_MEMORY_MODE || 'base';

// ── Ensure dirs exist ───────────────────────────────────────────────
function ensureDirs() {
  for (const dir of [MEMORY_DIR, WORKING_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  if (MODE === 'cs') {
    const csDir = path.join(WORKING_DIR, 'escalations');
    if (!fs.existsSync(csDir)) fs.mkdirSync(csDir, { recursive: true });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function timeNow() {
  // Return HH:MM in local timezone
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function dailyFile() {
  return path.join(MEMORY_DIR, `${today()}.md`);
}

function appendToDaily(text) {
  const file = dailyFile();
  fs.appendFileSync(file, text + '\n');
}

function extractPreview(content, maxLen = 100) {
  if (!content) return '(empty)';
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (typeof content === 'object') {
    text = content.body || content.message || content.text || JSON.stringify(content);
  }
  text = text.replace(/\n/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

function extractSubject(message) {
  if (message.subject) return message.subject;
  if (typeof message.content === 'object' && message.content.subject) return message.content.subject;
  return null;
}

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 50);
}

// ── Thread ID generation ────────────────────────────────────────────
// Creates a stable thread ID from agent + subject/topic
function threadId(agentName, subject) {
  const key = `${agentName}-${subject || 'general'}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return key.slice(0, 60);
}

// ── BASE MODE: Simple daily log + working memory ────────────────────
function logReceived_base(message) {
  const from = message.fromName || message.from || 'unknown';
  const subject = extractSubject(message);
  const preview = extractPreview(message.content);
  const priority = message.priority || 'normal';
  const type = message.type || 'message';

  // Daily file entry
  const subjectLine = subject ? ` | ${subject}` : '';
  const priorityTag = priority === 'high' ? ' 🔴' : '';
  appendToDaily(`### A2A ← ${from} — ${timeNow()}${priorityTag}`);
  appendToDaily(`- **Type:** ${type}${subjectLine}`);
  appendToDaily(`- **Preview:** ${preview}`);
  appendToDaily('');

  // Update working memory thread
  updateThread(from, 'received', subject, preview, type, priority);
}

function logSent_base(to, toName, content, type, subject, priority) {
  const name = toName || to || 'unknown';
  const preview = extractPreview(content);

  // Daily file entry
  const subjectLine = subject ? ` | ${subject}` : '';
  appendToDaily(`### A2A → ${name} — ${timeNow()}`);
  appendToDaily(`- **Type:** ${type || 'message'}${subjectLine}`);
  appendToDaily(`- **Preview:** ${preview}`);
  appendToDaily('');

  // Update working memory thread
  updateThread(name, 'sent', subject, preview, type, priority);
}

// ── Working Memory Thread Tracking ──────────────────────────────────
function updateThread(agentName, direction, subject, preview, type, priority) {
  const tid = threadId(agentName, subject);
  const threadFile = path.join(WORKING_DIR, `thread-${tid}.md`);

  const now = new Date().toISOString();
  const arrow = direction === 'received' ? '←' : '→';

  if (!fs.existsSync(threadFile)) {
    // New thread
    const header = `# Thread: ${agentName} — ${subject || 'general'}
Status: ACTIVE
Started: ${now}
Last update: ${now}
Priority: ${priority || 'normal'}

## Messages
`;
    fs.writeFileSync(threadFile, header);
  }

  // Append message to thread
  const entry = `- [${now.slice(0, 19)}] ${arrow} ${preview.slice(0, 150)}\n`;
  fs.appendFileSync(threadFile, entry);

  // Update "Last update" in header
  try {
    let content = fs.readFileSync(threadFile, 'utf8');
    content = content.replace(/^Last update:.*$/m, `Last update: ${now}`);
    
    // Update priority if escalated
    if (priority === 'high') {
      content = content.replace(/^Priority:.*$/m, `Priority: high`);
    }
    fs.writeFileSync(threadFile, content);
  } catch { /* ignore update errors */ }
}

// Clean up resolved threads (call periodically)
function cleanupThreads(maxAgeDays = 3) {
  if (!fs.existsSync(WORKING_DIR)) return;
  
  const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
  const files = fs.readdirSync(WORKING_DIR).filter(f => f.startsWith('thread-'));
  let cleaned = 0;

  for (const file of files) {
    const filePath = path.join(WORKING_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      // Archive old thread
      const archiveDir = path.join(WORKING_DIR, 'archived');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      fs.renameSync(filePath, path.join(archiveDir, file));
      cleaned++;
    }
  }
  return cleaned;
}

// ── CS MODE: Enhanced escalation tracking ───────────────────────────
function logReceived_cs(message) {
  // Do base logging first
  logReceived_base(message);

  const type = message.type || '';
  const priority = message.priority || 'normal';
  const from = message.fromName || message.from || 'unknown';
  const subject = extractSubject(message);

  // If it's an escalation, create/update escalation tracker
  if (type === 'escalation' || type === 'alert' || priority === 'high') {
    trackEscalation(message);
  }

  // Update agent activity tracker
  updateAgentActivity(from, 'message_received');
}

function logSent_cs(to, toName, content, type, subject, priority) {
  // Do base logging first
  logSent_base(to, toName, content, type, subject, priority);

  // If responding to an escalation, update its status
  if (type === 'escalation-response' || type === 'resolution') {
    resolveEscalation(toName, subject);
  }
}

function trackEscalation(message) {
  const escDir = path.join(WORKING_DIR, 'escalations');
  const from = message.fromName || message.from || 'unknown';
  const subject = extractSubject(message) || 'no-subject';
  const priority = message.priority || 'normal';
  const now = new Date().toISOString();
  const content = extractPreview(message.content, 300);

  // Extract client name from content if possible
  const clientMatch = content.match(/Client:\s*(.+?)(?:\n|$)/i);
  const client = clientMatch ? clientMatch[1].trim() : 'unknown';

  const escId = `ESC-${today().replace(/-/g, '')}-${sanitizeFilename(subject).slice(0, 20)}`;
  const escFile = path.join(escDir, `${escId}.md`);

  if (!fs.existsSync(escFile)) {
    const entry = `# Escalation: ${escId}
Status: OPEN
Priority: ${priority}
From: ${from}
Client: ${client}
Subject: ${subject}
Received: ${now}
Response time: pending

## Initial Report
${content}

## Resolution Log
`;
    fs.writeFileSync(escFile, entry);
  }

  // Update daily escalation index
  const indexFile = path.join(escDir, `${today()}-index.md`);
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, `# Escalation Index — ${today()}\n\n`);
  }
  fs.appendFileSync(indexFile, `- [${now.slice(11, 16)}] ${escId} | ${priority.toUpperCase()} | ${from} | ${client} | ${subject}\n`);
}

function resolveEscalation(agentName, subject) {
  const escDir = path.join(WORKING_DIR, 'escalations');
  if (!fs.existsSync(escDir)) return;

  const files = fs.readdirSync(escDir).filter(f => f.startsWith('ESC-') && f.endsWith('.md'));
  const now = new Date().toISOString();

  for (const file of files) {
    const filePath = path.join(escDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Match by subject similarity
    if (subject && content.toLowerCase().includes(subject.toLowerCase().slice(0, 30))) {
      content = content.replace(/^Status: OPEN$/m, `Status: RESOLVED`);
      content = content.replace(/^Response time: pending$/m, `Response time: ${calculateResponseTime(content, now)}`);
      content += `\n- [${now.slice(0, 19)}] Resolved — response sent to ${agentName}\n`;
      fs.writeFileSync(filePath, content);
      break;
    }
  }
}

function calculateResponseTime(content, nowStr) {
  const receivedMatch = content.match(/^Received: (.+)$/m);
  if (!receivedMatch) return 'unknown';
  
  const received = new Date(receivedMatch[1]);
  const now = new Date(nowStr);
  const diffMs = now - received;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return '<1 min';
  if (diffMin < 60) return `${diffMin} min`;
  return `${Math.round(diffMin / 60 * 10) / 10}h`;
}

function updateAgentActivity(agentName, eventType) {
  const activityFile = path.join(WORKING_DIR, 'agent-activity.json');
  let activity = {};

  if (fs.existsSync(activityFile)) {
    try { activity = JSON.parse(fs.readFileSync(activityFile, 'utf8')); } catch { activity = {}; }
  }

  const key = agentName.toLowerCase();
  if (!activity[key]) {
    activity[key] = { name: agentName, lastSeen: null, messageCount: 0, lastEvent: null };
  }

  activity[key].lastSeen = new Date().toISOString();
  activity[key].messageCount++;
  activity[key].lastEvent = eventType;

  fs.writeFileSync(activityFile, JSON.stringify(activity, null, 2));
}

// ── Daily Summary Generator (for EOD briefings) ────────────────────
function generateDailySummary() {
  const escDir = path.join(WORKING_DIR, 'escalations');
  const indexFile = path.join(escDir, `${today()}-index.md`);
  
  if (!fs.existsSync(indexFile)) return { total: 0, open: 0, resolved: 0, critical: 0, escalations: [] };

  const files = fs.readdirSync(escDir).filter(f => f.startsWith(`ESC-${today().replace(/-/g, '')}`) && f.endsWith('.md'));
  
  const summary = { total: files.length, open: 0, resolved: 0, critical: 0, escalations: [] };

  for (const file of files) {
    const content = fs.readFileSync(path.join(escDir, file), 'utf8');
    const status = content.match(/^Status: (.+)$/m)?.[1] || 'UNKNOWN';
    const priority = content.match(/^Priority: (.+)$/m)?.[1] || 'normal';
    const client = content.match(/^Client: (.+)$/m)?.[1] || 'unknown';
    const subject = content.match(/^Subject: (.+)$/m)?.[1] || 'no subject';
    const responseTime = content.match(/^Response time: (.+)$/m)?.[1] || 'pending';

    if (status === 'OPEN') summary.open++;
    if (status === 'RESOLVED') summary.resolved++;
    if (priority === 'high') summary.critical++;

    summary.escalations.push({ id: file.replace('.md', ''), status, priority, client, subject, responseTime });
  }

  return summary;
}

// ── Public API ──────────────────────────────────────────────────────
module.exports = {
  init() {
    ensureDirs();
    console.log(`📝 Memory logger initialized (mode: ${MODE})`);
  },

  logReceived(message) {
    try {
      if (MODE === 'cs') logReceived_cs(message);
      else logReceived_base(message);
    } catch (err) {
      console.error('📝 Memory logger error (received):', err.message);
    }
  },

  logSent(to, toName, content, type, subject, priority) {
    try {
      if (MODE === 'cs') logSent_cs(to, toName, content, type, subject, priority);
      else logSent_base(to, toName, content, type, subject, priority);
    } catch (err) {
      console.error('📝 Memory logger error (sent):', err.message);
    }
  },

  cleanupThreads,
  generateDailySummary,

  // For CS agents — get current escalation state
  getOpenEscalations() {
    const escDir = path.join(WORKING_DIR, 'escalations');
    if (!fs.existsSync(escDir)) return [];
    
    const files = fs.readdirSync(escDir).filter(f => f.startsWith('ESC-') && f.endsWith('.md'));
    const open = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(escDir, file), 'utf8');
      if (/^Status: OPEN$/m.test(content)) {
        const client = content.match(/^Client: (.+)$/m)?.[1] || 'unknown';
        const subject = content.match(/^Subject: (.+)$/m)?.[1] || '';
        const priority = content.match(/^Priority: (.+)$/m)?.[1] || 'normal';
        open.push({ id: file.replace('.md', ''), client, subject, priority });
      }
    }
    return open;
  },

  // Get agent activity for health monitoring
  getAgentActivity() {
    const activityFile = path.join(WORKING_DIR, 'agent-activity.json');
    if (!fs.existsSync(activityFile)) return {};
    try { return JSON.parse(fs.readFileSync(activityFile, 'utf8')); } catch { return {}; }
  }
};
