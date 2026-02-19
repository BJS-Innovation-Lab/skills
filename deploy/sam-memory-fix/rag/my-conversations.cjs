#!/usr/bin/env node
/**
 * my-conversations.cjs — Local conversation viewer for field agents
 * 
 * Reads YOUR local .jsonl transcripts only. No Supabase, no shared keys,
 * no access to other agents' data.
 * 
 * Usage:
 *   node rag/my-conversations.cjs --date 2026-02-17
 *   node rag/my-conversations.cjs --date 2026-02-17 --user suzanne
 *   node rag/my-conversations.cjs --date 2026-02-17 --view stats
 *   node rag/my-conversations.cjs --date 2026-02-17 --view chat
 *   node rag/my-conversations.cjs --date 2026-02-17 --export memory
 *   node rag/my-conversations.cjs --days 3
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============== CONFIG ==============
const SESSIONS_DIR = path.join(os.homedir(), '.openclaw/agents/main/sessions');
const WS = process.env.WORKSPACE || path.join(os.homedir(), '.openclaw/workspace');

// ============== ARGS ==============
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { date: null, days: 1, user: null, view: 'chat', export: null };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--date': opts.date = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--user': opts.user = args[++i]?.toLowerCase(); break;
      case '--view': opts.view = args[++i]; break;
      case '--export': opts.export = args[++i]; break;
      case '--help': case '-h':
        console.log(`
my-conversations.cjs — View YOUR conversation history (local only, no shared data)

Usage:
  node rag/my-conversations.cjs --date 2026-02-17              # Chat view for that date
  node rag/my-conversations.cjs --date 2026-02-17 --user javier # Filter by user
  node rag/my-conversations.cjs --date 2026-02-17 --view stats  # Stats summary
  node rag/my-conversations.cjs --days 3                        # Last 3 days
  node rag/my-conversations.cjs --date 2026-02-17 --export memory  # Generate memory file

Views: chat (default), stats, raw
Export: memory (generates a daily log from conversations)
`);
        process.exit(0);
    }
  }
  if (!opts.date) {
    const d = new Date(Date.now() - (opts.days > 1 ? 0 : 86400000));
    opts.date = d.toISOString().split('T')[0];
  }
  return opts;
}

// ============== PARSE JSONL ==============
function parseTranscript(filePath) {
  const messages = [];
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'message' || entry.role) {
          messages.push(entry);
        }
      } catch {}
    }
  } catch {}
  return messages;
}

// ============== EXTRACT USER INFO ==============
function extractUser(text) {
  // Try to extract user name from Telegram metadata
  const patterns = [
    /\[Telegram\s+(.+?)\s+id:\d+/,
    /\[Telegram\s+(.+?)\s+\(@/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function getMessageText(msg) {
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');
  }
  return '';
}

function getTimestamp(msg) {
  return msg.timestamp || msg.created_at || msg.ts || null;
}

// ============== FILTER BY DATE ==============
function filterByDate(messages, dateStr, days) {
  const startDate = new Date(dateStr + 'T00:00:00Z');
  const endDate = new Date(startDate.getTime() + days * 86400000);
  
  return messages.filter(msg => {
    const ts = getTimestamp(msg);
    if (!ts) return false;
    const msgDate = new Date(typeof ts === 'number' ? ts : ts);
    return msgDate >= startDate && msgDate < endDate;
  });
}

// ============== DEDUP ==============
function dedup(messages) {
  const seen = new Set();
  return messages.filter(msg => {
    const text = getMessageText(msg);
    const ts = getTimestamp(msg);
    const key = `${msg.role}:${text?.substring(0, 100)}:${ts}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============== VIEWS ==============
function chatView(messages, userFilter) {
  let filtered = messages;
  if (userFilter) {
    filtered = messages.filter(msg => {
      const text = getMessageText(msg);
      return text.toLowerCase().includes(userFilter);
    });
  }

  // Dedup (tool_use_id bug causes repetition)
  filtered = dedup(filtered);

  for (const msg of filtered) {
    const text = getMessageText(msg);
    if (!text) continue;
    
    const ts = getTimestamp(msg);
    const time = ts ? new Date(typeof ts === 'number' ? ts : ts).toISOString().substring(11, 16) : '??:??';
    const dir = msg.role === 'assistant' ? '←' : '→';
    const user = extractUser(text);
    const preview = text.substring(0, 200).replace(/\n/g, ' ');
    
    console.log(`[${time}] ${dir} ${user || msg.role}: ${preview}`);
  }
  console.log(`\n--- ${filtered.length} messages ---`);
}

function statsView(messages) {
  messages = dedup(messages);
  
  const users = {};
  let inbound = 0, outbound = 0;
  const hours = {};
  
  for (const msg of messages) {
    const text = getMessageText(msg);
    if (!text) continue;
    
    if (msg.role === 'assistant') {
      outbound++;
    } else {
      inbound++;
      const user = extractUser(text) || 'unknown';
      users[user] = (users[user] || 0) + 1;
    }
    
    const ts = getTimestamp(msg);
    if (ts) {
      const hour = new Date(typeof ts === 'number' ? ts : ts).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
  }
  
  console.log('📊 Daily Stats');
  console.log('─'.repeat(40));
  console.log(`Messages: ${inbound} in / ${outbound} out / ${messages.length} total`);
  console.log(`\nUsers:`);
  Object.entries(users)
    .sort((a, b) => b[1] - a[1])
    .forEach(([user, count]) => console.log(`  ${user}: ${count} messages`));
  
  console.log(`\nActive hours:`);
  Object.entries(hours)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([hour, count]) => console.log(`  ${hour.padStart(2, '0')}:00 — ${count} messages`));
}

function exportMemory(messages, dateStr) {
  messages = dedup(messages);
  
  const users = {};
  for (const msg of messages) {
    const text = getMessageText(msg);
    if (!text) continue;
    const user = extractUser(text) || (msg.role === 'assistant' ? '_agent' : 'unknown');
    if (!users[user]) users[user] = [];
    users[user].push({ role: msg.role, text, ts: getTimestamp(msg) });
  }
  
  let output = `# Daily Log — ${dateStr}\n\n`;
  output += `**Generated from local transcripts** (${messages.length} messages, deduplicated)\n\n`;
  
  for (const [user, msgs] of Object.entries(users)) {
    if (user === '_agent') continue;
    const count = msgs.filter(m => m.role !== 'assistant').length;
    output += `## ${user} (${count} messages)\n`;
    
    // Key topics from messages
    const agentReplies = messages
      .filter(m => m.role === 'assistant')
      .map(m => getMessageText(m))
      .filter(Boolean);
    
    output += `- ${count} inbound messages\n`;
    output += `- Key interactions logged in transcript\n\n`;
  }
  
  const outPath = path.join(WS, `memory/auto-${dateStr}.md`);
  fs.writeFileSync(outPath, output);
  console.log(`✅ Exported to ${outPath}`);
}

// ============== MAIN ==============
function main() {
  const opts = parseArgs();
  
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.error(`❌ Sessions directory not found: ${SESSIONS_DIR}`);
    process.exit(1);
  }
  
  // Read all session files
  const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.jsonl'));
  console.error(`Reading ${files.length} session files...`);
  
  let allMessages = [];
  for (const file of files) {
    const msgs = parseTranscript(path.join(SESSIONS_DIR, file));
    allMessages.push(...msgs);
  }
  
  // Filter by date
  const filtered = filterByDate(allMessages, opts.date, opts.days > 1 ? opts.days : 1);
  console.error(`Found ${filtered.length} messages for ${opts.date}${opts.days > 1 ? ` (+${opts.days - 1} days)` : ''}\n`);
  
  if (filtered.length === 0) {
    console.log('No messages found for this date.');
    return;
  }
  
  // Sort by timestamp
  filtered.sort((a, b) => {
    const ta = new Date(getTimestamp(a) || 0).getTime();
    const tb = new Date(getTimestamp(b) || 0).getTime();
    return ta - tb;
  });
  
  switch (opts.view) {
    case 'stats': statsView(filtered); break;
    case 'raw': filtered.forEach(m => console.log(JSON.stringify(m))); break;
    case 'chat': default: chatView(filtered, opts.user); break;
  }
  
  if (opts.export === 'memory') {
    exportMemory(filtered, opts.date);
  }
}

main();
