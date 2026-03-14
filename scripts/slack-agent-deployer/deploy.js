#!/usr/bin/env node
/**
 * Slack Agent Deployer
 * 
 * Usage:
 *   node deploy.js --agent sage --workspace vulkn
 *   node deploy.js --agent sofia --generate-link --client acme
 */

const https = require('https');

// Agent templates
const AGENT_TEMPLATES = {
  default: {
    description: "VULKN AI Agent",
    scopes: [
      "app_mentions:read",
      "channels:history", 
      "channels:read",
      "chat:write",
      "groups:history",
      "groups:read",
      "im:history",
      "im:read",
      "im:write",
      "users:read"
    ],
    events: [
      "app_mention",
      "message.channels",
      "message.groups", 
      "message.im",
      "message.mpim"
    ]
  },
  sales: {
    description: "VULKN Sales Agent",
    // Add sales-specific scopes/events
  },
  research: {
    description: "VULKN Research Agent",
  }
};

// Build manifest for new agent
function buildManifest(agentName, template = 'default') {
  const config = { ...AGENT_TEMPLATES.default, ...AGENT_TEMPLATES[template] };
  
  return {
    display_information: {
      name: agentName.charAt(0).toUpperCase() + agentName.slice(1),
      description: config.description,
      background_color: "#4A154B"
    },
    features: {
      app_home: {
        home_tab_enabled: false,
        messages_tab_enabled: true,
        messages_tab_read_only_enabled: false
      },
      bot_user: {
        display_name: agentName.charAt(0).toUpperCase() + agentName.slice(1),
        always_online: true
      }
    },
    oauth_config: {
      scopes: {
        bot: config.scopes
      }
    },
    settings: {
      event_subscriptions: {
        bot_events: config.events
      },
      interactivity: {
        is_enabled: false
      },
      org_deploy_enabled: false,
      socket_mode_enabled: true
    }
  };
}

// Create Slack app via API
async function createSlackApp(agentName, configToken) {
  const manifest = buildManifest(agentName);
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ manifest: JSON.stringify(manifest) });
    
    const options = {
      hostname: 'slack.com',
      path: '/api/apps.manifest.create',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configToken}`,
        'Content-Type': 'application/json',
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

// Generate App Token (for Socket Mode)
async function generateAppToken(appId, configToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: appId,
      name: 'openclaw',
      scopes: ['connections:write']
    });
    
    const options = {
      hostname: 'slack.com',
      path: '/api/apps.token.create',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response.ok) {
          resolve(response.token);
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

// Generate OAuth install link for clients
function generateClientLink(clientId, redirectUri, agentName) {
  const scopes = AGENT_TEMPLATES.default.scopes.join(',');
  const state = Buffer.from(JSON.stringify({ agent: agentName, ts: Date.now() })).toString('base64');
  
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

// Generate OpenClaw config snippet
function generateOpenClawConfig(appToken, botToken, channels = ['agent-party']) {
  const channelConfig = {};
  channels.forEach(ch => {
    channelConfig[ch] = {
      requireMention: false,
      allowBots: true
    };
  });
  
  return {
    slack: {
      enabled: true,
      mode: "socket",
      appToken,
      botToken,
      dmPolicy: "open",
      groupPolicy: "open",
      allowFrom: ["*"],
      channels: channelConfig
    }
  };
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] || true;
      i++;
    }
  }
  
  const configToken = process.env.SLACK_CONFIG_TOKEN;
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || 'https://vulkn.ai/slack/oauth';
  
  if (flags['generate-link']) {
    // Generate client install link
    if (!clientId) {
      console.error('Error: SLACK_CLIENT_ID required for generating links');
      process.exit(1);
    }
    
    const link = generateClientLink(clientId, redirectUri, flags.agent || 'agent');
    console.log('\n📎 Client Install Link:\n');
    console.log(link);
    console.log('\nSend this to the client. When they click and authorize,');
    console.log('their tokens will be sent to your OAuth receiver.\n');
    return;
  }
  
  if (flags.agent) {
    // Create new app
    if (!configToken) {
      console.error('Error: SLACK_CONFIG_TOKEN required');
      console.error('Get one at: https://api.slack.com/apps (Generate Token)');
      process.exit(1);
    }
    
    console.log(`\n🚀 Creating Slack app for agent: ${flags.agent}\n`);
    
    try {
      // Create the app
      const result = await createSlackApp(flags.agent, configToken);
      console.log(`✅ App created: ${result.app_id}`);
      
      // Generate app token
      const appToken = await generateAppToken(result.app_id, configToken);
      console.log(`✅ App token generated`);
      
      // Note: Bot token requires OAuth installation
      console.log(`\n⚠️  Bot token requires manual installation step:`);
      console.log(`   1. Go to: https://api.slack.com/apps/${result.app_id}`);
      console.log(`   2. Click "Install to Workspace"`);
      console.log(`   3. Copy the Bot Token (xoxb-...)\n`);
      
      console.log(`📋 App Token (xapp-...):`);
      console.log(appToken);
      
      console.log(`\n📝 OpenClaw config template (add botToken after install):`);
      console.log(JSON.stringify(generateOpenClawConfig(appToken, 'xoxb-PASTE-BOT-TOKEN'), null, 2));
      
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
    return;
  }
  
  // Show help
  console.log(`
Slack Agent Deployer

Usage:
  node deploy.js --agent <name>              Create new agent app in Slack
  node deploy.js --generate-link             Generate client OAuth install link

Options:
  --agent <name>      Agent name (required for creation)
  --template <type>   Agent template (default, sales, research)
  --generate-link     Generate OAuth link instead of creating app

Environment:
  SLACK_CONFIG_TOKEN  Required for app creation
  SLACK_CLIENT_ID     Required for OAuth links
  OAUTH_REDIRECT_URI  Your OAuth callback URL

Examples:
  # Scout deploys new agent to VULKN Slack
  SLACK_CONFIG_TOKEN=xoxe-... node deploy.js --agent sage
  
  # Generate link for client to install agent in their Slack
  SLACK_CLIENT_ID=... node deploy.js --agent sofia --generate-link
`);
}

main().catch(console.error);
