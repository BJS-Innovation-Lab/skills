#!/usr/bin/env node
/**
 * 🐝 Hive Mind Self-Registration
 * 
 * Agents run this to request org membership.
 * Goes to "pending" status until Sybil (queen) approves.
 * 
 * Usage:
 *   node hive-register.cjs --org cellosa
 *   node hive-register.cjs --org vulkn
 */

require('./env-loader.cjs').loadEnv();
const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const AGENT_NAME = process.env.AGENT_NAME || 'unknown';

// Parse args
const args = process.argv.slice(2);
const requestedOrg = args.find((a, i) => args[i - 1] === '--org');

if (!requestedOrg) {
  console.log(`
🐝 Hive Mind Registration

Usage: node hive-register.cjs --org <org-name>

Examples:
  node hive-register.cjs --org vulkn     # Request VULKN HQ access
  node hive-register.cjs --org cellosa   # Request Cellosa client access

Your request goes to pending status until approved by Sybil (queen).
`);
  process.exit(0);
}

async function checkExisting() {
  const url = `${SUPABASE_URL}/rest/v1/agent_orgs?agent_name=eq.${encodeURIComponent(AGENT_NAME)}&select=*`;
  
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          resolve(results[0] || null);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function register(agentName, org) {
  const url = `${SUPABASE_URL}/rest/v1/agent_orgs`;
  const body = JSON.stringify({
    agent_name: agentName,
    org: 'pending',  // Actual org stored in requested_org until approved
    requested_org: org,
    status: 'pending',
    role: 'member'
  });
  
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`Registration failed: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
  }
  
  if (AGENT_NAME === 'unknown') {
    console.error('❌ AGENT_NAME not set. Set it in your environment.');
    process.exit(1);
  }
  
  console.log(`\n🐝 Hive Mind Registration`);
  console.log(`   Agent: ${AGENT_NAME}`);
  console.log(`   Requested org: ${requestedOrg}\n`);
  
  // Check if already registered
  const existing = await checkExisting();
  
  if (existing) {
    if (existing.status === 'approved') {
      console.log(`✅ Already registered in "${existing.org}" (approved)`);
      if (existing.org !== requestedOrg) {
        console.log(`   To change orgs, contact Sybil (queen).`);
      }
    } else if (existing.status === 'pending') {
      console.log(`⏳ Registration pending approval`);
      console.log(`   Requested org: ${existing.requested_org}`);
      console.log(`   Sybil will review during her next Hive Mind check.`);
    }
    return;
  }
  
  // Register
  try {
    await register(AGENT_NAME, requestedOrg);
    console.log(`✅ Registration submitted!`);
    console.log(`   Status: pending`);
    console.log(`   Sybil (queen) will approve during her next Hive Mind check.`);
    console.log(`   Until then, you'll have access to "general" namespace only.`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

main();
