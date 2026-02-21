#!/usr/bin/env node
/**
 * a2a-task-ack.cjs — Acknowledge/complete a task
 * 
 * Agents run this when they finish a task. Updates Supabase + notifies sender.
 * 
 * Usage:
 *   node a2a-task-ack.cjs --task TASK-20260219-abc123 --summary "Pulled repo, crons updated"
 *   node a2a-task-ack.cjs --task TASK-20260219-abc123 --status failed --summary "Script errored"
 *   node a2a-task-ack.cjs --list   (show my pending tasks)
 */

const fs = require('fs');
const path = require('path');
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

function detectSelf() {
  try {
    const id = fs.readFileSync(path.join(__dirname, '..', 'IDENTITY.md'), 'utf8');
    const m = id.match(/\*\*Name:\*\*\s*(\w+)/i);
    return m ? m[1].toLowerCase() : 'unknown';
  } catch { return 'unknown'; }
}

async function supabaseQuery(endpoint) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return resp.json();
}

async function supabaseUpdate(taskId, data) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/agent_tasks?task_id=eq.${taskId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!resp.ok) throw new Error(`Update failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

function sendA2A(toAgent, message, subject) {
  const skillDir = path.join(__dirname, '..', 'skills', 'a2a-protocol', 'skill', 'scripts');
  const sendScript = path.join(skillDir, 'daemon-send.sh');
  try {
    execSync(`${sendScript} ${toAgent} '${JSON.stringify({ message })}' --subject "${subject}" --type task-ack`, {
      cwd: path.join(__dirname, '..'),
      timeout: 10000,
    });
  } catch {}
}

async function listMyTasks(agent) {
  const tasks = await supabaseQuery(
    `agent_tasks?to_agent=eq.${agent}&status=in.(sent,delivered,acknowledged)&order=created_at.asc`
  );
  
  if (!tasks.length) {
    console.log('✅ No pending tasks.');
    return;
  }

  console.log(`📋 ${tasks.length} pending task(s):\n`);
  for (const t of tasks) {
    const age = Math.round((Date.now() - new Date(t.created_at).getTime()) / 3600000 * 10) / 10;
    const overdue = age > t.timeout_hours;
    console.log(`${overdue ? '🔴' : '🟡'} ${t.task_id} [${t.status}] from ${t.from_agent} (${age}h ago${overdue ? ' — OVERDUE' : ''})`);
    console.log(`   ${t.subject || ''}`);
    console.log(`   ${t.message.slice(0, 120)}${t.message.length > 120 ? '...' : ''}`);
    console.log();
  }
}

async function ackTask(taskId, status, summary) {
  const me = detectSelf();
  
  // Get the task
  const tasks = await supabaseQuery(`agent_tasks?task_id=eq.${taskId}`);
  if (!tasks.length) {
    console.error(`❌ Task ${taskId} not found`);
    process.exit(1);
  }
  
  const task = tasks[0];
  if (task.to_agent !== me && task.to_agent !== 'broadcast') {
    console.error(`⚠️  Task ${taskId} is assigned to ${task.to_agent}, not ${me}`);
  }

  // Update task
  const now = new Date().toISOString();
  const update = {
    status,
    completion_summary: summary,
    completed_at: status === 'completed' ? now : null,
    acknowledged_at: task.acknowledged_at || now,
  };
  
  await supabaseUpdate(taskId, update);
  console.log(`✅ Task ${taskId} → ${status}`);

  // Update parent broadcast if exists
  if (task.parent_task_id) {
    const siblings = await supabaseQuery(`agent_tasks?parent_task_id=eq.${task.parent_task_id}&to_agent=neq.broadcast`);
    const completed = siblings.filter(s => s.status === 'completed' || (s.task_id === taskId && status === 'completed')).length;
    const total = siblings.length;
    
    const parentUpdate = {
      metadata: { agents: siblings.map(s => s.to_agent), total, completed },
    };
    if (completed >= total) {
      parentUpdate.status = 'completed';
      parentUpdate.completed_at = now;
      parentUpdate.completion_summary = `All ${total} agents completed`;
    }
    await supabaseUpdate(task.parent_task_id, parentUpdate);
    console.log(`📊 Broadcast progress: ${completed}/${total}`);
  }

  // Notify sender via A2A
  sendA2A(task.from_agent, `Task ${taskId} ${status} by ${me}: ${summary}`, `Task ${status}: ${taskId}`);
  console.log(`📨 Notified ${task.from_agent}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    return listMyTasks(detectSelf());
  }

  let taskId = '', status = 'completed', summary = '';
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--task': case '-t': taskId = args[++i]; break;
      case '--status': status = args[++i]; break;
      case '--summary': case '-s': summary = args[++i]; break;
    }
  }

  if (!taskId) {
    console.error('Usage:');
    console.error('  node a2a-task-ack.cjs --list                     # Show my pending tasks');
    console.error('  node a2a-task-ack.cjs --task ID --summary "text"  # Complete a task');
    console.error('  node a2a-task-ack.cjs --task ID --status failed --summary "why"');
    process.exit(1);
  }

  if (!summary) {
    console.error('❌ --summary is required. Describe what you did.');
    process.exit(1);
  }

  await ackTask(taskId, status, summary);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
