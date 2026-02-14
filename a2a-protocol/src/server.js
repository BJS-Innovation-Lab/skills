require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// ============== CONFIG ==============
const PORT = process.env.PORT || 3000;
const VERSION = '1.3.1'; // Fix: Set online on register
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Telegram notifications
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5165191591';

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ============== STATE ==============
const connectedAgents = new Map(); // agentId -> { socket, name, connectedAt, activityState, currentTask }
const messageQueue = new Map();    // agentId -> [messages]
const agentRegistry = new Map();   // agentId -> { name, lastSeen, online, telegram, activityState, currentTask }
const deliveredMessages = new Set(); // Track delivered message IDs for deduplication
const MAX_DELIVERED_TRACKING = 5000; // Keep track of last 5000 message IDs

// Known BJS LABS agents with Telegram usernames
const KNOWN_AGENTS = {
  'f6198962-313d-4a39-89eb-72755602d468': { name: 'Sage', telegram: '@Sage_ctxt_Agent_bot' },
  '62bb0f39-2248-4b14-806d-1c498c654ee7': { name: 'Sam', telegram: '@sam_ctxt_bot' },
  '5fae1839-ab85-412c-acc0-033cbbbbd15b': { name: 'Sybil', telegram: '@sybil_ctxt_bot' },
  'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb': { name: 'Santos', telegram: '@santos_ctxt_bot' },
  '415a84a4-af9e-4c98-9d48-040834436e44': { name: 'Saber', telegram: '@saber_ctxt_bot' }
};

// Initialize known agents
Object.entries(KNOWN_AGENTS).forEach(([id, info]) => {
  agentRegistry.set(id, { ...info, lastSeen: null, online: false });
});

