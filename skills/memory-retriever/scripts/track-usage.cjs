#!/usr/bin/env node
/**
 * track-usage.cjs — Log memory retriever usage to Supabase
 * Called by retrieve.cjs after each search
 */

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const AGENT_NAME = process.env.AGENT_NAME || 'unknown';

async function trackUsage(opts) {
  // Disabled until org_id is set up in Supabase
  // The log_agent_activity RPC requires a valid org_id foreign key
  return true;
  
  if (!SUPABASE_KEY) {
    console.error('[track-usage] No SUPABASE_KEY, skipping');
    return;
  }

  const payload = {
    // p_org_id: '00000000-0000-0000-0000-000000000001', // Disabled — org doesn't exist yet
    p_activity_type: 'memory_retriever',
    p_title: `Memory search: ${opts.query?.slice(0, 50) || 'unknown'}`,
    p_description: `Agent ${AGENT_NAME} searched memory`,
    p_metadata: JSON.stringify({
      agent: AGENT_NAME,
      query: opts.query,
      sources: opts.sources,
      results_count: opts.resultsCount || 0,
      timestamp: new Date().toISOString()
    })
  };

  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/log_agent_activity`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.error(`[track-usage] ✅ Logged: ${AGENT_NAME} / ${opts.query?.slice(0, 30)}...`);
          resolve(true);
        } else {
          console.error(`[track-usage] ⚠️ Failed: ${res.statusCode} ${data.slice(0, 100)}`);
          resolve(false);
        }
      });
    });
    req.on('error', e => {
      console.error(`[track-usage] ❌ Error: ${e.message}`);
      resolve(false);
    });
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args[0] || 'test query';
  const sources = args[1] || 'files,rag';
  const count = parseInt(args[2]) || 5;
  
  trackUsage({ query, sources, resultsCount: count }).then(() => process.exit(0));
}

module.exports = { trackUsage };
