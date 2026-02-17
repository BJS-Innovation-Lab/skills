#!/usr/bin/env node
/**
 * Field Security — Security Monitor
 * 
 * Aggregates security events, tracks user reputation, and alerts HQ.
 * Designed for heartbeat integration and daily digests.
 * 
 * Usage:
 *   node security-monitor.cjs --heartbeat          # Check for new threats (for heartbeat)
 *   node security-monitor.cjs --digest             # Daily security summary
 *   node security-monitor.cjs --reputation 12345   # User reputation score
 *   node security-monitor.cjs --alert "message"    # Immediate HQ alert
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const LOG_FILE = path.join(WS, 'memory/security/events.jsonl');
const REPUTATION_FILE = path.join(WS, 'memory/security/reputation.json');

// ============== EVENT LOADING ==============
function loadEvents(hours = 24) {
  if (!fs.existsSync(LOG_FILE)) return [];
  
  const cutoff = Date.now() - hours * 3600000;
  const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
  
  return lines.map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(e => e && new Date(e.timestamp).getTime() > cutoff);
}

// ============== REPUTATION ==============
function loadReputation() {
  if (!fs.existsSync(REPUTATION_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(REPUTATION_FILE, 'utf-8')); } catch { return {}; }
}

function saveReputation(rep) {
  const dir = path.dirname(REPUTATION_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REPUTATION_FILE, JSON.stringify(rep, null, 2));
}

function updateReputation(events) {
  const rep = loadReputation();
  
  for (const evt of events) {
    const uid = evt.userId || 'unknown';
    if (!rep[uid]) {
      rep[uid] = { score: 100, totalMessages: 0, violations: 0, blocked: 0, lastViolation: null };
    }
    
    rep[uid].totalMessages++;
    
    if (evt.severity !== 'SAFE') {
      rep[uid].violations++;
      rep[uid].lastViolation = evt.timestamp;
      
      // Score penalties
      const penalties = { LOW: 1, MEDIUM: 3, HIGH: 10, CRITICAL: 25 };
      rep[uid].score = Math.max(0, rep[uid].score - (penalties[evt.severity] || 0));
      
      if (evt.action === 'block' || evt.action === 'block_notify') {
        rep[uid].blocked++;
      }
    } else {
      // Slow recovery: +0.5 per safe message (max 100)
      rep[uid].score = Math.min(100, rep[uid].score + 0.5);
    }
  }
  
  saveReputation(rep);
  return rep;
}

function getUserReputation(userId) {
  const rep = loadReputation();
  const user = rep[userId];
  
  if (!user) return { userId, score: 100, status: 'unknown', message: 'No data for this user.' };
  
  let status = 'trusted';
  if (user.score < 25) status = 'dangerous';
  else if (user.score < 50) status = 'suspicious';
  else if (user.score < 75) status = 'caution';
  
  return { userId, ...user, status };
}

// ============== HEARTBEAT ==============
function heartbeatCheck() {
  const events = loadEvents(1); // Last 1 hour
  
  if (events.length === 0) {
    // No events at all — nothing to report
    return null;
  }
  
  const threats = events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');
  
  if (threats.length === 0) return null; // No high/critical threats
  
  // Build alert
  const summary = threats.map(t => 
    `[${t.severity}] ${t.findings?.[0]?.category || 'unknown'}/${t.findings?.[0]?.subcategory || '?'} from user ${t.userId || '?'}`
  ).join('\n');
  
  return {
    alert: true,
    threatCount: threats.length,
    summary,
    recommendation: threats.length >= 3 
      ? 'ESCALATE: Multiple high-severity threats detected. Consider temporarily blocking the user.'
      : 'MONITOR: Individual threat detected. Review events log.'
  };
}

// ============== DIGEST ==============
function generateDigest() {
  const events24h = loadEvents(24);
  const events7d = loadEvents(168);
  
  if (events24h.length === 0 && events7d.length === 0) {
    return '🛡️ Security Digest: No events in the past 7 days. All clear.';
  }
  
  const bySeverity = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const byCategory = {};
  const byUser = {};
  
  for (const e of events24h) {
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    const cat = e.findings?.[0]?.category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    const uid = e.userId || 'unknown';
    byUser[uid] = (byUser[uid] || 0) + 1;
  }
  
  let digest = `🛡️ Security Digest (Last 24h)\n`;
  digest += `━━━━━━━━━━━━━━━━━━\n`;
  digest += `Total events: ${events24h.length}\n`;
  digest += `By severity: 🚨 CRITICAL: ${bySeverity.CRITICAL} | 🛑 HIGH: ${bySeverity.HIGH} | ⚠️ MEDIUM: ${bySeverity.MEDIUM} | 📝 LOW: ${bySeverity.LOW}\n`;
  
  if (Object.keys(byCategory).length > 0) {
    digest += `\nBy category:\n`;
    for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      digest += `  ${cat}: ${count}\n`;
    }
  }
  
  if (Object.keys(byUser).length > 0) {
    digest += `\nBy user (top 5):\n`;
    const topUsers = Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const rep = loadReputation();
    for (const [uid, count] of topUsers) {
      const score = rep[uid]?.score ?? 100;
      const emoji = score < 50 ? '🔴' : score < 75 ? '🟡' : '🟢';
      digest += `  ${emoji} ${uid}: ${count} events (trust: ${Math.round(score)})\n`;
    }
  }
  
  // 7-day trend
  digest += `\n7-day total: ${events7d.length} events`;
  const highCritical7d = events7d.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').length;
  if (highCritical7d > 0) {
    digest += ` (${highCritical7d} high/critical)`;
  }
  
  return digest;
}

// ============== HQ ALERT ==============
function sendHQAlert(message) {
  // Load config for HQ agent ID
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(path.join(WS, '.field-security.json'), 'utf-8'));
  } catch {}
  
  const hqAgentId = config.hq_agent_id || '5fae1839-ab85-412c-acc0-033cbbbbd15b'; // Default: Sybil
  
  // Try A2A daemon
  const sendScript = path.join(WS, 'bjs-a2a-protocol/scripts/daemon-send.sh');
  if (fs.existsSync(sendScript)) {
    const { execSync } = require('child_process');
    try {
      const payload = JSON.stringify({
        type: 'security_alert',
        from: process.env.AGENT_NAME || 'field-agent',
        alert: message,
        timestamp: new Date().toISOString()
      });
      execSync(`bash "${sendScript}" "${hqAgentId}" '${payload.replace(/'/g, "\\'")}' --type alert --subject "🚨 Security Alert" --priority urgent`, {
        timeout: 10000
      });
      console.log('✅ Alert sent to HQ via A2A');
      return true;
    } catch (e) {
      console.error('⚠️ A2A alert failed:', e.message);
    }
  }
  
  // Fallback: write to file for heartbeat pickup
  const alertFile = path.join(WS, 'memory/security/pending-alerts.jsonl');
  const dir = path.dirname(alertFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(alertFile, JSON.stringify({ message, timestamp: new Date().toISOString() }) + '\n');
  console.log('📄 Alert written to pending-alerts.jsonl (will be picked up on heartbeat)');
  return false;
}

// ============== CLI ==============
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--heartbeat')) {
    const result = heartbeatCheck();
    if (!result) {
      // No threats — silent
      process.exit(0);
    }
    console.log(`🚨 SECURITY ALERT: ${result.threatCount} threats in last hour`);
    console.log(result.summary);
    console.log(result.recommendation);
    
    // Auto-alert HQ for critical
    if (result.threatCount >= 3) {
      sendHQAlert(result.summary);
    }
    process.exit(1);
  }
  
  if (args.includes('--digest')) {
    console.log(generateDigest());
    process.exit(0);
  }
  
  const repIdx = args.indexOf('--reputation');
  if (repIdx !== -1) {
    const userId = args[repIdx + 1];
    if (!userId) { console.error('Usage: --reputation <userId>'); process.exit(1); }
    const rep = getUserReputation(userId);
    console.log(JSON.stringify(rep, null, 2));
    process.exit(0);
  }
  
  const alertIdx = args.indexOf('--alert');
  if (alertIdx !== -1) {
    const message = args[alertIdx + 1];
    if (!message) { console.error('Usage: --alert "message"'); process.exit(1); }
    sendHQAlert(message);
    process.exit(0);
  }
  
  // Default: update reputation from recent events
  const events = loadEvents(1);
  if (events.length > 0) {
    updateReputation(events);
    console.log(`Updated reputation for ${events.length} events`);
  } else {
    console.log('No recent events');
  }
}

if (require.main === module) main();

module.exports = { heartbeatCheck, generateDigest, getUserReputation, updateReputation };
