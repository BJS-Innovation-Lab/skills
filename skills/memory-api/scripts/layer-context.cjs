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
// GENERAL context loads for everyone (active goals, key refs, promoted learnings)
// ROLE-SPECIFIC context adds on top
const GENERAL_FILES = [
  'memory/core/team.md',
  'memory/core/clients.md',
  'memory/core/promoted.md',
];

const CONTEXT_ROUTES = {
  // Founders get everything — team status, active goals, working memory, decisions
  founders: {
    files: ['MEMORY.md'],
    workingDirs: ['memory/working/'],
    includeGoals: true,
    includeTeamStatus: true,
    includeRecent: true,
    recentChars: 600,
  },
  // Agents get operational context
  agents: {
    files: [],
    workingDirs: [],
    includeGoals: false,
    includeTeamStatus: true,
    includeRecent: true,
    recentChars: 400,
  },
  // Unknown/default — general context only
  default: {
    files: [],
    workingDirs: [],
    includeGoals: false,
    includeTeamStatus: false,
    includeRecent: true,
    recentChars: 300,
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
  
  // GENERAL context — always loaded regardless of who's talking
  for (const file of GENERAL_FILES) {
    const content = loadFile(file, 400);
    if (content) parts.push(content);
  }
  
  // Active goals from MEMORY.md (general knowledge)
  const memoryMd = loadFile('MEMORY.md', 2000);
  if (memoryMd) {
    // Extract ACTIVE GOALS and KEY REFS sections — these are general
    const goalsMatch = memoryMd.match(/# ACTIVE GOALS([\s\S]*?)(?=\n# |$)/);
    const refsMatch = memoryMd.match(/# KEY REFS([\s\S]*?)(?=\n# |$)/);
    const statusMatch = memoryMd.match(/# TEAM STATUS([\s\S]*?)(?=\n# |$)/);
    const promotedMatch = memoryMd.match(/# PROMOTED LEARNINGS([\s\S]*?)(?=\n# |$)/);
    
    if (goalsMatch) parts.push('# ACTIVE GOALS' + goalsMatch[1].trim());
    if (refsMatch) parts.push('# KEY REFS' + refsMatch[1].trim());
    if (statusMatch) parts.push('# TEAM STATUS' + statusMatch[1].trim());
    if (promotedMatch) parts.push('# PROMOTED LEARNINGS' + promotedMatch[1].trim());
  }
  
  // LEARNING CONTEXT — recent corrections and insights (don't repeat mistakes)
  const correctionsDir = path.join(WORKSPACE, 'memory', 'learning', 'corrections');
  const insightsDir = path.join(WORKSPACE, 'memory', 'learning', 'insights');
  const learningParts = [];
  
  for (const dir of [correctionsDir, insightsDir]) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse();
    for (const file of files.slice(0, 2)) { // Last 2 days
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      // Extract just the key fields, not full YAML
      const entries = content.match(/(?:corrected_to|insight):\s*"([^"]+)"/g) || [];
      for (const entry of entries.slice(0, 3)) {
        const val = entry.match(/:\s*"([^"]+)"/)?.[1];
        if (val) learningParts.push(`- ${val.substring(0, 150)}`);
      }
    }
  }
  if (learningParts.length > 0) {
    parts.push('## Recent Learnings\n' + learningParts.join('\n'));
  }
  
  // A2A RECENT — last messages from each agent
  const inboxPath = path.join(require('os').homedir(), '.openclaw', 'a2a', 'inbox.json');
  if (fs.existsSync(inboxPath)) {
    try {
      const inbox = JSON.parse(fs.readFileSync(inboxPath, 'utf-8'));
      const recent = inbox.slice(-10); // Last 10 messages
      const byAgent = {};
      for (const msg of recent) {
        const from = msg.fromName || msg.from || 'unknown';
        const content = typeof msg.content === 'object' 
          ? (msg.content.message || msg.content.status || JSON.stringify(msg.content)).substring(0, 100)
          : String(msg.content || '').substring(0, 100);
        const subject = msg.subject || '';
        byAgent[from] = `${subject ? subject + ': ' : ''}${content}`;
      }
      const a2aParts = Object.entries(byAgent).map(([from, msg]) => `- **${from}:** ${msg}`);
      if (a2aParts.length > 0) {
        parts.push('## Recent A2A Messages\n' + a2aParts.join('\n'));
      }
    } catch (e) { /* silent */ }
  }
  
  // ACTIVE PROJECTS — scan for project directories
  const projectsDir = path.join(WORKSPACE, 'projects');
  if (fs.existsSync(projectsDir)) {
    const projects = fs.readdirSync(projectsDir).filter(f => {
      return fs.statSync(path.join(projectsDir, f)).isDirectory();
    });
    if (projects.length > 0) {
      parts.push('## Active Projects\n' + projects.map(p => `- ${p}`).join('\n'));
    }
  }
  
  // REFLECTIONS — from the soul database (never compressed, pulled verbatim)
  const reflectScript = path.join(WORKSPACE, 'rag', 'reflect.cjs');
  if (fs.existsSync(reflectScript)) {
    try {
      const { execSync } = require('child_process');
      const recent = execSync(
        `cd ${WORKSPACE} && node rag/reflect.cjs --recent 3 2>/dev/null`,
        { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      if (recent && recent.includes('"')) {
        // Extract just the reflection texts
        const reflections = recent.match(/"([^"]+)"/g)?.slice(0, 3)?.map(r => r.replace(/"/g, '')) || [];
        if (reflections.length > 0) {
          parts.push('## Reflections (preserve verbatim)\n' + reflections.map(r => `- ${r.substring(0, 200)}`).join('\n'));
        }
      }
    } catch (e) { /* silent — reflections are optional */ }
  }
  
  // ROLE-SPECIFIC context
  for (const file of route.files) {
    if (file === 'MEMORY.md') continue; // Already extracted sections above
    const content = loadFile(file, 400);
    if (content) parts.push(content);
  }
  
  // Working memory (active threads)
  if (route.workingDirs.length > 0) {
    const working = getWorkingMemory(route.workingDirs);
    if (working) parts.push('## Active Threads\n' + working);
  }
  
  // Recent activity — always include for recency
  const recentChars = route.recentChars || 400;
  const recent = getRecentDaily(recentChars);
  if (recent) parts.push('## Recent Activity\n' + recent);
  
  // User preferences for founders
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
