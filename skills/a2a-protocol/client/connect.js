#!/usr/bin/env node
/**
 * A2A Relay Client - Connect agent to the relay server
 * Usage: node connect.js --agent-id <id> --agent-name <name> --relay-url <url>
 */

const { io } = require('socket.io-client');

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const AGENT_ID = getArg('agent-id') || process.env.A2A_AGENT_ID;
const AGENT_NAME = getArg('agent-name') || process.env.A2A_AGENT_NAME || 'Unknown';
const RELAY_URL = getArg('relay-url') || process.env.A2A_RELAY_URL || 'http://localhost:3000';

if (!AGENT_ID) {
  console.error('❌ Error: --agent-id or A2A_AGENT_ID required');
  process.exit(1);
}

console.log(`🔗 Connecting to A2A Relay: ${RELAY_URL}`);
console.log(`🤖 Agent: ${AGENT_NAME} (${AGENT_ID})`);

const socket = io(RELAY_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity
});

socket.on('connect', () => {
  console.log('✅ Connected to relay');
  socket.emit('register', { agentId: AGENT_ID, agentName: AGENT_NAME });
});

socket.on('registered', (data) => {
  console.log(`📝 Registered! Queued messages: ${data.queuedMessages}`);
  if (data.connectedAgents?.length > 0) {
    console.log('👥 Online agents:', data.connectedAgents.map(a => a.name).join(', '));
  }
});

socket.on('message', (msg) => {
  console.log(`\n📨 ════════════════════════════════════`);
  console.log(`   From: ${msg.fromName} (${msg.from})`);
  console.log(`   Type: ${msg.type} | Priority: ${msg.priority}`);
  if (msg.subject) console.log(`   Subject: ${msg.subject}`);
  console.log(`   Content: ${JSON.stringify(msg.content, null, 2)}`);
  console.log(`   Time: ${msg.timestamp}`);
  console.log(`════════════════════════════════════════\n`);
});

socket.on('sent', (data) => {
  const status = data.delivered ? '✅ Delivered' : '📥 Queued';
  console.log(`${status} (${data.messageId})`);
});

socket.on('agent_status', (data) => {
  const status = data.online ? '🟢 online' : '🔴 offline';
  console.log(`👤 ${data.name} is now ${status}`);
});

socket.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from relay');
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});

// Keep process running
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('📡 Listening for messages... (Ctrl+C to exit)\n');
