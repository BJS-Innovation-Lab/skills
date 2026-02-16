#!/usr/bin/env node
/**
 * Layer 2: Context — Dynamic based on who's talking, channel, time
 * Routes to different memory subsets based on conversation context
 * Budget: ~1400 chars
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

// Context routing table — who gets what memory
const CONTEXT_ROUTES = {
  // Founders get team status, active goals, recent decisions
  founders: {
    files: ['memory/core/team.md', 'memory/core/clients.md'],
    workingDirs: ['memory/working/'],
    includeGoals: true,
    includeTeamStatus: true,
  },
  // Agents get their relevant operational context
  agents: {
    files: ['memory/core/team.md'],
    workingDirs: [],
    includeGoals: false,
    includeTeamStatus: true,
  },
  // Unknown/default — minimal safe context
  default: {
    files: [],
    workingDirs: [],
    includeGoals: false,
    includeTeamStatus: false,
  }
};

// Known identities
const IDENTITY_MAP = {
  // Telegram IDs
  '5063274787': { name: 'Bridget', role: 'founder', lang: 'en' },
  '6151122745': { name: 'Johan', role: 'founder', lang: 'es' },
  // Agent IDs
  'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb': { name: 'Santos', role: 'agent', lang: 'es' },
  '62bb0f39-2248-4b14-806d-1c498c654ee7': { name: 'Sam', role: 'agent', lang: 'en' },
  '415a84a4-af9e-4c98-9d48-040834436e44': { name: 'Saber', role: 'agent', lang: 'en' },
  'f6198962-313d-4a39-89eb-72755602d468': { name: 'Sage', role: 'agent', lang: 'en' },
};

function loadFile(relPath, maxChars = 500) {
  const fullPath = path.join(WORKSPACE, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8').substring(0, maxChars);
}

function getRecentDaily(maxChars = 600) {
  const memDir = path.join(WORKSPACE, 'memory');
  if (!fs.existsSync(memDir)) return '';
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let content = '';
  for (const date of [today, yesterday]) {
    const file = path.join(memDir, `${date}.md`);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      // Get last N chars (recency — most recent entries at bottom)
      content += raw.slice(-Math.floor(maxChars / 2)) + '\n';
    }
  }
  return content.substring(0, maxChars);
}

function getWorkingMemory(dirs, maxChars = 400) {
  let content = '';
  for (const dir of dirs) {
    const fullDir = path.join(WORKSPACE, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md')).sort().reverse();
    for (const file of files.slice(0, 3)) {
      const raw = fs.readFileSync(path.join(fullDir, file), 'utf-8');
      content += `### ${file}\n${raw.substring(0, 200)}\n\n`;
    }
  }
  return content.substring(0, maxChars);
}

function extractContext({ who, channel, message } = {}) {
  const parts = [];
  
  // Identify who's talking
  const identity = IDENTITY_MAP[who] || null;
  const routeKey = identity?.role === 'founder' ? 'founders' 
    : identity?.role === 'agent' ? 'agents' 
    : 'default';
  const route = CONTEXT_ROUTES[routeKey];
  
  // Context header
  if (identity) {
    parts.push(`## Session Context\nTalking to: ${identity.name} (${identity.role}) via ${channel || 'unknown'}`);
  }
  
  // Load routed files
  for (const file of route.files) {
    const content = loadFile(file, 400);
    if (content) parts.push(content);
  }
  
  // Working memory (active threads)
  if (route.workingDirs.length > 0) {
    const working = getWorkingMemory(route.workingDirs);
    if (working) parts.push('## Active Threads\n' + working);
  }
  
  // Team status
  if (route.includeTeamStatus) {
    const team = loadFile('memory/core/team.md', 300);
    if (team) parts.push(team);
  }
  
  // Recent activity (always include some recency)
  const recent = getRecentDaily(400);
  if (recent) parts.push('## Recent Activity\n' + recent);
  
  // User preferences
  if (identity?.role === 'founder') {
    const userMd = loadFile('USER.md', 300);
    if (userMd) parts.push(userMd);
  }
  
  return parts.join('\n\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const who = args[0] || 'unknown';
  const channel = args[1] || 'unknown';
  const message = args[2] || '';
  
  const result = extractContext({ who, channel, message });
  console.log(result);
  process.stderr.write(`[layer-context] ${result.length} chars, route=${who}\n`);
}

module.exports = { extractContext };
