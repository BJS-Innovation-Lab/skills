#!/usr/bin/env node
/**
 * A2A Daemon - Persistent WebSocket connection to A2A Relay
 * 
 * Features:
 * - Auto-reconnect on disconnect
 * - Heartbeat every 30s
 * - Message queue for outbound
 * - Logs incoming messages to file for OpenClaw to read
 * - IPC via Unix socket for sending messages
 */

const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const net = require('net');
const memoryLogger = require('./memory-logger');

// ============== CONFIG ==============
const RELAY_URL = process.env.A2A_RELAY_URL || 'https://a2a-bjs-internal-skill-production.up.railway.app';
const AGENT_ID = process.env.A2A_AGENT_ID;
const AGENT_NAME = process.env.A2A_AGENT_NAME;

if (!AGENT_ID || !AGENT_NAME) {
  console.error('❌ FATAL: A2A_AGENT_ID and A2A_AGENT_NAME must be set.');
  console.error('   Set them in your daemon config or environment:');
  console.error('   export A2A_AGENT_ID="your-agent-uuid"');
  console.error('   export A2A_AGENT_NAME="YourName"');
  process.exit(1);
}
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_DELAY = 5000; // 5 seconds

// Paths
const DATA_DIR = process.env.A2A_DATA_DIR || path.join(process.env.HOME, '.openclaw', 'a2a');
const INBOX_FILE = path.join(DATA_DIR, 'inbox.json');
const STATUS_FILE = path.join(DATA_DIR, 'status.json');
const LOG_FILE = path.join(DATA_DIR, 'daemon.log');
const SOCKET_PATH = path.join(DATA_DIR, 'daemon.sock');
const PID_FILE = path.join(DATA_DIR, 'daemon.pid');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============== LOGGING ==============
function log(msg, data = null) {
  const timestamp = new Date().toISOString();
  const line = data 
    ? `[${timestamp}] ${msg} ${JSON.stringify(data)}`
    : `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ============== STATUS ==============
let status = {
  connected: false,
  lastConnected: null,
  lastDisconnected: null,
  lastHeartbeat: null,
  messagesReceived: 0,
  messagesSent: 0,
  reconnectAttempts: 0
};

function updateStatus(updates) {
  status = { ...status, ...updates, updatedAt: new Date().toISOString() };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

// ============== INBOX ==============
let inbox = [];

function loadInbox() {
  try {
    if (fs.existsSync(INBOX_FILE)) {
      inbox = JSON.parse(fs.readFileSync(INBOX_FILE, 'utf8'));
    }
  } catch (e) {
    inbox = [];
  }
}

function saveInbox() {
  fs.writeFileSync(INBOX_FILE, JSON.stringify(inbox, null, 2));
}

const MAX_INBOX_SIZE = 100; // Keep last 100 messages

function addToInbox(message) {
  inbox.push({
    ...message,
    receivedAt: new Date().toISOString(),
    read: false
  });
  
  // Trim inbox to prevent infinite growth
  if (inbox.length > MAX_INBOX_SIZE) {
    inbox = inbox.slice(-MAX_INBOX_SIZE);
    log('🧹 Inbox trimmed to last ' + MAX_INBOX_SIZE + ' messages');
  }
  
  saveInbox();
  log('📨 Message received', { from: message.fromName, subject: message.subject });
  
  // Write notification for OpenClaw to pick up and send to Telegram
  addNotification(message);
}

// ============== NOTIFICATIONS ==============
const NOTIFY_FILE = path.join(DATA_DIR, 'notifications.json');

// Telegram config for instant notifications
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5165191591';
const TELEGRAM_AGENT_TAG = process.env.TELEGRAM_AGENT_TAG || '@sam_ctxt_bot';

async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN) {
    log('⚠️ No TELEGRAM_BOT_TOKEN set, skipping instant notification');
    return;
  }
  
  const priorityEmoji = { low: '⚪', normal: '🔵', high: '🟠', urgent: '🔴' };
  const typeEmoji = { task: '📋', response: '💬', notification: '🔔', query: '❓' };
  
  const text = `${TELEGRAM_AGENT_TAG} 📨 mensaje de ${message.fromName}
━━━━━━━━━━━━━━━━━━
${typeEmoji[message.type] || '📋'} Tipo: ${message.type || 'task'}
${priorityEmoji[message.priority] || '🔵'} Prioridad: ${message.priority || 'normal'}
📝 Asunto: ${message.subject || 'Sin asunto'}
━━━━━━━━━━━━━━━━━━
Revisa tu inbox A2A`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
    const result = await response.json();
    if (result.ok) {
      log('📱 Telegram notification sent instantly!');
    } else {
      log('❌ Telegram notification failed', result);
    }
  } catch (err) {
    log('❌ Telegram error', { error: err.message });
  }
}

function addNotification(message) {
  let notifications = [];
  try {
    if (fs.existsSync(NOTIFY_FILE)) {
      notifications = JSON.parse(fs.readFileSync(NOTIFY_FILE, 'utf8'));
    }
  } catch (e) {
    notifications = [];
  }
  
  notifications.push({
    id: message.id,
    from: message.fromName,
    to: AGENT_NAME,
    type: message.type || 'task',
    subject: message.subject || 'Sin asunto',
    priority: message.priority || 'normal',
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(NOTIFY_FILE, JSON.stringify(notifications, null, 2));
  log('🔔 Notification queued for Telegram');
  
  // Send instant Telegram notification
  sendTelegramNotification(message);
  
  // Trigger OpenClaw wake for immediate processing
  triggerOpenClawWake(message);
}

const WAKE_MAX_RETRIES = 3;
const WAKE_RETRY_DELAY = 2000; // 2 seconds

async function triggerOpenClawWake(message, attempt = 1) {
  const { exec } = require('child_process');
  
  // Build context-rich wake message
  const contentPreview = typeof message.content === 'string' 
    ? message.content.slice(0, 300)
    : JSON.stringify(message.content).slice(0, 300);
  
  const priorityEmoji = { low: '⚪', normal: '🔵', high: '🟠', urgent: '🔴' };
  const pEmoji = priorityEmoji[message.priority] || '🔵';
  
  const wakeText = `[A2A] 📨 Message from ${message.fromName} | ${message.subject || 'No subject'} | ${pEmoji} ${message.priority || 'normal'} — Check A2A inbox for full message.`;
  
  // IMPORTANT: Use system event, NOT agent --message
  // agent --message creates an isolated session that auto-responds with incomplete context
  // system event queues a notification for the MAIN session to see on next heartbeat/interaction
  //
  // For high-priority messages, use --mode now to wake immediately
  // For normal priority, use next-heartbeat to avoid interrupting
  const wakeMode = (message.priority === 'high' || message.priority === 'urgent') ? 'now' : 'next-heartbeat';
  
  const escapedText = wakeText.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const cmd = `openclaw system event --text "${escapedText}" --mode ${wakeMode} --json`;
  
  log('🔗 Triggering OpenClaw via system event...', { mode: wakeMode, attempt });
  
  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) {
      log('⚠️ OpenClaw system event failed', { error: err.message, attempt, stderr: stderr?.slice(0, 200) });
      
      // Retry logic
      if (attempt < WAKE_MAX_RETRIES) {
        log(`🔄 Retrying wake in ${WAKE_RETRY_DELAY/1000}s... (attempt ${attempt + 1}/${WAKE_MAX_RETRIES})`);
        setTimeout(() => triggerOpenClawWake(message, attempt + 1), WAKE_RETRY_DELAY);
      } else {
        log('❌ All wake attempts failed, writing fallback file');
        triggerWakeViaFile(wakeText);
      }
    } else {
      log('⚡ OpenClaw system event queued!', { mode: wakeMode, stdout: stdout?.slice(0, 200) });
    }
  });
}

function triggerWakeViaFile(wakeText) {
  // Fallback: write wake file for manual pickup
  const wakeFile = path.join(DATA_DIR, 'wake.json');
  fs.writeFileSync(wakeFile, JSON.stringify({
    text: wakeText,
    timestamp: new Date().toISOString()
  }, null, 2));
  log('📄 Wake file written as fallback');
}

// ============== SOCKET.IO CLIENT ==============
let socket = null;
let heartbeatTimer = null;

function connect() {
  log(`🔗 Connecting to ${RELAY_URL}...`);
  
  socket = io(RELAY_URL, {
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAY,
    reconnectionAttempts: Infinity,
    timeout: 10000
  });

  socket.on('connect', () => {
    log('✅ Connected to relay');
    updateStatus({ 
      connected: true, 
      lastConnected: new Date().toISOString(),
      reconnectAttempts: 0
    });
    
    // Register
    socket.emit('register', { agentId: AGENT_ID, agentName: AGENT_NAME });
    
    // Start heartbeat
    startHeartbeat();
  });

  socket.on('registered', (data) => {
    log('📝 Registered', data);
    if (data.queuedMessages > 0) {
      log(`📬 ${data.queuedMessages} queued messages delivered`);
    }
  });

  socket.on('message', (msg) => {
    addToInbox(msg);
    memoryLogger.logReceived(msg);
    updateStatus({ messagesReceived: status.messagesReceived + 1 });
  });

  socket.on('sent', (data) => {
    log('📤 Message sent', data);
    updateStatus({ messagesSent: status.messagesSent + 1 });
  });

  socket.on('agent_status', (data) => {
    const state = data.online ? '🟢 online' : '🔴 offline';
    log(`👤 ${data.name} is now ${state}`);
  });

  socket.on('error', (err) => {
    log('❌ Error', { message: err.message || err });
  });

  socket.on('disconnect', (reason) => {
    log('🔌 Disconnected', { reason });
    updateStatus({ 
      connected: false, 
      lastDisconnected: new Date().toISOString() 
    });
    stopHeartbeat();
  });

  socket.on('connect_error', (err) => {
    updateStatus({ reconnectAttempts: status.reconnectAttempts + 1 });
    log('❌ Connection error', { 
      message: err.message, 
      attempts: status.reconnectAttempts 
    });
  });
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('heartbeat', { agentId: AGENT_ID, timestamp: Date.now() });
      updateStatus({ lastHeartbeat: new Date().toISOString() });
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ============== IPC SERVER (Unix Socket) ==============
function startIpcServer() {
  // Remove old socket file
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }

  const server = net.createServer((client) => {
    let buffer = '';
    
    client.on('data', (data) => {
      buffer += data.toString();
      
      // Process complete JSON messages (newline delimited)
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const cmd = JSON.parse(line);
          handleIpcCommand(cmd, client);
        } catch (e) {
          client.write(JSON.stringify({ error: 'Invalid JSON' }) + '\n');
        }
      }
    });
  });

  server.listen(SOCKET_PATH, () => {
    log(`🔌 IPC server listening on ${SOCKET_PATH}`);
    fs.chmodSync(SOCKET_PATH, '600');
  });

  server.on('error', (err) => {
    log('❌ IPC server error', { message: err.message });
  });
}

function handleIpcCommand(cmd, client) {
  switch (cmd.action) {
    case 'status':
      client.write(JSON.stringify({ ...status, inbox: inbox.length }) + '\n');
      break;
      
    case 'send':
      if (socket && socket.connected) {
        const sendPayload = {
          to: cmd.to,
          content: cmd.content,
          type: cmd.type || 'task',
          subject: cmd.subject || null,
          priority: cmd.priority || 'normal'
        };
        socket.emit('send', sendPayload);
        memoryLogger.logSent(cmd.to, cmd.toName || cmd.to, cmd.content, sendPayload.type, sendPayload.subject, sendPayload.priority);
        client.write(JSON.stringify({ ok: true, queued: false }) + '\n');
      } else {
        client.write(JSON.stringify({ ok: false, error: 'Not connected' }) + '\n');
      }
      break;
      
    case 'inbox':
      client.write(JSON.stringify({ messages: inbox }) + '\n');
      break;
      
    case 'ack':
      if (cmd.messageId) {
        inbox = inbox.filter(m => m.id !== cmd.messageId);
      } else if (cmd.all) {
        inbox = [];
      }
      saveInbox();
      client.write(JSON.stringify({ ok: true, remaining: inbox.length }) + '\n');
      break;
      
    case 'ping':
      client.write(JSON.stringify({ pong: true, timestamp: Date.now() }) + '\n');
      break;
      
    default:
      client.write(JSON.stringify({ error: 'Unknown action' }) + '\n');
  }
}

// ============== MAIN ==============
function main() {
  // Write PID file
  fs.writeFileSync(PID_FILE, process.pid.toString());
  
  log('🚀 A2A Daemon starting...');
  log(`   Agent: ${AGENT_NAME} (${AGENT_ID})`);
  log(`   Relay: ${RELAY_URL}`);
  log(`   Data:  ${DATA_DIR}`);
  
  // Load existing inbox
  loadInbox();
  log(`📬 Loaded ${inbox.length} messages from inbox`);
  
  // Initialize status
  updateStatus({ 
    startedAt: new Date().toISOString(),
    agentId: AGENT_ID,
    agentName: AGENT_NAME,
    relayUrl: RELAY_URL
  });
  
  // Initialize memory logger
  memoryLogger.init();
  
  // Connect to relay
  connect();
  
  // Start IPC server
  startIpcServer();
  
  // Clean up old threads daily
  setInterval(() => memoryLogger.cleanupThreads(3), 24 * 60 * 60 * 1000);
  
  // Handle shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  log('✅ A2A Daemon running (Ctrl+C to stop)');
}

function shutdown() {
  log('👋 Shutting down...');
  stopHeartbeat();
  
  if (socket) {
    socket.disconnect();
  }
  
  // Cleanup
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  
  updateStatus({ connected: false, stoppedAt: new Date().toISOString() });
  log('✅ Daemon stopped');
  process.exit(0);
}

main();
