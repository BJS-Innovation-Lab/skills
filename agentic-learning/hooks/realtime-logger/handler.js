/**
 * Realtime Decision Logger
 * 
 * Triggers on command:new to capture session decisions before reset.
 * Since sessions last days, session:end rarely fires - this is the safety net.
 */

const fs = require('fs');
const path = require('path');

function findLearningDir(event) {
  const workspace = event.workspace || process.env.OPENCLAW_WORKSPACE || 
    path.join(process.env.HOME, '.openclaw', 'workspace');
  return path.join(workspace, 'learning');
}

function safeParseJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultValue;
  }
}

function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('[realtime-logger] Write error:', e.message);
    return false;
  }
}

function generateId(prefix = 'dec') {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${rand}`;
}

function updateStatus(learningDir, metric, count = 1) {
  try {
    const statusFile = path.join(learningDir, 'status.json');
    const status = safeParseJSON(statusFile, { metrics: {} });
    status.metrics = status.metrics || {};
    status.metrics[metric] = (status.metrics[metric] || 0) + count;
    status.last_updated = new Date().toISOString();
    safeWriteJSON(statusFile, status);
  } catch (e) {
    // Fail silently
  }
}

module.exports = async function realtimeLoggerHook(event) {
  try {
    // Trigger on command:new (before session reset)
    if (event.type !== 'command' || event.action !== 'new') {
      return;
    }

    const learningDir = findLearningDir(event);
    if (!fs.existsSync(learningDir)) {
      return; // Not installed
    }

    // Log that a session is ending via /new
    const today = new Date().toISOString().split('T')[0];
    const eventsDir = path.join(learningDir, 'events');
    const eventsFile = path.join(eventsDir, `${today}.json`);
    
    const events = safeParseJSON(eventsFile, []);
    
    events.push({
      id: generateId('evt'),
      timestamp: new Date().toISOString(),
      type: 'session_reset',
      trigger: 'command:new',
      session_key: event.sessionKey || null,
      context: {
        reason: 'User issued /new command',
        compaction_count: event.compactionCount || 'unknown'
      }
    });
    
    safeWriteJSON(eventsFile, events);
    updateStatus(learningDir, 'events_logged', 1);

    // Log a decision marker
    const decisionsDir = path.join(learningDir, 'decisions');
    const decisionsFile = path.join(decisionsDir, `${today}.json`);
    
    const decisions = safeParseJSON(decisionsFile, []);
    
    decisions.push({
      id: generateId('dec'),
      timestamp: new Date().toISOString(),
      type: 'session_boundary',
      session_key: event.sessionKey || null,
      context: 'Session reset via /new - decisions in this session should be reviewed',
      outcome: { status: 'boundary_marker' }
    });
    
    safeWriteJSON(decisionsFile, decisions);
    updateStatus(learningDir, 'decisions_logged', 1);

    console.log('[realtime-logger] Logged session reset event');

  } catch (error) {
    console.error('[realtime-logger] Error:', error.message);
  }
};
