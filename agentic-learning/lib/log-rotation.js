/**
 * Log Rotation - Prevent storage bloat
 * 
 * Rotates/archives old logs to keep storage manageable
 */

const fs = require('fs');
const path = require('path');

class LogRotation {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.archiveDir = path.join(learningDir, 'archive');
  }

  /**
   * Ensure archive directory exists
   */
  ensureArchiveDir() {
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }
  }

  /**
   * Rotate JSONL file - keep last N lines
   */
  rotateJsonl(filePath, keepLines = 1000) {
    if (!fs.existsSync(filePath)) return { rotated: false };

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);

    if (lines.length <= keepLines) {
      return { rotated: false, lines: lines.length };
    }

    // Archive old lines
    this.ensureArchiveDir();
    const archiveLines = lines.slice(0, lines.length - keepLines);
    const keepLinesArr = lines.slice(-keepLines);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = path.basename(filePath, '.jsonl');
    const archivePath = path.join(this.archiveDir, `${baseName}-${timestamp}.jsonl`);

    fs.writeFileSync(archivePath, archiveLines.join('\n') + '\n');
    fs.writeFileSync(filePath, keepLinesArr.join('\n') + '\n');

    return {
      rotated: true,
      archived: archiveLines.length,
      kept: keepLinesArr.length,
      archivePath
    };
  }

  /**
   * Clean old decision files - keep last N days
   */
  cleanDecisions(keepDays = 30) {
    const decisionsDir = path.join(this.learningDir, 'decisions');
    if (!fs.existsSync(decisionsDir)) return { cleaned: 0 };

    const files = fs.readdirSync(decisionsDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .sort();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const toArchive = files.filter(f => f.replace('.json', '') < cutoff);

    if (toArchive.length === 0) {
      return { cleaned: 0 };
    }

    this.ensureArchiveDir();
    const archiveSubdir = path.join(this.archiveDir, 'decisions');
    if (!fs.existsSync(archiveSubdir)) {
      fs.mkdirSync(archiveSubdir, { recursive: true });
    }

    for (const file of toArchive) {
      const src = path.join(decisionsDir, file);
      const dst = path.join(archiveSubdir, file);
      fs.renameSync(src, dst);
    }

    return {
      cleaned: toArchive.length,
      files: toArchive
    };
  }

  /**
   * Clean old episodes - keep last N
   */
  cleanEpisodes(keepCount = 100) {
    const episodesDir = path.join(this.learningDir, 'memory', 'episodic', 'episodes');
    if (!fs.existsSync(episodesDir)) return { cleaned: 0 };

    const files = fs.readdirSync(episodesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    if (files.length <= keepCount) {
      return { cleaned: 0 };
    }

    const toArchive = files.slice(0, files.length - keepCount);

    this.ensureArchiveDir();
    const archiveSubdir = path.join(this.archiveDir, 'episodes');
    if (!fs.existsSync(archiveSubdir)) {
      fs.mkdirSync(archiveSubdir, { recursive: true });
    }

    for (const file of toArchive) {
      const src = path.join(episodesDir, file);
      const dst = path.join(archiveSubdir, file);
      fs.renameSync(src, dst);
    }

    return {
      cleaned: toArchive.length,
      files: toArchive
    };
  }

  /**
   * Clean old completed goals - keep last N
   */
  cleanCompletedGoals(keepCount = 50) {
    const goalsDir = path.join(this.learningDir, 'goals', 'completed');
    if (!fs.existsSync(goalsDir)) return { cleaned: 0 };

    const files = fs.readdirSync(goalsDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    if (files.length <= keepCount) {
      return { cleaned: 0 };
    }

    const toArchive = files.slice(0, files.length - keepCount);

    this.ensureArchiveDir();
    const archiveSubdir = path.join(this.archiveDir, 'goals');
    if (!fs.existsSync(archiveSubdir)) {
      fs.mkdirSync(archiveSubdir, { recursive: true });
    }

    for (const file of toArchive) {
      const src = path.join(goalsDir, file);
      const dst = path.join(archiveSubdir, file);
      fs.renameSync(src, dst);
    }

    return {
      cleaned: toArchive.length
    };
  }

  /**
   * Clean old archive files - delete archives older than N days
   */
  cleanArchive(keepDays = 90) {
    if (!fs.existsSync(this.archiveDir)) return { deleted: 0 };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let deleted = 0;

    const cleanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          cleanDir(itemPath);
        } else if (stats.mtime < cutoffDate) {
          fs.unlinkSync(itemPath);
          deleted++;
        }
      }
    };

    cleanDir(this.archiveDir);
    return { deleted };
  }

  /**
   * Run full rotation cycle
   */
  async runRotation(options = {}) {
    const results = {
      timestamp: new Date().toISOString(),
      events: { rotated: false },
      failures: { rotated: false },
      evolution: { rotated: false },
      decisions: { cleaned: 0 },
      episodes: { cleaned: 0 },
      goals: { cleaned: 0 },
      archive: { deleted: 0 }
    };

    // Rotate JSONL files
    results.events = this.rotateJsonl(
      path.join(this.learningDir, 'events', 'events.jsonl'),
      options.keepEventLines || 1000
    );

    results.failures = this.rotateJsonl(
      path.join(this.learningDir, 'failures', 'log.jsonl'),
      options.keepFailureLines || 500
    );

    results.evolution = this.rotateJsonl(
      path.join(this.learningDir, 'evolution', 'history.jsonl'),
      options.keepEvolutionLines || 200
    );

    // Clean old files
    results.decisions = this.cleanDecisions(options.keepDecisionDays || 30);
    results.episodes = this.cleanEpisodes(options.keepEpisodes || 100);
    results.goals = this.cleanCompletedGoals(options.keepGoals || 50);

    // Clean very old archives
    results.archive = this.cleanArchive(options.keepArchiveDays || 90);

    return results;
  }
}

module.exports = { LogRotation };
