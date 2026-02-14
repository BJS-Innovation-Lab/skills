/**
 * Decision Logger Hook
 * 
 * Captures significant decisions from sessions.
 * Triggers on session:end to analyze the conversation.
 */

const fs = require('fs');
const path = require('path');

// Find the learning directory
function findLearningDir(event) {
  const workspace = event.workspace || process.env.OPENCLAW_WORKSPACE || process.cwd();
  return path.join(workspace, 'learning');
}

// Safe JSON parse
function safeParseJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultValue;
  }
}

// Safe file write
function safeWriteJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('[decision-logger] Write error:', e.message);
    return false;
  }
}

// Load config
function loadConfig(learningDir) {
  const configPath = path.join(learningDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return { decision_logger: { enabled: false } };
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return {
      decision_logger: {
        enabled: content.includes('decision_logger:') && 
                 content.match(/decision_logger:[\s\S]*?enabled:\s*true/),
        capture_reasoning: content.includes('capture_reasoning: true'),
        track_outcomes: content.includes('track_outcomes: true')
      }
    };
  } catch (e) {
    return { decision_logger: { enabled: false } };
  }
}

// Generate decision ID
function generateDecisionId() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `dec_${timestamp}_${random}`;
}

// Detect decisions from messages (simplified heuristic)
function detectDecisions(messages) {
  const decisions = [];
  
  if (!messages || !Array.isArray(messages)) return decisions;
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = typeof msg === 'string' ? msg : (msg.content || msg.text || '');
    const role = msg.role || 'unknown';
    
    // Look for decision indicators in assistant messages
    if (role === 'assistant') {
      // Tool calls are decisions
      if (msg.tool_calls || content.includes('antml:invoke')) {
        decisions.push({
          type: 'tool_call',
          context: content.slice(0, 200),
          index: i
        });
      }
      
      // Explicit choices
      if (content.match(/I('ll| will|'m going to|decided to|choosing to)/i)) {
        decisions.push({
          type: 'explicit_choice',
          context: content.slice(0, 200),
          index: i
        });
      }
    }
  }
  
  return decisions;
}

// Main hook handler
module.exports = async function decisionLoggerHook(event) {
  try {
    // Only trigger on session end
    if (event.type !== 'session' || event.action !== 'end') {
      return;
    }
    
    const learningDir = findLearningDir(event);
    
    // Check if learning directory exists
    if (!fs.existsSync(learningDir)) {
      return; // Not installed
    }

    // Load config
    const config = loadConfig(learningDir);
    if (!config.decision_logger?.enabled) {
      return; // Disabled
    }

    // Get messages from event (if available)
    const messages = event.messages || event.history || [];
    
    // Detect decisions
    const detected = detectDecisions(messages);
    
    if (detected.length === 0) {
      return; // No decisions detected
    }

    // Get today's file
    const today = new Date().toISOString().split('T')[0];
    const decisionsDir = path.join(learningDir, 'decisions');
    const todayFile = path.join(decisionsDir, `${today}.json`);
    
    // Load existing decisions
    const existing = safeParseJSON(todayFile, []);
    
    // Add new decisions
    for (const dec of detected) {
      existing.push({
        id: generateDecisionId(),
        timestamp: new Date().toISOString(),
        session_key: event.sessionKey || null,
        type: dec.type,
        context: dec.context,
        outcome: { status: 'pending' }
      });
    }
    
    // Save
    safeWriteJSON(todayFile, existing);
    
    // Update status
    updateStatus(learningDir, 'decisions_logged', detected.length);

  } catch (error) {
    // Fail silently
    console.error('[decision-logger] Error:', error.message);
  }
};

function updateStatus(learningDir, metric, count = 1) {
  try {
    const statusFile = path.join(learningDir, 'status.json');
    const status = safeParseJSON(statusFile, { metrics: {} });
    status.metrics[metric] = (status.metrics[metric] || 0) + count;
    status.last_updated = new Date().toISOString();
    safeWriteJSON(statusFile, status);
  } catch (e) {
    // Ignore
  }
}
