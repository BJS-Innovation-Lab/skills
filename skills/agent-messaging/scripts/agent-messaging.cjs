#!/usr/bin/env node
/**
 * Agent Messaging System
 * Simple CLI for sending/receiving messages between agents
 * 
 * Usage:
 *   node agent-messaging.cjs send <to> <message> [--subject "..."] [--priority high]
 *   node agent-messaging.cjs inbox [--unread]
 *   node agent-messaging.cjs read <message_id>
 *   node agent-messaging.cjs listen  (realtime subscription)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../rag/.env') });
const { createClient } = require('@supabase/supabase-js');

const AGENT_ID = process.env.AGENT_ID || 'sybil';
const CLIENT_ID = process.env.CLIENT_ID || 'vulkn-internal';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

async function sendMessage(toAgent, message, options = {}) {
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      from_agent: AGENT_ID,
      to_agent: toAgent,
      message: message,
      subject: options.subject || null,
      priority: options.priority || 'normal',
      message_type: options.type || 'message',
      client_id: CLIENT_ID,
      metadata: options.metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error.message);
    return null;
  }

  console.log(`✅ Message sent to ${toAgent}`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Time: ${data.created_at}`);
  return data;
}

async function getInbox(unreadOnly = false) {
  let query = supabase
    .from('agent_messages')
    .select('*')
    .eq('to_agent', AGENT_ID)
    .order('created_at', { ascending: false })
    .limit(20);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching inbox:', error.message);
    return [];
  }

  if (data.length === 0) {
    console.log('📭 No messages');
    return [];
  }

  console.log(`📬 ${data.length} message(s):\n`);
  data.forEach((msg, i) => {
    const status = msg.read ? '  ' : '🔵';
    const priority = msg.priority === 'urgent' ? '🔴' : msg.priority === 'high' ? '🟠' : '';
    console.log(`${status} ${priority} From: ${msg.from_agent}`);
    console.log(`   Subject: ${msg.subject || '(no subject)'}`);
    console.log(`   ${msg.message.substring(0, 80)}${msg.message.length > 80 ? '...' : ''}`);
    console.log(`   ID: ${msg.id} | ${new Date(msg.created_at).toLocaleString()}`);
    console.log('');
  });

  return data;
}

async function readMessage(messageId) {
  // Get the message
  const { data: msg, error: fetchError } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError) {
    console.error('Error fetching message:', fetchError.message);
    return null;
  }

  // Mark as read
  await supabase
    .from('agent_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', messageId);

  console.log('━'.repeat(50));
  console.log(`From: ${msg.from_agent}`);
  console.log(`To: ${msg.to_agent}`);
  console.log(`Subject: ${msg.subject || '(no subject)'}`);
  console.log(`Date: ${new Date(msg.created_at).toLocaleString()}`);
  console.log(`Priority: ${msg.priority}`);
  console.log('━'.repeat(50));
  console.log('');
  console.log(msg.message);
  console.log('');
  console.log('━'.repeat(50));

  return msg;
}

async function listenForMessages() {
  console.log(`👂 Listening for messages to ${AGENT_ID}...`);
  console.log('   Press Ctrl+C to stop\n');

  const channel = supabase
    .channel('agent-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_messages',
        filter: `to_agent=eq.${AGENT_ID}`
      },
      (payload) => {
        const msg = payload.new;
        console.log('\n🔔 New message!');
        console.log(`   From: ${msg.from_agent}`);
        console.log(`   Subject: ${msg.subject || '(no subject)'}`);
        console.log(`   ${msg.message.substring(0, 100)}...`);
        console.log(`   ID: ${msg.id}\n`);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\nStopping listener...');
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

async function getAllMessages(clientId = null) {
  // Admin function - see all messages
  let query = supabase
    .from('agent_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error:', error.message);
    return [];
  }

  console.log(`📊 ${data.length} messages:\n`);
  data.forEach(msg => {
    const status = msg.read ? '✓' : '•';
    console.log(`${status} ${msg.from_agent} → ${msg.to_agent}: ${msg.message.substring(0, 50)}...`);
  });

  return data;
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'send':
    const toAgent = args[1];
    const message = args[2];
    if (!toAgent || !message) {
      console.log('Usage: node agent-messaging.cjs send <to> <message>');
      process.exit(1);
    }
    // Parse options
    const options = {};
    for (let i = 3; i < args.length; i += 2) {
      if (args[i] === '--subject') options.subject = args[i + 1];
      if (args[i] === '--priority') options.priority = args[i + 1];
      if (args[i] === '--type') options.type = args[i + 1];
    }
    sendMessage(toAgent, message, options);
    break;

  case 'inbox':
    const unreadOnly = args.includes('--unread');
    getInbox(unreadOnly);
    break;

  case 'read':
    const msgId = args[1];
    if (!msgId) {
      console.log('Usage: node agent-messaging.cjs read <message_id>');
      process.exit(1);
    }
    readMessage(msgId);
    break;

  case 'listen':
    listenForMessages();
    break;

  case 'all':
    const filterClient = args[1];
    getAllMessages(filterClient);
    break;

  default:
    console.log(`
Agent Messaging System

Commands:
  send <to> <message>     Send a message to another agent
    --subject "..."       Add a subject line
    --priority high       Set priority (low/normal/high/urgent)
    
  inbox                   View your inbox
    --unread              Show only unread messages
    
  read <id>               Read a specific message (marks as read)
  
  listen                  Listen for new messages in realtime
  
  all [client_id]         View all messages (admin)

Environment:
  AGENT_ID=${AGENT_ID}
  CLIENT_ID=${CLIENT_ID}
`);
}
