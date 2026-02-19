#!/usr/bin/env node
/**
 * Sync OpenClaw session transcripts to Supabase conversations table.
 * 
 * Reads .jsonl session files, extracts user/assistant messages,
 * and pushes them as structured rows to the conversations table.
 * 
 * Usage:
 *   node sync-conversations.cjs                    # sync last 24h of sessions
 *   node sync-conversations.cjs --hours 48         # sync last 48h
 *   node sync-conversations.cjs --session <id>     # sync specific session
 *   node sync-conversations.cjs --all              # sync everything (first run)
 * 
 * Designed to run on the FIELD AGENT's machine as a cron job.
 * Reads agent identity from IDENTITY.md and client map from .client-map.json.
 */

const fs = require('fs');
const path = require('path');

// ============== CONFIG ==============
const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const SESSIONS_DIR = path.join(process.env.HOME, '.openclaw', 'agents', 'main', 'sessions');
const STATE_FILE = path.join(WS, 'rag', '.conv-sync-state.json');

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

// ============== AGENT IDENTITY ==============
function getAgentInfo() {
  const identityFile = path.join(WS, 'IDENTITY.md');
  let name = 'unknown';
  let id = null;

  if (fs.existsSync(identityFile)) {
    const content = fs.readFileSync(identityFile, 'utf-8');
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i);
    if (nameMatch) name = nameMatch[1].trim().toLowerCase();
  }

  // Try to get UUID from A2A config
  const a2aConfigs = [
    path.join(process.env.HOME, '.openclaw', 'a2a', 'config.json'),
    path.join(WS, 'bjs-a2a-protocol', 'config.json'),
    path.join(WS, 'a2a-protocol', 'config.json'),
  ];
  for (const cf of a2aConfigs) {
    if (fs.existsSync(cf)) {
      try {
        const conf = JSON.parse(fs.readFileSync(cf, 'utf-8'));
        if (conf.agentId) { id = conf.agentId; break; }
      } catch {}
    }
  }

  return { name, id };
}

// ============== CLIENT MAP ==============
function getClientMap() {
  // Maps telegram user IDs/names to client + user info
  const mapFile = path.join(WS, '.client-map.json');
  if (!fs.existsSync(mapFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(mapFile, 'utf-8'));
  } catch { return {}; }
}

function resolveUser(msg, clientMap) {
  // Try to resolve a message's sender to a client + user
  const meta = msg.metadata || msg.meta || {};
  const chatLabel = meta.conversation_label || meta.chatLabel || '';
  const chatId = meta.chat_id || meta.chatId || '';
  
  // Check client map by chat ID or label
  for (const [key, val] of Object.entries(clientMap)) {
    if (chatId && (key === String(chatId) || val.chatId === String(chatId))) {
      return { clientId: val.client || val.clientId || 'unknown', userName: val.name || val.userName || key, userId: String(chatId) };
    }
    if (chatLabel && chatLabel.includes(key)) {
      return { clientId: val.client || val.clientId || 'unknown', userName: val.name || val.userName || key, userId: key };
    }
  }
  
  // Fallback: extract from conversation_label
  if (chatLabel) {
    const nameMatch = chatLabel.match(/^(.+?)(?:\s*\(|$)/);
    return { clientId: 'unknown', userName: nameMatch ? nameMatch[1].trim() : chatLabel, userId: chatId || 'unknown' };
  }
  
  return { clientId: 'unknown', userName: 'unknown', userId: 'unknown' };
}

// ============== PARSE SESSION ==============
function parseSession(filePath, clientMap) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const messages = [];
  const sessionId = path.basename(filePath, '.jsonl');

  let currentUser = { clientId: 'unknown', userName: 'unknown', userId: 'unknown' };

  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    const ts = entry.timestamp || entry.ts || entry.created_at;
    if (!ts) continue;

    // OpenClaw v3 format: type="message" with message.role inside
    // Also support legacy flat format (role at top level)
    let role, content, meta;

    if (entry.type === 'message' && entry.message) {
      role = entry.message.role;
      content = entry.message.content;
      meta = entry.message.metadata || entry.metadata;
    } else if (entry.role) {
      role = entry.role;
      content = entry.content;
      meta = entry.metadata;
    } else {
      continue; // skip non-message entries (session, model_change, thinking, etc.)
    }

    // Update user context from metadata
    if (meta) {
      const resolved = resolveUser({ metadata: meta }, clientMap);
      if (resolved.userName !== 'unknown') currentUser = resolved;
    }

    // Extract text from content (can be string or array of blocks)
    function extractText(c) {
      if (typeof c === 'string') return c;
      if (Array.isArray(c)) return c.filter(b => b.type === 'text').map(b => b.text || '').join('\n');
      return JSON.stringify(c);
    }

    if (role === 'user') {
      const text = extractText(content);
      
      if (!text || text.length < 2) continue;
      
      // Skip heartbeats and system events
      if (text.includes('HEARTBEAT') || text.includes('Read HEARTBEAT.md')) continue;
      if (text.startsWith('[') && text.includes('cron job')) continue;
      // Skip cron scheduled reminders
      if (text.includes('scheduled reminder has been triggered')) continue;

      messages.push({
        session_id: sessionId,
        client_id: currentUser.clientId,
        user_id: currentUser.userId,
        user_name: currentUser.userName,
        direction: 'in',
        message: text.slice(0, 10000),
        message_type: 'text',
        timestamp: ts,
        metadata: { chat_label: (meta || {}).conversation_label || '' },
      });

    } else if (role === 'assistant') {
      const text = extractText(content);

      if (!text || text.length < 2) continue;
      if (text === 'HEARTBEAT_OK' || text === 'NO_REPLY') continue;

      messages.push({
        session_id: sessionId,
        client_id: currentUser.clientId,
        user_id: currentUser.userId,
        user_name: currentUser.userName,
        direction: 'out',
        message: text.slice(0, 10000),
        message_type: 'text',
        timestamp: ts,
        metadata: {},
      });

    } else if (role === 'toolResult' || role === 'tool_result') {
      // Skip tool results — too verbose
      continue;
    }
  }

  return messages;
}

