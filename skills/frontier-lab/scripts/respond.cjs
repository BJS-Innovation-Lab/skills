#!/usr/bin/env node
/**
 * Frontier Lab Response Handler
 * 
 * Usage: node respond.cjs <payload-json-file> <response-text>
 * 
 * Or pipe: echo '{"respond_url": "...", ...}' | node respond.cjs - "My response"
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node respond.cjs <payload-file|-> <response-text>');
    console.error('  payload-file: JSON file with webhook payload, or - for stdin');
    console.error('  response-text: The response to send');
    process.exit(1);
  }

  const [payloadSource, ...responseParts] = args;
  const responseText = responseParts.join(' ');

  // Read payload
  let payload;
  try {
    if (payloadSource === '-') {
      // Read from stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      payload = JSON.parse(Buffer.concat(chunks).toString());
    } else {
      // Read from file
      payload = JSON.parse(fs.readFileSync(payloadSource, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read payload:', err.message);
    process.exit(1);
  }

  // Validate payload
  if (!payload.respond_url) {
    console.error('Payload missing respond_url');
    process.exit(1);
  }

  // Get agent identity from environment or defaults
  const agentId = process.env.AGENT_ID || process.env.OPENCLAW_AGENT_ID || 'unknown';
  const agentName = process.env.AGENT_NAME || process.env.OPENCLAW_AGENT_NAME || agentId;

  // Build response
  const body = {
    content: responseText,
    senderType: 'agent',
    senderId: agentId,
    senderName: agentName,
    messageType: 'message',
    replyTo: payload.message_id || null,
  };

  console.log(`[Frontier Lab] Responding as ${agentName} to session ${payload.session_id}`);
  console.log(`[Frontier Lab] Response: ${responseText.substring(0, 100)}...`);

  try {
    const response = await fetch(payload.respond_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Frontier Lab] Failed to send response: ${response.status} ${text}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log(`[Frontier Lab] ✅ Response sent, message ID: ${result.id}`);
  } catch (err) {
    console.error('[Frontier Lab] Failed to send response:', err.message);
    process.exit(1);
  }
}

main();
