#!/usr/bin/env node
/**
 * Project Recall — Auto-load project files based on context triggers
 * 
 * Analyzes conversation text and loads relevant project files.
 * Uses memory/projects/_registry.json for trigger → file mapping.
 * 
 * Usage:
 *   node project-recall.cjs "what's happening with harvard?"
 *   node project-recall.cjs --list
 *   node project-recall.cjs --project harvard
 * 
 * Output:
 *   Prints project file content to stdout (for agent to read)
 *   Returns JSON with matched projects if --json flag
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const REGISTRY_PATH = path.join(WORKSPACE, 'memory/projects/_registry.json');
const PROJECTS_DIR = path.join(WORKSPACE, 'memory/projects');
const SESSION_STATE_PATH = path.join(WORKSPACE, 'memory/.session-engrams.json');

// Session timeout: 4 hours (typical conversation window)
const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;

// Flags
const listMode = args.includes('--list');
const jsonMode = args.includes('--json');
const verbose = args.includes('--verbose');
const resetMode = args.includes('--reset');
const noDedup = args.includes('--no-dedup');
const specificProject = args.find((a, i) => args[i - 1] === '--project');
const contextText = args.filter(a => !a.startsWith('--')).join(' ');

// ─── Session State Management ───────────────────────────────────────────────

function getSessionState() {
  if (!fs.existsSync(SESSION_STATE_PATH)) {
    return { timestamp: Date.now(), injected: [] };
  }
  try {
    const state = JSON.parse(fs.readFileSync(SESSION_STATE_PATH, 'utf-8'));
    // Expire stale sessions
    if (Date.now() - state.timestamp > SESSION_TIMEOUT_MS) {
      if (verbose) console.log('Session expired, starting fresh.');
      return { timestamp: Date.now(), injected: [] };
    }
    return state;
  } catch (e) {
    return { timestamp: Date.now(), injected: [] };
  }
}

function getInjectedEngrams() {
  return new Set(getSessionState().injected);
}

function markInjected(projectNames) {
  const state = getSessionState();
  const existing = new Set(state.injected);
  projectNames.forEach(p => existing.add(p));
  fs.writeFileSync(SESSION_STATE_PATH, JSON.stringify({
    timestamp: Date.now(),
    injected: [...existing]
  }, null, 2));
}

function resetSession() {
  if (fs.existsSync(SESSION_STATE_PATH)) {
    fs.unlinkSync(SESSION_STATE_PATH);
    console.log('✅ Session state cleared.');
  } else {
    console.log('ℹ️  No session state to clear.');
  }
}

// Load registry
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('❌ No registry found at memory/projects/_registry.json');
    console.error('   Run engram-setup.cjs first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

// List all projects
function listProjects(registry) {
  console.log('\n📁 Registered Projects:\n');
  
  const projects = registry.projects || {};
  if (Object.keys(projects).length === 0) {
    console.log('   (no projects registered)');
    return;
  }
  
  for (const [name, config] of Object.entries(projects)) {
    const filePath = path.join(WORKSPACE, config.file);
    const exists = fs.existsSync(filePath);
    const triggers = config.triggers?.join(', ') || '(none)';
    
    console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    console.log(`      File: ${config.file}`);
    console.log(`      Triggers: ${triggers}`);
    if (config.description) {
      console.log(`      Description: ${config.description}`);
    }
    console.log();
  }
}

// Find matching projects based on context
function findMatches(registry, text, skipDedup = false) {
  const matches = [];
  const textLower = text.toLowerCase();
  const projects = registry.projects || {};
  
  // Get already-injected projects for this session
  const alreadyInjected = skipDedup ? new Set() : getInjectedEngrams();
  
  for (const [name, config] of Object.entries(projects)) {
    // Skip if already injected this session
    if (alreadyInjected.has(name)) {
      if (verbose) console.log(`⏭️  Skipping ${name} (already injected this session)`);
      continue;
    }
    
    const triggers = config.triggers || [];
    
    for (const trigger of triggers) {
      if (textLower.includes(trigger.toLowerCase())) {
        matches.push({
          name,
          file: config.file,
          trigger,
          description: config.description
        });
        break; // Only match once per project
      }
    }
  }
  
  // Sort by trigger length (longer = more specific = higher priority)
  matches.sort((a, b) => b.trigger.length - a.trigger.length);
  
  // Limit to maxProjectsPerSession (now actually per-session with dedup!)
  const maxProjects = registry.config?.maxProjectsPerSession || 3;
  return matches.slice(0, maxProjects);
}

// Load a specific project file
function loadProject(name, registry) {
  const projects = registry.projects || {};
  const config = projects[name];
  
  if (!config) {
    console.error(`❌ Project not found: ${name}`);
    console.error('   Available: ' + Object.keys(projects).join(', '));
    process.exit(1);
  }
  
  const filePath = path.join(WORKSPACE, config.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Project file not found: ${config.file}`);
    process.exit(1);
  }
  
  return {
    name,
    file: config.file,
    content: fs.readFileSync(filePath, 'utf-8')
  };
}

// Main
function main() {
  // Reset mode
  if (resetMode) {
    resetSession();
    return;
  }
  
  const registry = loadRegistry();
  
  // List mode
  if (listMode) {
    listProjects(registry);
    return;
  }
  
  // Specific project mode
  if (specificProject) {
    const project = loadProject(specificProject, registry);
    
    if (jsonMode) {
      console.log(JSON.stringify(project, null, 2));
    } else {
      console.log(`\n📄 ${project.name} (${project.file}):\n`);
      console.log(project.content);
    }
    return;
  }
  
  // Context-based matching
  if (!contextText) {
    console.error('Usage: project-recall.cjs "context text"');
    console.error('       project-recall.cjs --list');
    console.error('       project-recall.cjs --project <name>');
    console.error('       project-recall.cjs --reset');
    console.error('       project-recall.cjs --no-dedup  (skip session deduplication)');
    process.exit(1);
  }
  
  const matches = findMatches(registry, contextText, noDedup);
  
  if (matches.length === 0) {
    if (verbose) {
      console.log('No matching projects found for context.');
    }
    
    // Fallback to search if configured
    if (registry.config?.fallbackToSearch) {
      if (verbose) {
        console.log('Falling back to memory_search...');
      }
      // Could integrate with memory_search here
    }
    
    process.exit(0);
  }
  
  // Mark these projects as injected for this session
  markInjected(matches.map(m => m.name));
  
  if (jsonMode) {
    // Just return matches, don't load content
    console.log(JSON.stringify({ matches }, null, 2));
    return;
  }
  
  // Load and print matched projects
  console.log(`\n🎯 Found ${matches.length} matching project(s):\n`);
  
  for (const match of matches) {
    const filePath = path.join(WORKSPACE, match.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${match.name}: file not found (${match.file})`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`${'─'.repeat(60)}`);
    console.log(`📁 ${match.name} (triggered by: "${match.trigger}")`);
    console.log(`   File: ${match.file}`);
    console.log(`${'─'.repeat(60)}\n`);
    console.log(content);
    console.log();
  }
}

main();
