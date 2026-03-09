#!/usr/bin/env node
/**
 * Agent Messaging System
 * CLI + Realtime daemon for agent-to-agent messaging
 * 
 * Usage:
 *   node agent-messaging.cjs send <to> <message> [--subject "..."] [--priority high]
 *   node agent-messaging.cjs inbox [--unread]
 *   node agent-messaging.cjs read <message_id>
 *   node agent-messaging.cjs listen  (realtime subscription - handles Frontier Lab!)
 * 
 * The `listen` command now auto-responds to Frontier Lab messages using real AI.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../rag/.env') });
const { createClient } = require('@supabase/supabase-js');

const AGENT_ID = process.env.AGENT_ID || 'sybil';
const AGENT_NAME = process.env.AGENT_NAME || AGENT_ID;
const CLIENT_ID = process.env.CLIENT_ID || 'vulkn-internal';

// Gateway config for AI calls (can be provided or looked up)
let GATEWAY_URL = process.env.GATEWAY_URL;
let GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============== FRONTIER LAB SUPPORT ==============

async function lookupAgentConfig() {
  if (GATEWAY_URL && GATEWAY_TOKEN) return true;

  // Try known_agents table
  const { data: known } = await supabase
    .from('known_agents')
    .select('webhook_url, webhook_token')
    .eq('agent_id', AGENT_ID)
    .limit(1)
    .single();

  if (known?.webhook_url) {
    const baseUrl = known.webhook_url.replace(/\/hooks\/agent$/, '');
    GATEWAY_URL = `${baseUrl}/v1/chat/completions`;
    GATEWAY_TOKEN = known.webhook_token;
    console.log(`[Config] Found gateway: ${GATEWAY_URL}`);
    return true;
  }

  // Try agents table
  const { data: agent } = await supabase
    .from('agents')
    .select('metadata, gateway_token')
    .or(`id.eq.${AGENT_ID},name.ilike.*${AGENT_ID}*`)
    .limit(1)
    .single();

  if (agent?.metadata?.gateway_url) {
    GATEWAY_URL = agent.metadata.gateway_url;
    GATEWAY_TOKEN = agent.metadata.gateway_token || agent.gateway_token;
    console.log(`[Config] Found gateway: ${GATEWAY_URL}`);
    return true;
  }

  return false;
}

async function callAgentAI(sessionContext, humanMessage) {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    throw new Error('No gateway config - cannot call AI');
  }

  const messages = [
    {
      role: 'system',
      content: `You are ${AGENT_NAME} participating in a Frontier Lab collaborative session.

${sessionContext}

Guidelines:
- You're in a multi-agent/human collaboration space
- Keep responses concise and actionable
- If asked to do something outside your expertise, say so
- Be helpful and collaborative`
    },
    {
      role: 'user',
      content: humanMessage
    }
  ];

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openclaw',
      messages,
      user: `frontier-lab-${AGENT_ID}`,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown');
    throw new Error(`AI call failed: ${response.status} - ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function getSessionContext(sessionId) {
  const { data: messages } = await supabase
    .from('frontier_messages')
    .select('sender_name, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!messages?.length) return '';

  return messages
    .reverse()
    .map(m => `[${m.sender_name}]: ${m.content?.substring(0, 200)}`)
    .join('\n');
}

async function handleFrontierLabMessage(msg) {
  const metadata = msg.metadata || {};
  
  console.log(`\n🧪 [Frontier Lab] Message in "${metadata.session_name || 'Unknown'}"`);
  console.log(`   Human: ${metadata.content?.substring(0, 80)}...`);

  // Mark as read immediately
  await supabase
    .from('agent_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', msg.id);

  try {
    // Get session context
    let context = metadata.session_name ? `Session: "${metadata.session_name}"` : '';
    if (metadata.session_id) {
      const history = await getSessionContext(metadata.session_id);
      if (history) context += `\n\nRecent conversation:\n${history}`;
    }

    // Call AI
    console.log(`   Calling AI...`);
    const response = await callAgentAI(context, metadata.content || '');
    console.log(`   AI responded: ${response.substring(0, 80)}...`);

    // POST back to Frontier Lab
    if (metadata.respond_url) {
      const postRes = await fetch(metadata.respond_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: response,
          senderType: 'agent',
          senderId: AGENT_ID,
          senderName: AGENT_NAME,
          messageType: 'message',
        }),
      });

      if (postRes.ok) {
        console.log(`   ✅ Response sent to Frontier Lab!`);
      } else {
        console.error(`   ❌ Failed to send:`, await postRes.text());
      }
    } else {
      console.log(`   ⚠️ No respond_url - response logged only`);
    }
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    
    // Send error to session
    if (metadata.respond_url) {
      await fetch(metadata.respond_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `⚠️ I encountered an error. Please try again. - ${AGENT_NAME}`,
          senderType: 'agent',
          senderId: AGENT_ID,
          senderName: AGENT_NAME,
          messageType: 'message',
        }),
      }).catch(() => {});
    }
  }
}

// ============== MESSAGING FUNCTIONS ==============

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
  console.log(`\n🚀 Agent Messaging Daemon`);
  console.log(`   Agent: ${AGENT_NAME} (${AGENT_ID})`);
  console.log(`   Frontier Lab: enabled`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Look up gateway config for Frontier Lab AI calls
  const hasGateway = await lookupAgentConfig();
  if (!hasGateway) {
    console.log(`⚠️  No gateway config found - Frontier Lab AI calls will fail`);
    console.log(`   Set GATEWAY_URL and GATEWAY_TOKEN env vars\n`);
  }

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
      async (payload) => {
        const msg = payload.new;
        
        // Check if this is a Frontier Lab message
        if (msg.from_agent === 'frontier-lab' && msg.metadata?.type === 'frontier_message') {
          await handleFrontierLabMessage(msg);
          return;
        }

        // Regular message - just log it
        console.log('\n🔔 New message!');
        console.log(`   From: ${msg.from_agent}`);
        console.log(`   Subject: ${msg.subject || '(no subject)'}`);
        console.log(`   ${msg.message?.substring(0, 100) || ''}...`);
        console.log(`   ID: ${msg.id}\n`);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Connected to Supabase Realtime`);
        console.log(`👂 Listening for messages...\n`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Channel error - check RLS policies`);
      } else {
        console.log(`Status: ${status}`);
      }
    });

  // Heartbeat every 5 minutes
  setInterval(() => {
    console.log(`💓 Still listening... (${new Date().toLocaleTimeString()})`);
  }, 5 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    supabase.removeChannel(channel);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nShutting down...');
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
