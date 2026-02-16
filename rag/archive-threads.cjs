#!/usr/bin/env node
/**
 * archive-threads.cjs — Archive completed working threads older than N days
 * 
 * Moves stale thread files from memory/working/ to memory/archive/YYYY-MM/
 * Keeps the content searchable (archived files still get synced to Supabase)
 * but cleans up the active working directory.
 * 
 * Usage:
 *   node archive-threads.cjs                    # Archive threads >7 days old (default)
 *   node archive-threads.cjs --days 3           # Archive threads >3 days old
 *   node archive-threads.cjs --dry-run          # Preview what would be archived
 *   node archive-threads.cjs --all              # Archive ALL threads (nuclear option)
 * 
 * Detection:
 *   - File modification time (mtime) is the primary signal
 *   - Files with "resolved", "completed", "closed", "done" in content are prioritized
 *   - Escalation index files are preserved (never archived)
 * 
 * Env: WORKSPACE (optional, defaults to ~/.openclaw/workspace)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const WORKING_DIR = path.join(WORKSPACE, 'memory/working');
const ARCHIVE_BASE = path.join(WORKSPACE, 'memory/archive');

// --- Args ---
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ARCHIVE_ALL = args.includes('--all');
const daysIdx = args.indexOf('--days');
const MAX_AGE_DAYS = daysIdx >= 0 ? parseInt(args[daysIdx + 1]) : 7;

// --- Helpers ---
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getArchivePath(file, mtime) {
  const month = mtime.toISOString().slice(0, 7); // YYYY-MM
  return path.join(ARCHIVE_BASE, month, file);
}

function isProtected(filename) {
  // Never archive these
  return filename.includes('index.md') || 
         filename.startsWith('escalations') ||
         filename === '.gitkeep';
}

function isResolved(content) {
  const lower = content.toLowerCase();
  const signals = ['resolved', 'completed', 'closed', 'done', 'archived', 
                   'no action needed', 'no further action', 'all good'];
  return signals.some(s => lower.includes(s));
}

// --- Main ---
function main() {
  if (!fs.existsSync(WORKING_DIR)) {
    console.log('No working directory found at', WORKING_DIR);
    return;
  }

  const now = Date.now();
  const cutoffMs = MAX_AGE_DAYS * 86400000;
  
  // Get all files (including subdirectories)
  const entries = [];
  
  function walkDir(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === 'escalations') continue; // protected dir
        walkDir(path.join(dir, entry.name), path.join(prefix, entry.name));
      } else if (entry.name.endsWith('.md')) {
        entries.push({
          name: path.join(prefix, entry.name),
          fullPath: path.join(dir, entry.name)
        });
      }
    }
  }
  
  walkDir(WORKING_DIR);
  
  console.log(`📁 Found ${entries.length} files in memory/working/`);
  console.log(`⏰ Archiving files older than ${MAX_AGE_DAYS} days${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  let archived = 0;
  let skipped = 0;
  let kept = 0;

  for (const entry of entries) {
    if (isProtected(entry.name)) {
      skipped++;
      continue;
    }

    const stat = fs.statSync(entry.fullPath);
    const ageDays = (now - stat.mtimeMs) / 86400000;
    const content = fs.readFileSync(entry.fullPath, 'utf-8');
    const resolved = isResolved(content);
    
    // Archive if: older than cutoff OR (resolved and older than 2 days) OR --all
    const shouldArchive = ARCHIVE_ALL || 
                          ageDays > MAX_AGE_DAYS || 
                          (resolved && ageDays > 2);

    if (!shouldArchive) {
      kept++;
      continue;
    }

    const archivePath = getArchivePath(entry.name, stat.mtime);
    const reason = ARCHIVE_ALL ? 'all' : (resolved ? `resolved (${ageDays.toFixed(1)}d)` : `stale (${ageDays.toFixed(1)}d)`);
    
    console.log(`  📦 ${entry.name} → archive/ [${reason}]`);

    if (!DRY_RUN) {
      ensureDir(path.dirname(archivePath));
      fs.renameSync(entry.fullPath, archivePath);
      archived++;
    } else {
      archived++;
    }
  }

  console.log(`\n✅ Archived: ${archived} | Kept: ${kept} | Protected: ${skipped}`);
  
  if (DRY_RUN && archived > 0) {
    console.log('\n(Dry run — no files moved. Remove --dry-run to execute.)');
  }
  
  // Clean up empty directories
  if (!DRY_RUN) {
    for (const entry of fs.readdirSync(WORKING_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'escalations') {
        const dirPath = path.join(WORKING_DIR, entry.name);
        try {
          const contents = fs.readdirSync(dirPath);
          if (contents.length === 0) {
            fs.rmdirSync(dirPath);
            console.log(`  🗑  Removed empty dir: ${entry.name}/`);
          }
        } catch {}
      }
    }
  }
}

main();
