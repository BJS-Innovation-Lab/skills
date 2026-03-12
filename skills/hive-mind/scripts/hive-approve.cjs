#!/usr/bin/env node
/**
 * 🐝 Hive Mind Approval (Queen only)
 * 
 * Review and approve pending agent registrations.
 * 
 * Usage:
 *   node hive-approve.cjs                    # List pending
 *   node hive-approve.cjs --approve sofia    # Approve sofia with their requested org
 *   node hive-approve.cjs --approve sofia --org cellosa  # Override org
 *   node hive-approve.cjs --reject sofia     # Reject registration
 */

require('./env-loader.cjs').loadEnv();
const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Parse args
const args = process.argv.slice(2);
const approveAgent = args.find((a, i) => args[i - 1] === '--approve');
const rejectAgent = args.find((a, i) => args[i - 1] === '--reject');
const overrideOrg = args.find((a, i) => args[i - 1] === '--org');
const listAll = args.includes('--all');

async function query(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '[]'));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listPending() {
  const filter = listAll ? '' : '&status=eq.pending';
  const url = `${SUPABASE_URL}/rest/v1/agent_orgs?select=*&order=created_at.desc${filter}`;
  return query(url);
}

async function approve(agentName, org) {
  const url = `${SUPABASE_URL}/rest/v1/agent_orgs?agent_name=eq.${encodeURIComponent(agentName)}`;
  return query(url, 'PATCH', {
    org: org,
    status: 'approved',
    requested_org: null
  });
}

async function reject(agentName) {
  const url = `${SUPABASE_URL}/rest/v1/agent_orgs?agent_name=eq.${encodeURIComponent(agentName)}`;
  return query(url, 'DELETE');
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }
  
  // Approve action
  if (approveAgent) {
    const pending = await listPending();
    const agent = pending.find(a => a.agent_name === approveAgent);
    
    if (!agent) {
      console.error(`❌ No pending registration for "${approveAgent}"`);
      process.exit(1);
    }
    
    const finalOrg = overrideOrg || agent.requested_org;
    await approve(approveAgent, finalOrg);
    console.log(`✅ Approved: ${approveAgent} → ${finalOrg}`);
    return;
  }
  
  // Reject action
  if (rejectAgent) {
    await reject(rejectAgent);
    console.log(`🗑️  Rejected and removed: ${rejectAgent}`);
    return;
  }
  
  // List pending (default)
  const registrations = await listPending();
  
  if (registrations.length === 0) {
    console.log(listAll ? '📋 No registrations found.' : '✅ No pending registrations.');
    return;
  }
  
  console.log(`\n🐝 ${listAll ? 'All' : 'Pending'} Registrations\n`);
  
  for (const reg of registrations) {
    const status = reg.status === 'pending' ? '⏳' : '✅';
    const orgDisplay = reg.status === 'pending' 
      ? `requested: ${reg.requested_org}` 
      : reg.org;
    console.log(`${status} ${reg.agent_name.padEnd(15)} ${orgDisplay.padEnd(20)} ${reg.role}`);
  }
  
  if (!listAll) {
    console.log(`\nTo approve: node hive-approve.cjs --approve <agent>`);
    console.log(`To reject:  node hive-approve.cjs --reject <agent>`);
    console.log(`To list all: node hive-approve.cjs --all`);
  }
}

main();
