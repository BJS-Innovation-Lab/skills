#!/usr/bin/env node
/**
 * Query conversations from Supabase — runs on HQ (Sybil).
 * 
 * Usage:
 *   node query-conversations.cjs --agent sam --today
 *   node query-conversations.cjs --agent sam --date 2026-02-16
 *   node query-conversations.cjs --agent sam --user javier --days 7
 *   node query-conversations.cjs --agent sam --client click-seguros --today
 *   node query-conversations.cjs --agent sam --today --stats
 *   node query-conversations.cjs --agent sam --today --format chat
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');

// Load .env
const envFile = path.join(WS, 'rag', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { agent: 'sam', date: null, days: 1, user: null, client: null, stats: false, format: 'full', today: false, limit: 500 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--agent': opts.agent = args[++i]; break;
      case '--date': opts.date = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--user': opts.user = args[++i]; break;
      case '--client': opts.client = args[++i]; break;
      case '--stats': opts.stats = true; break;
      case '--format': opts.format = args[++i]; break;
      case '--today': opts.today = true; break;
      case '--limit': opts.limit = parseInt(args[++i]); break;
    }
  }
  if (opts.today) {
    opts.date = new Date().toISOString().split('T')[0];
  } else if (!opts.date) {
    const d = new Date(Date.now() - opts.days * 86400000);
    opts.date = d.toISOString().split('T')[0];
  }
  return opts;
}

async function fetchConversations(opts) {
  const start = `${opts.date}T00:00:00Z`;
  const endDate = new Date(new Date(opts.date).getTime() + opts.days * 86400000);
  const end = endDate.toISOString();

  let url = `${SUPABASE_URL}/rest/v1/conversations?agent_name=eq.${opts.agent}&timestamp=gte.${start}&timestamp=lte.${end}&order=timestamp.asc&limit=${opts.limit}`;
  if (opts.user) url += `&user_name=ilike.%25${opts.user}%25`;
  if (opts.client) url += `&client_id=eq.${opts.client}`;

  const resp = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  if (!resp.ok) {
    console.error(`Error: ${resp.status} ${await resp.text()}`);
    return [];
  }

  return resp.json();
}

function printStats(convos, opts) {
  const users = {};
  const clients = {};
  let inCount = 0, outCount = 0, toolCount = 0;
  let totalInChars = 0, totalOutChars = 0;

  for (const c of convos) {
    if (c.direction === 'in') { inCount++; totalInChars += c.message.length; }
    else if (c.message_type === 'tool_call') toolCount++;
    else { outCount++; totalOutChars += c.message.length; }

    if (c.user_name) users[c.user_name] = (users[c.user_name] || 0) + 1;
    if (c.client_id) clients[c.client_id] = (clients[c.client_id] || 0) + 1;
  }

  console.log(`\n📊 Conversation Stats — ${opts.agent} (${opts.date})`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Total messages: ${convos.length}`);
  console.log(`  User → Agent: ${inCount} (${totalInChars.toLocaleString()} chars)`);
  console.log(`  Agent → User: ${outCount} (${totalOutChars.toLocaleString()} chars)`);
  console.log(`  Tool calls:   ${toolCount}`);
  console.log(`\nUsers:`);
  for (const [u, count] of Object.entries(users).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${u}: ${count} messages`);
  }
  console.log(`\nClients:`);
  for (const [c, count] of Object.entries(clients).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${count} messages`);
  }
}

function printChat(convos) {
  let lastUser = '';
  for (const c of convos) {
    if (c.message_type === 'tool_call') continue; // skip tool calls in chat view
    
    const time = new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const user = c.direction === 'in' ? c.user_name : '🤖 Agent';
    
    if (user !== lastUser) {
      console.log(`\n[${time}] ${user}:`);
      lastUser = user;
    }
    
    // Truncate long messages in chat view
    const msg = c.message.length > 500 ? c.message.slice(0, 497) + '...' : c.message;
    console.log(`  ${msg}`);
  }
}

function printFull(convos) {
  for (const c of convos) {
    const time = new Date(c.timestamp).toISOString();
    const dir = c.direction === 'in' ? '→' : '←';
    const user = c.direction === 'in' ? c.user_name : 'agent';
    console.log(`[${time}] ${dir} ${user} (${c.client_id || '-'}): ${c.message.slice(0, 200)}`);
  }
}

async function main() {
  const opts = parseArgs();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or key');
    process.exit(1);
  }

  const convos = await fetchConversations(opts);

  if (convos.length === 0) {
    console.log(`No conversations found for ${opts.agent} on ${opts.date}`);
    return;
  }

  if (opts.stats) {
    printStats(convos, opts);
  } else if (opts.format === 'chat') {
    printChat(convos);
  } else {
    printFull(convos);
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
