#!/usr/bin/env node
/**
 * a2a-task-status.cjs — Dashboard for task tracking
 * 
 * Usage:
 *   node a2a-task-status.cjs                    # All open tasks
 *   node a2a-task-status.cjs --agent sam         # Tasks for specific agent
 *   node a2a-task-status.cjs --overdue           # Only overdue tasks
 *   node a2a-task-status.cjs --broadcast TASK-ID # Broadcast rollup
 *   node a2a-task-status.cjs --all               # Include completed tasks (last 24h)
 *   node a2a-task-status.cjs --json              # JSON output for scripts
 */

const fs = require('fs');
const path = require('path');

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

async function query(endpoint) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return resp.json();
}

function formatAge(ms) {
  const h = ms / 3600000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${Math.round(h * 10) / 10}h`;
  return `${Math.round(h / 24)}d`;
}

async function main() {
  const args = process.argv.slice(2);
  let agent = '', overdue = false, broadcastId = '', showAll = false, jsonOut = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--agent': agent = args[++i]; break;
      case '--overdue': overdue = true; break;
      case '--broadcast': broadcastId = args[++i]; break;
      case '--all': showAll = true; break;
      case '--json': jsonOut = true; break;
    }
  }

  // Broadcast rollup
  if (broadcastId) {
    const children = await query(`agent_tasks?parent_task_id=eq.${broadcastId}&order=to_agent.asc`);
    const parent = await query(`agent_tasks?task_id=eq.${broadcastId}`);
    
    if (jsonOut) { console.log(JSON.stringify({ parent: parent[0], children })); return; }
    
    if (parent.length) {
      console.log(`\n📡 Broadcast: ${broadcastId}`);
      console.log(`   Message: ${parent[0].message.slice(0, 100)}`);
      console.log();
    }
    
    const completed = children.filter(c => c.status === 'completed').length;
    for (const c of children) {
      const icon = c.status === 'completed' ? '✅' : c.status === 'failed' ? '❌' : '🟡';
      console.log(`${icon} ${c.to_agent.padEnd(10)} ${c.status.padEnd(12)} ${c.completion_summary || '(pending)'}`);
    }
    console.log(`\n📊 ${completed}/${children.length} completed`);
    return;
  }

  // Build query
  let endpoint = 'agent_tasks?';
  if (!showAll) {
    endpoint += 'status=in.(sent,delivered,acknowledged)&';
  } else {
    // Show last 24h including completed
    const since = new Date(Date.now() - 86400000).toISOString();
    endpoint += `created_at=gte.${since}&`;
  }
  if (agent) endpoint += `to_agent=eq.${agent}&`;
  endpoint += 'to_agent=neq.broadcast&order=created_at.desc&limit=50';

  const tasks = await query(endpoint);

  if (jsonOut) { console.log(JSON.stringify(tasks)); return; }

  // Filter overdue if requested
  const now = Date.now();
  let filtered = tasks;
  if (overdue) {
    filtered = tasks.filter(t => {
      const age = (now - new Date(t.created_at).getTime()) / 3600000;
      return age > t.timeout_hours && !['completed', 'failed'].includes(t.status);
    });
  }

  if (!filtered.length) {
    console.log(overdue ? '✅ No overdue tasks.' : '✅ No open tasks.');
    return;
  }

  console.log(`\n📋 ${filtered.length} task(s)${agent ? ` for ${agent}` : ''}${overdue ? ' (OVERDUE)' : ''}:\n`);

  // Group by agent
  const byAgent = {};
  for (const t of filtered) {
    if (!byAgent[t.to_agent]) byAgent[t.to_agent] = [];
    byAgent[t.to_agent].push(t);
  }

  for (const [ag, agTasks] of Object.entries(byAgent)) {
    console.log(`── ${ag} ──`);
    for (const t of agTasks) {
      const age = now - new Date(t.created_at).getTime();
      const isOverdue = age / 3600000 > t.timeout_hours && !['completed', 'failed'].includes(t.status);
      const icon = t.status === 'completed' ? '✅' : t.status === 'failed' ? '❌' : isOverdue ? '🔴' : '🟡';
      
      console.log(`  ${icon} ${t.task_id} [${t.status}] ${formatAge(age)} ago — from ${t.from_agent}`);
      if (t.subject) console.log(`     📌 ${t.subject}`);
      console.log(`     ${t.message.slice(0, 100)}${t.message.length > 100 ? '...' : ''}`);
      if (t.completion_summary) console.log(`     💬 ${t.completion_summary}`);
      console.log();
    }
  }

  // Summary
  const overdueCount = filtered.filter(t => {
    const age = (now - new Date(t.created_at).getTime()) / 3600000;
    return age > t.timeout_hours && !['completed', 'failed'].includes(t.status);
  }).length;
  
  if (overdueCount > 0) {
    console.log(`⚠️  ${overdueCount} OVERDUE task(s) — need attention!`);
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
