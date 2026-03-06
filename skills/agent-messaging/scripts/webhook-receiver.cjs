#!/usr/bin/env node
/**
 * Simple webhook receiver for testing agent notifications
 * Run: node webhook-receiver.cjs [port]
 */

const http = require('http');
const port = process.argv[2] || 3456;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n🔔 [${timestamp}] Webhook received!`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      
      try {
        const payload = JSON.parse(body);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        if (payload.event === 'new_message') {
          console.log(`\n📨 New message from ${payload.from_agent}!`);
          console.log(`   Subject: ${payload.subject || '(none)'}`);
          console.log(`   Priority: ${payload.priority}`);
          console.log(`   Message ID: ${payload.message_id}`);
        }
      } catch (e) {
        console.log('Raw body:', body);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Webhook receiver ready. POST to this URL.');
  }
});

server.listen(port, () => {
  console.log(`🎯 Webhook receiver listening on port ${port}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log(`\nWaiting for webhooks... (Ctrl+C to stop)\n`);
});
