#!/usr/bin/env node
/**
 * OAuth Receiver Server
 * 
 * Receives Slack OAuth callbacks when clients install the agent.
 * Stores tokens and optionally notifies the team.
 * 
 * Run: node oauth-receiver.js
 * Or deploy to Railway/Vercel/etc.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 3456;
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK; // Optional: Slack webhook to notify team

// Exchange OAuth code for tokens
async function exchangeCodeForTokens(code) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code
    }).toString();
    
    const options = {
      hostname: 'slack.com',
      path: '/api/oauth.v2.access',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response.ok) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Store tokens in Supabase
async function storeTokens(teamId, teamName, tokens, agentName) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('⚠️  Supabase not configured, tokens logged only');
    return;
  }
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      team_id: teamId,
      team_name: teamName,
      agent_name: agentName,
      bot_token: tokens.access_token,
      app_token: null, // App token is per-app, not per-install
      installed_at: new Date().toISOString(),
      raw_response: tokens
    });
    
    const url = new URL(`${SUPABASE_URL}/rest/v1/slack_installations`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Prefer': 'return=minimal'
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => reject(new Error(`Supabase error: ${body}`)));
      }
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Notify team of new installation
async function notifyTeam(teamName, agentName) {
  if (!NOTIFY_WEBHOOK) return;
  
  return new Promise((resolve) => {
    const data = JSON.stringify({
      text: `🎉 New Slack installation!\n*${teamName}* just added *${agentName}* to their workspace.`
    });
    
    const url = new URL(NOTIFY_WEBHOOK);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, () => resolve());
    req.on('error', () => resolve()); // Don't fail on notification errors
    req.write(data);
    req.end();
  });
}

// Success page HTML
function successPage(teamName, agentName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Installation Complete!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 40px; border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #1a1a1a; margin: 0 0 16px; }
    p { color: #666; margin: 0; }
    .emoji { font-size: 48px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">🎉</div>
    <h1>Welcome to VULKN!</h1>
    <p><strong>${agentName}</strong> has been added to <strong>${teamName}</strong>.</p>
    <p style="margin-top: 16px;">You can close this window and start chatting!</p>
  </div>
</body>
</html>`;
}

// Error page HTML
function errorPage(error) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Installation Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 40px; border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #d32f2f; margin: 0 0 16px; }
    p { color: #666; margin: 0; }
    .emoji { font-size: 48px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">😕</div>
    <h1>Installation Error</h1>
    <p>${error}</p>
    <p style="margin-top: 16px;">Please try again or contact support.</p>
  </div>
</body>
</html>`;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  // OAuth callback
  if (url.pathname === '/slack/oauth') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    if (error) {
      console.log(`❌ OAuth error: ${error}`);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(errorPage(error));
      return;
    }
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(errorPage('Missing authorization code'));
      return;
    }
    
    try {
      // Decode state to get agent name
      let agentName = 'Agent';
      if (state) {
        try {
          const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
          agentName = decoded.agent || 'Agent';
        } catch {}
      }
      
      // Exchange code for tokens
      console.log(`🔄 Exchanging OAuth code...`);
      const tokens = await exchangeCodeForTokens(code);
      
      const teamId = tokens.team.id;
      const teamName = tokens.team.name;
      
      console.log(`✅ ${teamName} (${teamId}) installed ${agentName}`);
      console.log(`   Bot Token: ${tokens.access_token.slice(0, 20)}...`);
      
      // Store tokens
      await storeTokens(teamId, teamName, tokens, agentName);
      
      // Notify team
      await notifyTeam(teamName, agentName);
      
      // Success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(successPage(teamName, agentName));
      
    } catch (err) {
      console.error(`❌ OAuth error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(errorPage(err.message));
    }
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`
🚀 Slack OAuth Receiver running on port ${PORT}

Endpoints:
  GET /slack/oauth    OAuth callback (redirect_uri)
  GET /health         Health check

Environment:
  SLACK_CLIENT_ID:     ${CLIENT_ID ? '✅ Set' : '❌ Missing'}
  SLACK_CLIENT_SECRET: ${CLIENT_SECRET ? '✅ Set' : '❌ Missing'}
  SUPABASE_URL:        ${SUPABASE_URL ? '✅ Set' : '⚠️  Optional'}
  NOTIFY_WEBHOOK:      ${NOTIFY_WEBHOOK ? '✅ Set' : '⚠️  Optional'}
`);
});
