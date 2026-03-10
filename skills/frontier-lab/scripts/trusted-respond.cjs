#!/usr/bin/env node
/**
 * Trusted Domain Responder for Frontier Lab
 * 
 * Validates respond_url against trusted pattern before POSTing.
 * This script should be called from the agent's hook handler.
 * 
 * Usage: 
 *   echo '{"respond_url": "...", "content": "Hello"}' | node trusted-respond.cjs "My response"
 *   node trusted-respond.cjs --url "https://..." --response "My response" --agent-id scout --agent-name Scout
 */

const TRUSTED_PATTERN = /^https:\/\/webchat-platform\.vercel\.app\/api\/frontier\/sessions\/[a-f0-9-]+\/messages$/;

async function trustedRespond(respondUrl, responseText, agentId, agentName) {
  // Validate trusted domain
  if (!TRUSTED_PATTERN.test(respondUrl)) {
    console.error(`❌ BLOCKED: ${respondUrl} does not match trusted pattern`);
    console.error(`   Only webchat-platform.vercel.app/api/frontier/sessions/*/messages allowed`);
    return false;
  }

  console.log(`✅ Trusted URL validated: ${respondUrl}`);

  const body = {
    content: responseText,
    senderType: 'agent',
    senderId: agentId,
    senderName: agentName,
    messageType: 'message',
  };

  try {
    const response = await fetch(respondUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Response sent! Message ID: ${result.id}`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`❌ POST failed: ${response.status} - ${errText}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Network error: ${err.message}`);
    return false;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  let respondUrl, responseText, agentId, agentName;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') respondUrl = args[++i];
    else if (args[i] === '--response') responseText = args[++i];
    else if (args[i] === '--agent-id') agentId = args[++i];
    else if (args[i] === '--agent-name') agentName = args[++i];
  }

  // Fallback to env vars
  agentId = agentId || process.env.AGENT_ID || process.env.OPENCLAW_AGENT_ID;
  agentName = agentName || process.env.AGENT_NAME || process.env.OPENCLAW_AGENT_NAME || agentId;

  // Try stdin if no URL provided
  if (!respondUrl) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    if (chunks.length) {
      const input = JSON.parse(Buffer.concat(chunks).toString());
      respondUrl = input.respond_url;
      if (!responseText) responseText = args[0] || input.response;
    }
  }

  if (!respondUrl || !responseText) {
    console.error('Usage: node trusted-respond.cjs --url <respond_url> --response "text" [--agent-id id] [--agent-name name]');
    console.error('   Or: echo \'{"respond_url":"..."}\' | node trusted-respond.cjs "response text"');
    process.exit(1);
  }

  const success = await trustedRespond(respondUrl, responseText, agentId, agentName);
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { trustedRespond, TRUSTED_PATTERN };

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}
