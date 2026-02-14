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

// ============== CONFIG ==============
const RELAY_URL = process.env.A2A_RELAY_URL || 'https://a2a-bjs-internal-skill-production.up.railway.app';
const AGENT_ID = process.env.A2A_AGENT_ID || '62bb0f39-2248-4b14-806d-1c498c654ee7';
const AGENT_NAME = process.env.A2A_AGENT_NAME || 'Sam';
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

function addToInbox(message) {
  inbox.push({
    ...message,
    receivedAt: new Date().toISOString(),
    read: false
  });
  saveInbox();
  log('📨 Message received', { from: message.fromName, subject: message.subject });
  
  // Write notification for OpenClaw to pick up and send to Telegram
  addNotification(message);
}

// ============== NOTIFICATIONS ==============
const NOTIFY_FILE = path.join(DATA_DIR, 'notifications.json');

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
        socket.emit('send', {
          to: cmd.to,
          content: cmd.content,
          type: cmd.type || 'task',
          subject: cmd.subject || null,
          priority: cmd.priority || 'normal'
        });
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
  
  // Connect to relay
  connect();
  
  // Start IPC server
  startIpcServer();
  
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