// ============== HELPERS ==============
function log(msg, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`, Object.keys(data).length ? JSON.stringify(data) : '');
}

function getAgentName(agentId) {
  return agentRegistry.get(agentId)?.name || KNOWN_AGENTS[agentId]?.name || agentId.slice(0, 8);
}

function getAgentTelegram(agentId) {
  return agentRegistry.get(agentId)?.telegram || KNOWN_AGENTS[agentId]?.telegram || null;
}

// ============== DEDUPLICATION ==============
function markMessageDelivered(messageId) {
  deliveredMessages.add(messageId);
  // Trim if too large (keep recent messages)
  if (deliveredMessages.size > MAX_DELIVERED_TRACKING) {
    const arr = Array.from(deliveredMessages);
    deliveredMessages.clear();
    arr.slice(-MAX_DELIVERED_TRACKING).forEach(id => deliveredMessages.add(id));
    log('🧹 Trimmed delivered messages tracking', { kept: deliveredMessages.size });
  }
}

function isMessageDelivered(messageId) {
  return deliveredMessages.has(messageId);
}

// ============== TELEGRAM NOTIFICATIONS ==============
async function sendTelegramNotification(toAgentId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    log('⚠️ Telegram notifications disabled (no token)');
    return;
  }

  const toTelegram = getAgentTelegram(toAgentId);
  const toName = getAgentName(toAgentId);
  const fromName = message.fromName;
  const priority = message.priority || 'normal';
  const type = message.type || 'task';
  const subject = message.subject || 'Sin asunto';

  // Priority emoji
  const priorityEmoji = {
    low: '⚪',
    normal: '🔵',
    high: '🟠',
    urgent: '🔴'
  }[priority] || '🔵';

  // Type emoji
  const typeEmoji = {
    task: '📋',
    response: '💬',
    notification: '🔔',
    query: '❓'
  }[type] || '📨';

  const text = `${toTelegram || toName} 📨 mensaje de ${fromName}
━━━━━━━━━━━━━━━━━━
${typeEmoji} Tipo: ${type}
${priorityEmoji} Prioridad: ${priority}
📝 Asunto: ${subject}
━━━━━━━━━━━━━━━━━━
Revisa tu inbox A2A`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      log(`📱 Telegram notification sent for ${toName}`);
    } else {
      log('❌ Telegram notification failed', result);
    }
  } catch (err) {
    log('❌ Telegram notification error', { error: err.message });
  }
}

// ============== SUPABASE LOGGING ==============
async function logToSupabase(event, data) {
  if (!supabase) return;
  try {
    if (event === 'message_sent' && data.message) {
      // Write to a2a_messages table (the one Control Center reads)
      await supabase.from('a2a_messages').insert({
        id: data.message.id,
        from_agent_id: data.message.from,
        to_agent_id: data.message.to,
        message_type: data.message.type || 'task',
        subject: data.message.subject || null,
        payload: data.message.content,
        priority: data.message.priority || 'normal',
        status: data.delivered ? 'delivered' : 'pending'
      });
      log('📊 Message logged to Supabase', { messageId: data.message.id });
    }
    if (event === 'message_delivered' && data.messageId) {
      await supabase.from('a2a_messages')
        .update({ status: 'delivered' })
        .eq('id', data.messageId);
    }
  } catch (err) {
    log('⚠️ Supabase log error', { error: err.message });
  }
}

// ============== SOCKET.IO ==============
io.on('connection', (socket) => {
  log('Socket connected', { socketId: socket.id });

  socket.on('register', ({ agentId, agentName, telegram }) => {
    if (!agentId) {
      socket.emit('error', { message: 'agentId required' });
      return;
    }

    const existingInfo = KNOWN_AGENTS[agentId] || {};
    
    connectedAgents.set(agentId, { 
      socket, 
      name: agentName || existingInfo.name || 'Unknown',
      connectedAt: new Date()
    });
    agentRegistry.set(agentId, { 
      name: agentName || existingInfo.name || 'Unknown',
      telegram: telegram || existingInfo.telegram || null,
      lastSeen: new Date(), 
      online: true 
    });

    socket.agentId = agentId;
    log(`Agent registered: ${getAgentName(agentId)}`, { agentId });

    // Update Supabase to set agent online
    if (supabase) {
      supabase.from('agents')
        .update({ 
          activity_state: 'online',
          last_heartbeat_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .then(() => log(`📡 Agent ${getAgentName(agentId)} set to online in Supabase`))
        .catch(() => {}); // Silent fail
    }

    // Send queued messages (with deduplication)
    const queued = messageQueue.get(agentId) || [];
    if (queued.length > 0) {
      const toDeliver = queued.filter(msg => !isMessageDelivered(msg.id));
      const skipped = queued.length - toDeliver.length;
      
      if (skipped > 0) {
        log(`⏭️ Skipped ${skipped} already-delivered messages for ${getAgentName(agentId)}`);
      }
      
      if (toDeliver.length > 0) {
        log(`📬 Delivering ${toDeliver.length} queued messages to ${getAgentName(agentId)}`);
        toDeliver.forEach(msg => {
          socket.emit('message', msg);
          markMessageDelivered(msg.id);
          logToSupabase('message_delivered', { messageId: msg.id });
        });
      }
      messageQueue.delete(agentId);
    }

    socket.emit('registered', { 
      agentId, 
      queuedMessages: queued.length,
      connectedAgents: Array.from(connectedAgents.keys()).map(id => ({
        id,
        name: getAgentName(id)
      }))
    });

    io.emit('agent_status', { agentId, name: getAgentName(agentId), online: true });
  });

  socket.on('send', async ({ to, content, type, subject, priority }) => {
    const from = socket.agentId;
    if (!from) {
      socket.emit('error', { message: 'Not registered. Call register first.' });
      return;
    }

    const message = {
      id: uuidv4(),
      from,
      fromName: getAgentName(from),
      to,
      toName: getAgentName(to),
      content,
      type: type || 'task',
      subject: subject || null,
      priority: priority || 'normal',
      timestamp: new Date().toISOString()
    };

    const targetAgent = connectedAgents.get(to);
    
    if (targetAgent) {
      targetAgent.socket.emit('message', message);
      markMessageDelivered(message.id); // Track as delivered
      log(`✅ Message delivered: ${message.fromName} → ${message.toName}`, { messageId: message.id });
      await logToSupabase('message_sent', { message, delivered: true });
      // Still send Telegram notification even if delivered (agent might not be actively watching)
      await sendTelegramNotification(to, message);
      socket.emit('sent', { messageId: message.id, delivered: true });
    } else {
      const queue = messageQueue.get(to) || [];
      queue.push(message);
      messageQueue.set(to, queue);
      log(`📥 Message queued: ${message.fromName} → ${message.toName}`, { messageId: message.id, queueSize: queue.length });
      await logToSupabase('message_sent', { message, delivered: false });
      // Send Telegram notification
      await sendTelegramNotification(to, message);
      socket.emit('sent', { messageId: message.id, delivered: false, queued: true });
    }
  });

  // Handle heartbeat from agent - only update timestamp, not activity state
  // Activity state is managed by agents via explicit 'activity' events or update-activity.sh
  socket.on('heartbeat', async ({ agentId, timestamp, activityState, currentTask }) => {
    const agent = agentRegistry.get(agentId);
    if (agent) {
      agent.lastSeen = new Date();
      // Only update activity state if explicitly provided (not undefined)
      if (activityState !== undefined) {
        agent.activityState = activityState;
      }
      if (currentTask !== undefined) {
        agent.currentTask = currentTask;
      }
    }
    
    // Build Supabase update - only include fields that were provided
    const supabaseUpdate = { last_heartbeat_at: new Date().toISOString() };
    if (activityState !== undefined) {
      supabaseUpdate.activity_state = activityState;
    }
    if (currentTask !== undefined) {
      supabaseUpdate.current_task = currentTask;
    }
    
    // Only broadcast activity if it was explicitly provided
    if (activityState !== undefined) {
      io.emit('agent_activity', { 
        agentId, 
        name: getAgentName(agentId), 
        activityState,
        currentTask: currentTask || null,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update Supabase agents table
    if (supabase && agentId) {
      try {
        await supabase.from('agents')
          .update(supabaseUpdate)
          .eq('id', agentId);
      } catch (err) {
        // Silent fail - don't spam logs
      }
    }
  });
  
  // Handle explicit activity state changes
  socket.on('activity', async ({ activityState, currentTask }) => {
    const agentId = socket.agentId;
    if (!agentId) return;
    
    const agent = agentRegistry.get(agentId);
    if (agent) {
      agent.activityState = activityState;
      agent.currentTask = currentTask;
    }
    
    // Broadcast to all agents
    io.emit('agent_activity', { 
      agentId, 
      name: getAgentName(agentId), 
      activityState,
      currentTask,
      timestamp: new Date().toISOString()
    });
    
    log(`🔄 Activity: ${getAgentName(agentId)} → ${activityState}`, { task: currentTask });
    
    // Update Supabase
    if (supabase) {
      try {
        await supabase.from('agents')
          .update({ 
            activity_state: activityState,
            current_task: currentTask,
            last_heartbeat_at: new Date().toISOString()
          })
          .eq('id', agentId);
      } catch (err) {
        // Silent fail
      }
    }
  });

  // Handle message ACK from agent
  socket.on('ack', ({ messageId }) => {
    if (messageId) {
      markMessageDelivered(messageId);
      log(`✅ ACK received for message ${messageId}`);
    }
  });

  socket.on('disconnect', async () => {
    const agentId = socket.agentId;
    if (agentId) {
      connectedAgents.delete(agentId);
      const agent = agentRegistry.get(agentId);
      if (agent) {
        agent.online = false;
        agent.lastSeen = new Date();
      }
      log(`🔌 Agent disconnected: ${getAgentName(agentId)}`);
      io.emit('agent_status', { agentId, name: getAgentName(agentId), online: false });
      
      // Update Supabase on disconnect
      if (supabase) {
        try {
          await supabase.from('agents')
            .update({ activity_state: 'offline' })
            .eq('id', agentId);
        } catch (err) {
          // Silent fail
        }
      }
    }
  });
});

// ============== REST API ==============

app.get('/', (req, res) => {
  res.json({
    service: 'A2A Relay Server',
    version: '1.1.0',
    status: 'running',
    features: ['websocket', 'rest', 'telegram-notifications'],
    agents: {
      connected: connectedAgents.size,
      registered: agentRegistry.size
    }
  });
});

app.get('/agents', (req, res) => {
  const agents = Array.from(agentRegistry.entries()).map(([id, info]) => ({
    id,
    name: info.name,
    telegram: info.telegram,
    online: connectedAgents.has(id),
    lastSeen: info.lastSeen,
    activityState: info.activityState || 'offline',
    currentTask: info.currentTask || null,
    queuedMessages: (messageQueue.get(id) || []).length
  }));
  res.json({ agents });
});

// Real-time activity status
app.get('/activity', (req, res) => {
  const activity = Array.from(agentRegistry.entries())
    .filter(([id]) => connectedAgents.has(id))
    .map(([id, info]) => ({
      id,
      name: info.name,
      activityState: info.activityState || 'online',
      currentTask: info.currentTask || null,
      lastSeen: info.lastSeen
    }));
  res.json({ agents: activity, timestamp: new Date().toISOString() });
});

app.post('/send', async (req, res) => {
  const { from, to, content, type, subject, priority } = req.body;
  
  if (!from || !to || !content) {
    return res.status(400).json({ error: 'from, to, and content are required' });
  }

  const message = {
    id: uuidv4(),
    from,
    fromName: getAgentName(from),
    to,
    toName: getAgentName(to),
    content,
    type: type || 'task',
    subject: subject || null,
    priority: priority || 'normal',
    timestamp: new Date().toISOString()
  };

  const targetAgent = connectedAgents.get(to);
  
  if (targetAgent) {
    targetAgent.socket.emit('message', message);
    log(`[REST] Message delivered: ${message.fromName} → ${message.toName}`);
    await logToSupabase('message_sent', { message, delivered: true });
    await sendTelegramNotification(to, message);
    res.json({ messageId: message.id, delivered: true, notified: true });
  } else {
    const queue = messageQueue.get(to) || [];
    queue.push(message);
    messageQueue.set(to, queue);
    log(`[REST] Message queued: ${message.fromName} → ${message.toName}`);
    await logToSupabase('message_sent', { message, delivered: false });
    await sendTelegramNotification(to, message);
    res.json({ messageId: message.id, delivered: false, queued: true, notified: true });
  }
});

app.get('/inbox/:agentId', (req, res) => {
  const { agentId } = req.params;
  const messages = messageQueue.get(agentId) || [];
  res.json({ agentId, messages, count: messages.length });
});

app.post('/inbox/:agentId/ack', (req, res) => {
  const { agentId } = req.params;
  const { messageIds } = req.body;
  
  if (messageIds && Array.isArray(messageIds)) {
    const queue = messageQueue.get(agentId) || [];
    const remaining = queue.filter(m => !messageIds.includes(m.id));
    messageQueue.set(agentId, remaining);
    res.json({ acknowledged: messageIds.length, remaining: remaining.length });
  } else {
    const count = (messageQueue.get(agentId) || []).length;
    messageQueue.delete(agentId);
    res.json({ acknowledged: count, remaining: 0 });
  }
});

app.get('/stats', (req, res) => {
  const totalQueued = Array.from(messageQueue.values()).reduce((sum, q) => sum + q.length, 0);
  res.json({
    connectedAgents: connectedAgents.size,
    registeredAgents: agentRegistry.size,
    queuedMessages: totalQueued,
    deliveredTracked: deliveredMessages.size,
    telegramEnabled: !!TELEGRAM_BOT_TOKEN,
    supabaseEnabled: !!supabase,
    agents: Array.from(agentRegistry.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      telegram: info.telegram,
      online: connectedAgents.has(id),
      lastSeen: info.lastSeen,
      queued: (messageQueue.get(id) || []).length
    }))
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: VERSION,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: connectedAgents.size,
    dedup: {
      tracked: deliveredMessages.size,
      max: MAX_DELIVERED_TRACKING
    }
  });
});

// Test endpoint - sends a test message between agents
app.post('/test/send', async (req, res) => {
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to agent IDs required' });
  }
  
  const testMessage = {
    id: uuidv4(),
    from,
    fromName: getAgentName(from),
    to,
    toName: getAgentName(to),
    content: { 
      type: 'test',
      body: `Test message at ${new Date().toISOString()}`,
      testId: uuidv4()
    },
    type: 'notification',
    subject: '🧪 A2A Test Message',
    priority: 'low',
    timestamp: new Date().toISOString()
  };
  
  const targetAgent = connectedAgents.get(to);
  const wasDelivered = !!targetAgent;
  
  if (targetAgent) {
    targetAgent.socket.emit('message', testMessage);
    markMessageDelivered(testMessage.id);
  } else {
    const queue = messageQueue.get(to) || [];
    queue.push(testMessage);
    messageQueue.set(to, queue);
  }
  
  res.json({
    success: true,
    messageId: testMessage.id,
    delivered: wasDelivered,
    queued: !wasDelivered,
    testId: testMessage.content.testId
  });
});

// Test endpoint - check if a message was delivered (dedup check)
app.get('/test/delivered/:messageId', (req, res) => {
  const { messageId } = req.params;
  res.json({
    messageId,
    delivered: isMessageDelivered(messageId),
    trackedTotal: deliveredMessages.size
  });
});

// ============== START ==============
httpServer.listen(PORT, () => {
  log(`🚀 A2A Relay Server v1.1.0 running on port ${PORT}`);
  log(`📡 WebSocket ready for agent connections`);
  log(`🔗 REST API available at http://localhost:${PORT}`);
  if (supabase) {
    log(`📊 Supabase logging enabled`);
  }
  if (TELEGRAM_BOT_TOKEN) {
    log(`📱 Telegram notifications enabled (chat: ${TELEGRAM_CHAT_ID})`);
  } else {
    log(`⚠️  Telegram notifications disabled (set TELEGRAM_BOT_TOKEN)`);
  }
});
