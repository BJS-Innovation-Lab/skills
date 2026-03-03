#!/usr/bin/env node
/**
 * Registry Sync — Auto-register projects found in memory/projects/
 * 
 * Scans for project files/folders not in _registry.json and adds them.
 * Run nightly via cron to keep registry in sync.
 * 
 * Usage:
 *   node registry-sync.cjs [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const REGISTRY_PATH = path.join(WORKSPACE, 'memory/projects/_registry.json');
const PROJECTS_DIR = path.join(WORKSPACE, 'memory/projects');

const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

// Load registry
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return {
      "$schema": "project-registry-v1",
      "projects": {},
      "config": {
        "maxProjectsPerSession": 3,
        "autoDetect": true,
        "fallbackToSearch": true
      }
    };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

// Save registry
function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// Generate triggers from project name
function generateTriggers(name) {
  const triggers = [name];
  
  // Add individual words from kebab-case
  if (name.includes('-')) {
    const words = name.split('-').filter(w => w.length > 2);
    triggers.push(...words);
  }
  
  // Add without common suffixes
  const withoutSuffix = name.replace(/-project$|-client$|-work$/, '');
  if (withoutSuffix !== name) {
    triggers.push(withoutSuffix);
  }
  
  return [...new Set(triggers)]; // dedupe
}

// Find all projects in memory/projects/
function findProjects() {
  const projects = [];
  
  if (!fs.existsSync(PROJECTS_DIR)) {
    return projects;
  }
  
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    // Skip registry and hidden files
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    
    const fullPath = path.join(PROJECTS_DIR, entry.name);
    
    if (entry.isDirectory()) {
      // Check for PROJECT.md inside folder
      const projectMd = path.join(fullPath, 'PROJECT.md');
      if (fs.existsSync(projectMd)) {
        projects.push({
          name: entry.name,
          file: `memory/projects/${entry.name}/PROJECT.md`,
          type: 'folder'
        });
      }
    } else if (entry.name.endsWith('.md')) {
      // Flat markdown file
      const name = entry.name.replace('.md', '');
      projects.push({
        name: name,
        file: `memory/projects/${entry.name}`,
        type: 'file'
      });
    }
  }
  
  return projects;
}

// Main
function main() {
  console.log(`🔄 Registry Sync${dryRun ? ' (DRY RUN)' : ''}\n`);
  
  const registry = loadRegistry();
  const existingProjects = Object.keys(registry.projects || {});
  const foundProjects = findProjects();
  
  if (verbose) {
    console.log(`Found ${foundProjects.length} project(s) in memory/projects/`);
    console.log(`Registry has ${existingProjects.length} project(s)\n`);
  }
  
  let added = 0;
  let skipped = 0;
  
  for (const project of foundProjects) {
    if (existingProjects.includes(project.name)) {
      if (verbose) console.log(`⏭️  ${project.name} (already registered)`);
      skipped++;
      continue;
    }
    
    const triggers = generateTriggers(project.name);
    
    console.log(`➕ Adding: ${project.name}`);
    console.log(`   File: ${project.file}`);
    console.log(`   Triggers: ${triggers.join(', ')}`);
    
    if (!dryRun) {
      registry.projects[project.name] = {
        file: project.file,
        triggers: triggers,
        description: `${project.name} project (auto-registered)`
      };
    }
    
    added++;
  }
  
  // Check for orphaned registry entries (project deleted but still in registry)
  const orphaned = existingProjects.filter(name => 
    !foundProjects.some(p => p.name === name)
  );
  
  if (orphaned.length > 0) {
    console.log(`\n⚠️  Orphaned registry entries (project files missing):`);
    for (const name of orphaned) {
      console.log(`   - ${name}`);
    }
    console.log(`   (Run with --clean to remove these)`);
  }
  
  if (!dryRun && added > 0) {
    saveRegistry(registry);
  }
  
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Added: ${added} | Skipped: ${skipped} | Orphaned: ${orphaned.length}`);
}

main();
