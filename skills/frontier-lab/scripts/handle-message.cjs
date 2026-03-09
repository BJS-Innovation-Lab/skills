#!/usr/bin/env node
/**
 * Frontier Lab Message Handler v2
 * 
 * Checks for pending Frontier Lab messages and responds using REAL AI.
 * Calls the agent's /v1/chat/completions endpoint (same as regular chat).
 * 
 * Usage: 
 *   AGENT_ID=vulki AGENT_NAME="Vulki Tester" node handle-message.cjs
 * 
 * Required env vars:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   - AGENT_ID (your agent's ID in the agents table)
 *   - AGENT_NAME (display name)
 *   - GATEWAY_URL (optional - will look up from DB if not set)
 *   - GATEWAY_TOKEN (optional - will look up from DB if not set)
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_NAME = process.env.AGENT_NAME || AGENT_ID;

// Can be provided directly or looked up from DB
let GATEWAY_URL = process.env.GATEWAY_URL;
let GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

async function lookupAgentConfig() {
  // Try known_agents table first (has webhook URLs)
  const knownUrl = `${SUPABASE_URL}/rest/v1/known_agents?agent_id=eq.${AGENT_ID}&limit=1`;
  const knownRes = await fetch(knownUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (knownRes.ok) {
    const known = await knownRes.json();
    if (known.length > 0 && known[0].webhook_url) {
      // Convert webhook URL to chat completions URL
      // webhook: https://xxx.railway.app/hooks/agent
      // chat:    https://xxx.railway.app/v1/chat/completions
      const webhookUrl = known[0].webhook_url;
      const baseUrl = webhookUrl.replace(/\/hooks\/agent$/, '');
      GATEWAY_URL = `${baseUrl}/v1/chat/completions`;
      GATEWAY_TOKEN = known[0].webhook_token;
      console.log(`[Frontier Lab] Found config in known_agents: ${GATEWAY_URL}`);
      return true;
    }
  }

  // Try agents table (has metadata.gateway_url)
  const agentsUrl = `${SUPABASE_URL}/rest/v1/agents?or=(id.eq.${AGENT_ID},name.ilike.*${AGENT_ID}*)&limit=1`;
  const agentsRes = await fetch(agentsUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (agentsRes.ok) {
    const agents = await agentsRes.json();
    if (agents.length > 0) {
      const agent = agents[0];
      if (agent.metadata?.gateway_url) {
        GATEWAY_URL = agent.metadata.gateway_url;
        GATEWAY_TOKEN = agent.metadata.gateway_token || agent.gateway_token;
        console.log(`[Frontier Lab] Found config in agents table: ${GATEWAY_URL}`);
        return true;
      }
      if (agent.agent_url && agent.gateway_token) {
        GATEWAY_URL = agent.agent_url.includes('/v1/chat') 
          ? agent.agent_url 
          : `${agent.agent_url}/v1/chat/completions`;
        GATEWAY_TOKEN = agent.gateway_token;
        console.log(`[Frontier Lab] Found config in agents table: ${GATEWAY_URL}`);
        return true;
      }
    }
  }

  return false;
}

async function callAgentAI(sessionContext, humanMessage) {
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN - cannot call AI');
  }

  // Build messages array
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

  console.log(`[Frontier Lab] Calling AI at ${GATEWAY_URL}...`);

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
    signal: AbortSignal.timeout(120000), // 2 min timeout
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`AI call failed: ${response.status} - ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('AI returned empty response');
  }

  return content;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[Frontier Lab] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!AGENT_ID) {
    console.error('[Frontier Lab] Missing AGENT_ID env var');
    process.exit(1);
  }

  // Look up gateway config if not provided
  if (!GATEWAY_URL || !GATEWAY_TOKEN) {
    const found = await lookupAgentConfig();
    if (!found) {
      console.error('[Frontier Lab] Could not find agent gateway config. Set GATEWAY_URL and GATEWAY_TOKEN env vars.');
      process.exit(1);
    }
  }

  // Check for unread frontier-lab messages
  const messagesUrl = `${SUPABASE_URL}/rest/v1/agent_messages?from_agent=eq.frontier-lab&to_agent=eq.${AGENT_ID}&read=eq.false&order=created_at.desc&limit=5`;
  
  const messagesRes = await fetch(messagesUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!messagesRes.ok) {
    console.error('[Frontier Lab] Failed to fetch messages:', await messagesRes.text());
    process.exit(1);
  }

  const messages = await messagesRes.json();
  
  if (messages.length === 0) {
    console.log('[Frontier Lab] No pending messages');
    process.exit(0);
  }

  console.log(`[Frontier Lab] Found ${messages.length} pending message(s)`);

  for (const msg of messages) {
    const metadata = msg.metadata || {};
    
    if (metadata.type !== 'frontier_message') {
      console.log(`[Frontier Lab] Skipping non-frontier message: ${msg.id}`);
      // Still mark as read to avoid buildup
      await markAsRead(msg.id);
      continue;
    }

    const respondUrl = metadata.respond_url;
    const sessionId = metadata.session_id;
    const sessionName = metadata.session_name || 'Frontier Lab Session';
    const humanMessage = metadata.content || '';

    console.log(`[Frontier Lab] Processing message for session: ${sessionName}`);
    console.log(`[Frontier Lab] Human said: ${humanMessage.substring(0, 100)}...`);

    // Mark message as read FIRST to prevent duplicates
    await markAsRead(msg.id);

    try {
      // Get session context (recent messages)
      const contextUrl = `${SUPABASE_URL}/rest/v1/frontier_messages?session_id=eq.${sessionId}&order=created_at.desc&limit=10`;
      const contextRes = await fetch(contextUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      let sessionContext = `Session: "${sessionName}"`;
      if (contextRes.ok) {
        const recentMsgs = await contextRes.json();
        if (recentMsgs.length > 0) {
          const history = recentMsgs
            .reverse()
            .map(m => `[${m.sender_name}]: ${m.content?.substring(0, 200)}`)
            .join('\n');
          sessionContext += `\n\nRecent conversation:\n${history}`;
        }
      }

      // Call the REAL AI
      const response = await callAgentAI(sessionContext, humanMessage);

      // POST response back to Frontier Lab
      if (respondUrl) {
        const postRes = await fetch(respondUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: response,
            senderType: 'agent',
            senderId: AGENT_ID,
            senderName: AGENT_NAME,
            messageType: 'message',
          }),
        });

        if (postRes.ok) {
          console.log(`[Frontier Lab] ✅ AI response sent to session "${sessionName}"`);
        } else {
          console.error(`[Frontier Lab] ❌ Failed to send response:`, await postRes.text());
        }
      }
    } catch (err) {
      console.error(`[Frontier Lab] ❌ Error processing message:`, err.message);
      
      // Send error message to session so humans know something went wrong
      if (respondUrl) {
        await fetch(respondUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `⚠️ I encountered an error processing that message. Please try again. - ${AGENT_NAME}`,
            senderType: 'agent',
            senderId: AGENT_ID,
            senderName: AGENT_NAME,
            messageType: 'message',
          }),
        }).catch(() => {});
      }
    }
  }
}

async function markAsRead(messageId) {
  await fetch(`${SUPABASE_URL}/rest/v1/agent_messages?id=eq.${messageId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ read: true, read_at: new Date().toISOString() }),
  });
}

main().catch(err => {
  console.error('[Frontier Lab] Fatal error:', err);
  process.exit(1);
});
