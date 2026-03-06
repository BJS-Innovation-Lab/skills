#!/usr/bin/env node
/**
 * Message Notifier Service
 * 
 * Runs alongside an OpenClaw agent to:
 * 1. Receive webhook notifications from Supabase
 * 2. Inject "new message" events into the agent's session
 * 
 * Usage:
 *   AGENT_ID=sybil node message-notifier.cjs
 * 
 * This creates an HTTP endpoint that Supabase can POST to.
 * Set the agent's webhook_url in known_agents to point here.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../rag/.env') });
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const AGENT_ID = process.env.AGENT_ID || 'sybil';
const PORT = process.env.NOTIFIER_PORT || 3456;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Track recent notifications to avoid duplicates
const recentNotifications = new Set();

async function handleNotification(payload) {
  const { message_id, from_agent, subject, priority } = payload;
  
  // Dedupe
  if (recentNotifications.has(message_id)) {
    console.log('Duplicate notification, skipping');
    return;
  }
  recentNotifications.add(message_id);
  
  // Clean up old entries after 5 minutes
  setTimeout(() => recentNotifications.delete(message_id), 5 * 60 * 1000);
  
  console.log(`\n📨 New message from ${from_agent}`);
  console.log(`   Subject: ${subject || '(none)'}`);
  console.log(`   Priority: ${priority}`);
  
  // Fetch the full message
  const { data: message, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('id', message_id)
    .single();
  
  if (error) {
    console.error('Error fetching message:', error.message);
    return;
  }
  
  // Format for display
  const notification = `
📨 New message from ${from_agent}
Subject: ${subject || '(none)'}
Priority: ${priority}
---
${message.message}
---
Message ID: ${message_id}
`;

  console.log(notification);
  
  // Option 1: Write to a file that the agent checks on heartbeat
  const fs = require('fs');
  const notificationFile = process.env.HOME + '/.openclaw/pending_notifications.json';
  
  let pending = [];
  try {
    pending = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }
  
  pending.push({
    type: 'message',
    message_id,
    from_agent,
    subject,
    priority,
    preview: message.message.substring(0, 100),
    received_at: new Date().toISOString()
  });
  
  fs.writeFileSync(notificationFile, JSON.stringify(pending, null, 2));
  console.log('Written to pending_notifications.json');
  
  // Option 2: If urgent, could trigger a wake event via OpenClaw cron
  if (priority === 'urgent') {
    console.log('🚨 URGENT message - consider triggering wake event');
    // Could call: openclaw cron wake --mode now
  }
}

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      agent: AGENT_ID,
      uptime: process.uptime()
    }));
    return;
  }
  
  // Webhook handler
  if (req.method === 'POST') {
    // Verify secret if configured
    if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
      console.log('Invalid webhook secret');
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        
        if (payload.event === 'new_message' && payload.to_agent === AGENT_ID) {
          await handleNotification(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));
        } else {
          console.log('Ignoring notification for different agent or unknown event');
          res.writeHead(200);
          res.end('Ignored');
        }
      } catch (e) {
        console.error('Error processing webhook:', e.message);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
    return;
  }
  
  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`🔔 Message Notifier for ${AGENT_ID}`);
  console.log(`   Listening on port ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}`);
  console.log(`\n   For production, expose this via Railway or ngrok`);
  console.log(`   Then update known_agents.webhook_url\n`);
});
