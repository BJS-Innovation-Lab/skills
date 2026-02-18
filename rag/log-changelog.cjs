#!/usr/bin/env node
/**
 * Log a change to the BJS Daily Changelog Notion database.
 * 
 * Usage:
 *   node log-changelog.cjs "Memory Guardian deployed" --category Security --commit bb137aa --repo skills
 *   node log-changelog.cjs "Fixed dedup bug" --category Bugfix --status "✅ Deployed"
 * 
 * Options:
 *   --category  Security|Skill|Bugfix|Ops|Research|Template|Config (default: Ops)
 *   --status    "✅ Deployed"|"🔄 In Progress"|"📋 Planned"|"❌ Reverted" (default: ✅ Deployed)
 *   --commit    Commit hash or reference
 *   --repo      skills|field-template|workspace (default: workspace)
 *   --date      ISO date (default: today)
 *   --agent     Agent name (auto-detected from IDENTITY.md)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const DB_ID = '30b7a723-4ce4-81eb-8db8-f6d88035137b';

// Get Notion key
let NOTION_KEY;
try {
  NOTION_KEY = fs.readFileSync(path.join(process.env.HOME, '.config', 'notion', 'api_key'), 'utf-8').trim();
} catch {
  console.error('No Notion API key found at ~/.config/notion/api_key');
  process.exit(1);
}

// Auto-detect agent
let agentName = 'Unknown';
try {
  const id = fs.readFileSync(path.join(WS, 'IDENTITY.md'), 'utf-8');
  const m = id.match(/\*\*Name:\*\*\s*(.+)/i);
  if (m) agentName = m[1].trim();
} catch {}

// Parse args
const args = process.argv.slice(2);
let change = '', category = 'Ops', status = '✅ Deployed', commit = '', repo = 'workspace', date = new Date().toISOString().slice(0, 10);

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--category': category = args[++i]; break;
    case '--status': status = args[++i]; break;
    case '--commit': commit = args[++i]; break;
    case '--repo': repo = args[++i]; break;
    case '--date': date = args[++i]; break;
    case '--agent': agentName = args[++i]; break;
    default:
      if (!args[i].startsWith('--')) change = args[i];
  }
}

if (!change) {
  console.error('Usage: node log-changelog.cjs "description" [--category Ops] [--commit abc123] [--repo skills]');
  process.exit(1);
}

const body = JSON.stringify({
  parent: { database_id: DB_ID },
  properties: {
    Change: { title: [{ text: { content: change } }] },
    Date: { date: { start: date } },
    Category: { select: { name: category } },
    Agent: { select: { name: agentName } },
    Status: { select: { name: status } },
    Commit: { rich_text: commit ? [{ text: { content: commit } }] : [] },
    Repo: { select: { name: repo } },
  }
});

const req = https.request({
  hostname: 'api.notion.com',
  path: '/v1/pages',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${NOTION_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const d = JSON.parse(data);
    if (d.id) {
      console.log(`✅ Logged: "${change}" (${category}, ${agentName})`);
    } else {
      console.error('❌ Error:', data.slice(0, 200));
      process.exit(1);
    }
  });
});
req.write(body);
req.end();
