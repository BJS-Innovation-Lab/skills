#!/usr/bin/env node
/**
 * a2a-task-send.cjs — Send a tracked task to one or more agents
 * 
 * Creates a task row in Supabase AND sends via A2A.
 * For broadcast, creates a parent task + child tasks.
 * 
 * Usage:
 *   node a2a-task-send.cjs --to sam --message "Pull latest skills repo"
 *   node a2a-task-send.cjs --to sam,santos,saber --message "Update cron jobs" --subject "Cron Reset"
 *   node a2a-task-send.cjs --to sam --message "Fix bug" --priority urgent --timeout 1
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Load env
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const AGENT_NAMES = {
  sybil: '5fae1839-ab85-412c-acc0-033cbbbbd15b',
  sam: '62bb0f39-2248-4b14-806d-1c498c654ee7',
  saber: '415a84a4-af9e-4c98-9d48-040834436e44',
  santos: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb',
  sage: 'f6198962-313d-4a39-89eb-72755602d468',
  vulkimi: 'vulkimi',
};

// Detect who I am
function detectSelf() {
  try {
    const id = fs.readFileSync(path.join(__dirname, '..', 'IDENTITY.md'), 'utf8');
    const m = id.match(/\*\*Name:\*\*\s*(\w+)/i);
    return m ? m[1].toLowerCase() : 'unknown';
  } catch { return 'unknown'; }
}

function genTaskId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = crypto.randomBytes(3).toString('hex');
  return `TASK-${d}-${r}`;
}

async function supabaseInsert(rows) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/agent_tasks`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(rows),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase insert failed: ${resp.status} ${err}`);
  }
  return resp.json();
}

function sendA2A(toAgent, message, subject) {
  const skillDir = path.join(__dirname, '..', 'skills', 'a2a-protocol', 'skill', 'scripts');
  const sendScript = path.join(skillDir, 'daemon-send.sh');
  
  const content = JSON.stringify({ message });
  const args = [sendScript, toAgent, content];
  if (subject) args.push('--subject', subject);
  args.push('--type', 'task');
  
  try {
    const result = execSync(args.join(' '), { 
      cwd: path.join(__dirname, '..'),
      timeout: 10000,
      encoding: 'utf8' 
    });
    return JSON.parse(result.trim());
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let to = '', message = '', subject = '', priority = 'normal', timeoutHours = 2;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--to': to = args[++i]; break;
      case '--message': case '-m': message = args[++i]; break;
      case '--subject': case '-s': subject = args[++i]; break;
      case '--priority': case '-p': priority = args[++i]; break;
      case '--timeout': timeoutHours = parseFloat(args[++i]); break;
    }
  }

  if (!to || !message) {
    console.error('Usage: node a2a-task-send.cjs --to <agent[,agent2]> --message "text" [--subject "text"] [--priority normal|urgent] [--timeout hours]');
    process.exit(1);
  }

  const fromAgent = detectSelf();
  const agents = to.split(',').map(a => a.trim().toLowerCase());
  const isBroadcast = agents.length > 1;

  // Create parent task for broadcasts
  let parentTaskId = null;
  if (isBroadcast) {
    parentTaskId = genTaskId();
    await supabaseInsert([{
      task_id: parentTaskId,
      from_agent: fromAgent,
      to_agent: 'broadcast',
      message,
      subject: subject || null,
      priority,
      status: 'sent',
      timeout_hours: timeoutHours,
      metadata: { agents, total: agents.length, completed: 0 },
    }]);
    console.log(`📡 Broadcast task: ${parentTaskId} → ${agents.join(', ')}`);
  }

  // Create child tasks + send A2A
  const results = [];
  for (const agent of agents) {
    const taskId = genTaskId();
    const taskMessage = `[TASK ${taskId}] ${message}\n\nWhen complete, run: node ~/rag/a2a-task-ack.cjs --task ${taskId} --summary "what you did"`;
    
    await supabaseInsert([{
      task_id: taskId,
      from_agent: fromAgent,
      to_agent: agent,
      message,
      subject: subject || null,
      priority,
      status: 'sent',
      parent_task_id: parentTaskId,
      timeout_hours: timeoutHours,
    }]);

    const a2aResult = sendA2A(agent, taskMessage, subject || `Task: ${taskId}`);
    const delivered = a2aResult.ok && !a2aResult.queued;

    if (delivered) {
      await fetch(`${SUPABASE_URL}/rest/v1/agent_tasks?task_id=eq.${taskId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'delivered', delivered_at: new Date().toISOString() }),
      });
    }

    results.push({ agent, taskId, delivered, queued: a2aResult.queued || false });
    console.log(`  ${delivered ? '✅' : '📨'} ${agent}: ${taskId} ${delivered ? '(delivered)' : '(queued)'}`);
  }

  if (isBroadcast) {
    const delivered = results.filter(r => r.delivered).length;
    console.log(`\n📊 Broadcast ${parentTaskId}: ${delivered}/${agents.length} delivered immediately`);
  }

  console.log('\nTrack status: node rag/a2a-task-status.cjs');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
