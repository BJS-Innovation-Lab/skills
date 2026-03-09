#!/usr/bin/env node
/**
 * Frontier Lab Realtime Listener
 * 
 * Subscribes to Supabase Realtime for instant message processing.
 * When a frontier-lab message arrives, immediately calls AI and responds.
 * 
 * Usage: 
 *   AGENT_ID=vulki-tester AGENT_NAME="Vulki Tester" node realtime-listener.cjs
 * 
 * Run as a background daemon on Railway for real-time responses.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_NAME = process.env.AGENT_NAME || AGENT_ID;

// Gateway config - can be provided or looked up
let GATEWAY_URL = process.env.GATEWAY_URL;
let GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY || !AGENT_ID) {
  console.error('[Realtime] Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, AGENT_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    console.log(`[Realtime] Config from known_agents: ${GATEWAY_URL}`);
    return true;
  }

  // Try agents table
  const { data: agents } = await supabase
    .from('agents')
    .select('metadata, gateway_token')
    .or(`id.eq.${AGENT_ID},name.ilike.*${AGENT_ID}*`)
    .limit(1)
    .single();

  if (agents?.metadata?.gateway_url) {
    GATEWAY_URL = agents.metadata.gateway_url;
    GATEWAY_TOKEN = agents.metadata.gateway_token || agents.gateway_token;
    console.log(`[Realtime] Config from agents table: ${GATEWAY_URL}`);
    return true;
  }

  return false;
}

async function callAgentAI(sessionContext, humanMessage) {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN');
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

  console.log(`[Realtime] Calling AI...`);

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
    const errText = await response.text().catch(() => 'Unknown error');
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

  const history = messages
    .reverse()
    .map(m => `[${m.sender_name}]: ${m.content?.substring(0, 200)}`)
    .join('\n');

  return `Recent conversation:\n${history}`;
}

async function handleMessage(payload) {
  const { new: msg } = payload;
  
  if (!msg || msg.to_agent !== AGENT_ID) return;
  if (msg.from_agent !== 'frontier-lab') return;
  
  const metadata = msg.metadata || {};
  if (metadata.type !== 'frontier_message') return;

  console.log(`[Realtime] 📨 New message in session: ${metadata.session_name || 'Unknown'}`);
  console.log(`[Realtime] Human: ${metadata.content?.substring(0, 100)}...`);

  // Mark as read immediately
  await supabase
    .from('agent_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', msg.id);

  try {
    const sessionContext = metadata.session_id 
      ? await getSessionContext(metadata.session_id)
      : '';

    const contextStr = metadata.session_name 
      ? `Session: "${metadata.session_name}"\n${sessionContext}`
      : sessionContext;

    const response = await callAgentAI(contextStr, metadata.content || '');

    if (metadata.respond_url && response) {
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
        console.log(`[Realtime] ✅ Response sent!`);
      } else {
        console.error(`[Realtime] ❌ Failed to send:`, await postRes.text());
      }
    }
  } catch (err) {
    console.error(`[Realtime] ❌ Error:`, err.message);
    
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

async function main() {
  console.log(`[Realtime] 🚀 Starting listener for ${AGENT_NAME} (${AGENT_ID})`);
  
  const hasConfig = await lookupAgentConfig();
  if (!hasConfig) {
    console.error('[Realtime] Could not find gateway config. Set GATEWAY_URL and GATEWAY_TOKEN.');
    process.exit(1);
  }

  // Subscribe to agent_messages for this agent
  const channel = supabase
    .channel('frontier-lab-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_messages',
        filter: `to_agent=eq.${AGENT_ID}`,
      },
      handleMessage
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] ✅ Listening for messages...`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] ❌ Channel error - check RLS policies`);
      } else {
        console.log(`[Realtime] Status: ${status}`);
      }
    });

  // Keep alive
  console.log(`[Realtime] 💓 Daemon running. Press Ctrl+C to stop.`);
  
  // Heartbeat log every 5 minutes
  setInterval(() => {
    console.log(`[Realtime] 💓 Still listening... (${new Date().toISOString()})`);
  }, 5 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Realtime] Shutting down...');
    channel.unsubscribe();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Realtime] Shutting down...');
    channel.unsubscribe();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[Realtime] Fatal error:', err);
  process.exit(1);
});
