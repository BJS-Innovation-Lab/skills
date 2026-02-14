#!/usr/bin/env node

/**
 * Agentic Learning System - Uninstall Script
 * 
 * Removes the learning directory and all data.
 * Run from workspace: node skills/agentic-learning/setup/uninstall.js
 */

const fs = require('fs');
const path = require('path');

// Resolve workspace directory
const workspaceDir = process.env.OPENCLAW_WORKSPACE || path.resolve(process.cwd());
const learningDir = path.join(workspaceDir, 'learning');

console.log('🧠 Agentic Learning System - Uninstall');
console.log('======================================');
console.log(`Workspace: ${workspaceDir}`);
console.log(`Learning directory: ${learningDir}`);
console.log('');

// Check if exists
if (!fs.existsSync(learningDir)) {
  console.log('❌ Learning directory not found. Nothing to uninstall.');
  process.exit(0);
}

// Confirm
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

if (!force) {
  console.log('⚠️  This will DELETE all learning data:');
  console.log('   - Events log');
  console.log('   - Decisions');
  console.log('   - Procedures');
  console.log('   - Memory hierarchy');
  console.log('   - Evolution history');
  console.log('');
  console.log('To confirm, run with --force:');
  console.log('  node skills/agentic-learning/setup/uninstall.js --force');
  console.log('');
  console.log('To backup first:');
  console.log('  cp -r learning learning-backup-$(date +%Y%m%d)');
  console.log('');
  process.exit(1);
}

// Remove directory recursively
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

console.log('🗑️  Removing learning directory...');
removeDir(learningDir);

console.log('');
console.log('✅ Uninstall complete!');
console.log('');
console.log('The skill files remain in skills/agentic-learning/');
console.log('To remove the skill entirely:');
console.log('  rm -rf skills/agentic-learning');
console.log('');
