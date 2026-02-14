/**
 * Event Logger Hook
 * 
 * Captures significant events and logs them to the unified event store.
 */

const fs = require('fs');
const path = require('path');

// Find the learning directory relative to workspace
function findLearningDir(event) {
  // Try to get workspace from event context
  const workspace = event.workspace || process.env.OPENCLAW_WORKSPACE || process.cwd();
  return path.join(workspace, 'learning');
}

// Load config
function loadConfig(learningDir) {
  const configPath = path.join(learningDir, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return { event_logger: { enabled: false } };
  }
  
  // Simple YAML parsing for our config
  const content = fs.readFileSync(configPath, 'utf-8');
  const enabled = content.includes('event_logger:') && content.includes('enabled: true');
  const logAll = content.includes('log_all: true');
  
  return {
    event_logger: {
      enabled,
      log_all: logAll
    }
  };
}

// Main hook handler
module.exports = async function eventLoggerHook(event) {
  try {
    const learningDir = findLearningDir(event);
    
    // Check if learning directory exists
    if (!fs.existsSync(learningDir)) {
      return; // Not installed yet
    }

    // Load config
    const config = loadConfig(learningDir);
    if (!config.event_logger?.enabled) {
      return; // Disabled
    }

    // Determine if event is significant
    const isSignificant = isSignificantEvent(event, config);
    if (!config.event_logger.log_all && !isSignificant) {
      return; // Skip non-significant events
    }

    // Build event record
    const eventRecord = {
      id: generateEventId(event.type),
      timestamp: new Date().toISOString(),
      type: mapEventType(event.type, event.action),
      action: event.action || null,
      source: 'hook',
      session_key: event.sessionKey || null,
      context: extractContext(event),
      data: extractData(event),
      outcome: { status: 'logged' }
    };

    // Append to event log
    const eventsFile = path.join(learningDir, 'events', 'events.jsonl');
    fs.appendFileSync(eventsFile, JSON.stringify(eventRecord) + '\n');

    // Update status
    updateStatus(learningDir, 'events_logged');

  } catch (error) {
    // Fail silently - don't break the agent
    console.error('[event-logger] Error:', error.message);
  }
};

function generateEventId(type) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `evt_${type || 'unknown'}_${timestamp}_${random}`;
}

function isSignificantEvent(event, config) {
  // Session events are always significant
  if (event.type === 'session') return true;
  
  // Command events (new, reset) are significant
  if (event.type === 'command' && ['new', 'reset'].includes(event.action)) return true;
  
  // Agent bootstrap is significant
  if (event.type === 'agent' && event.action === 'bootstrap') return true;
  
  return false;
}

function mapEventType(type, action) {
  if (type === 'session') return 'session';
  if (type === 'command') return 'command';
  if (type === 'agent') return 'agent';
  return type || 'unknown';
}

function extractContext(event) {
  return {
    hook_type: event.type,
    hook_action: event.action,
    agent_id: event.agentId || null,
    has_messages: !!(event.messages?.length)
  };
}

function extractData(event) {
  // Don't include full message content for privacy
  return {
    event_type: event.type,
    event_action: event.action,
    timestamp: new Date().toISOString()
  };
}

function updateStatus(learningDir, metric) {
  try {
    const statusFile = path.join(learningDir, 'status.json');
    if (!fs.existsSync(statusFile)) return;
    
    const status = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
    status.metrics[metric] = (status.metrics[metric] || 0) + 1;
    status.last_updated = new Date().toISOString();
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  } catch (e) {
    // Ignore
  }
}
