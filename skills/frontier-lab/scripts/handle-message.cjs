#!/usr/bin/env node
/**
 * Frontier Lab Message Handler
 * 
 * Checks for pending Frontier Lab messages and responds to them.
 * Run this in agent's heartbeat to enable real-time Frontier Lab responses.
 * 
 * Usage: AGENT_ID=vulki AGENT_NAME="Vulki Tester" node handle-message.cjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const AGENT_ID = process.env.AGENT_ID;
const AGENT_NAME = process.env.AGENT_NAME || AGENT_ID;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[Frontier Lab] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!AGENT_ID) {
    console.error('[Frontier Lab] Missing AGENT_ID env var');
    process.exit(1);
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
      continue;
    }

    const respondUrl = metadata.respond_url;
    const sessionId = metadata.session_id;
    const humanMessage = metadata.content || msg.message || '';

    console.log(`[Frontier Lab] Processing message for session ${sessionId}`);
    console.log(`[Frontier Lab] Human said: ${humanMessage.substring(0, 100)}...`);

    // Generate a response (this is where the agent would use AI)
    // For now, we'll create a placeholder that the agent can customize
    const response = await generateResponse(humanMessage, AGENT_NAME);

    if (respondUrl) {
      // POST response back to Frontier Lab
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
        console.log(`[Frontier Lab] ✅ Response sent to session ${sessionId}`);
      } else {
        console.error(`[Frontier Lab] ❌ Failed to send response:`, await postRes.text());
      }
    }

    // Mark message as read
    await fetch(`${SUPABASE_URL}/rest/v1/agent_messages?id=eq.${msg.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ read: true }),
    });
  }
}

async function generateResponse(humanMessage, agentName) {
  // Simple response generation - agents can customize this
  const lowerMsg = humanMessage.toLowerCase();
  
  if (lowerMsg.includes('party') || lowerMsg.includes('celebration')) {
    return `Sounds fun! I can help plan the logistics. What's our budget? - ${agentName}`;
  }
  if (lowerMsg.includes('beach') || lowerMsg.includes('outdoor')) {
    return `Great idea! I'll check the weather forecast and suggest some dates. - ${agentName}`;
  }
  if (lowerMsg.includes('food') || lowerMsg.includes('catering')) {
    return `I can research catering options! Any dietary restrictions we should consider? - ${agentName}`;
  }
  if (lowerMsg.includes('help') || lowerMsg.includes('?')) {
    return `I'm here to help! What do you need? - ${agentName}`;
  }
  
  return `Got it! I'm on it. - ${agentName}`;
}

main().catch(err => {
  console.error('[Frontier Lab] Error:', err);
  process.exit(1);
});