// ============== SYNC STATE ==============
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch {}
  }
  return { lastSync: null, syncedSessions: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ============== UPLOAD ==============
async function uploadBatch(messages, agentInfo) {
  const rows = messages.map(m => ({
    agent_id: agentInfo.id,
    agent_name: agentInfo.name,
    ...m,
    metadata: JSON.stringify(m.metadata),
  }));

  // Batch in groups of 100
  let total = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`Upload error (batch ${i}): ${resp.status} ${err.slice(0, 200)}`);
    } else {
      total += batch.length;
    }
  }
  return total;
}

// ============== MAIN ==============
async function main() {
  const args = process.argv.slice(2);
  let hours = 24;
  let specificSession = null;
  let syncAll = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--hours') hours = parseInt(args[++i]);
    if (args[i] === '--session') specificSession = args[++i];
    if (args[i] === '--all') syncAll = true;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or key. Check rag/.env');
    process.exit(1);
  }

  if (!fs.existsSync(SESSIONS_DIR)) {
    console.error(`Sessions dir not found: ${SESSIONS_DIR}`);
    process.exit(1);
  }

  const agentInfo = getAgentInfo();
  const clientMap = getClientMap();
  const state = loadState();

  console.error(`🔄 Syncing conversations for ${agentInfo.name} (${agentInfo.id || 'no UUID'})`);

  // Find session files to process
  const cutoff = syncAll ? 0 : Date.now() - hours * 3600 * 1000;
  let files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({ name: f, path: path.join(SESSIONS_DIR, f), mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtimeMs }))
    .filter(f => f.mtime > cutoff);

  if (specificSession) {
    files = files.filter(f => f.name.includes(specificSession));
  }

  // Skip sessions we've already fully synced (by mtime)
  if (!syncAll) {
    files = files.filter(f => {
      const prev = state.syncedSessions[f.name];
      return !prev || prev.mtime < f.mtime;
    });
  }

  console.error(`   Found ${files.length} session files to process`);

  let totalMessages = 0;
  let totalUploaded = 0;

  for (const file of files) {
    try {
      const messages = parseSession(file.path, clientMap);
      if (messages.length === 0) continue;

      // Skip messages we already synced (by count offset)
      const prev = state.syncedSessions[file.name];
      const newMessages = prev && prev.count ? messages.slice(prev.count) : messages;
      if (newMessages.length === 0) {
        console.error(`   ${file.name}: ${messages.length} messages (0 new, skipping)`);
        state.syncedSessions[file.name] = { mtime: file.mtime, count: messages.length, syncedAt: new Date().toISOString() };
        continue;
      }

      const uploaded = await uploadBatch(newMessages, agentInfo);
      totalMessages += newMessages.length;
      totalUploaded += uploaded;

      state.syncedSessions[file.name] = { mtime: file.mtime, count: messages.length, syncedAt: new Date().toISOString() };
      console.error(`   ${file.name}: ${messages.length} messages (${uploaded} uploaded)`);
    } catch (e) {
      console.error(`   ❌ ${file.name}: ${e.message}`);
    }
  }

  state.lastSync = new Date().toISOString();
  saveState(state);

  console.log(`Done. Processed ${totalMessages} messages from ${files.length} sessions. Uploaded ${totalUploaded}.`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
