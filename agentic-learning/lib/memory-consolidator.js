/**
 * Memory Consolidator
 * 
 * Moves memories between hierarchy levels:
 * Working (session) → Episodic (days) → Semantic (permanent)
 * 
 * Also handles narrative linking between episodes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MemoryConsolidator {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.workingDir = path.join(learningDir, 'memory', 'working');
    this.episodicDir = path.join(learningDir, 'memory', 'episodic');
    this.semanticDir = path.join(learningDir, 'memory', 'semantic');
    this.narrativesFile = path.join(this.episodicDir, 'narratives.json');
  }

  /**
   * Safe file operations
   */
  safeParseJSON(filePath, defaultValue) {
    try {
      if (!fs.existsSync(filePath)) return defaultValue;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return defaultValue;
    }
  }

  safeWriteJSON(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error('[memory-consolidator] Write error:', e.message);
      return false;
    }
  }

  /**
   * Generate episode ID
   */
  generateEpisodeId() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const random = crypto.randomBytes(3).toString('hex');
    return `ep_${timestamp}_${random}`;
  }

  // =========================================
  // WORKING MEMORY
  // =========================================

  /**
   * Save to working memory (current session)
   */
  async saveToWorking(key, data) {
    const workingFile = path.join(this.workingDir, 'session.json');
    const working = this.safeParseJSON(workingFile, {
      session_start: new Date().toISOString(),
      items: {}
    });

    working.items[key] = {
      data,
      saved_at: new Date().toISOString()
    };
    working.last_updated = new Date().toISOString();

    return this.safeWriteJSON(workingFile, working);
  }

  /**
   * Get from working memory
   */
  async getFromWorking(key) {
    const workingFile = path.join(this.workingDir, 'session.json');
    const working = this.safeParseJSON(workingFile, { items: {} });
    return working.items[key]?.data || null;
  }

  /**
   * Clear working memory (on session end)
   */
  async clearWorking() {
    const workingFile = path.join(this.workingDir, 'session.json');
    if (fs.existsSync(workingFile)) {
      fs.unlinkSync(workingFile);
    }
    return true;
  }

  // =========================================
  // WORKING → EPISODIC CONSOLIDATION
  // =========================================

  /**
   * Consolidate session to episodic memory
   */
  async consolidateSession(sessionData) {
    const episodeId = this.generateEpisodeId();
    
    const episode = {
      id: episodeId,
      timestamp: new Date().toISOString(),
      session_key: sessionData.session_key || null,
      
      // Summary
      summary: sessionData.summary || null,
      duration_ms: sessionData.duration_ms || null,
      
      // Key events
      decisions: sessionData.decisions || [],
      failures: sessionData.failures || [],
      learnings: sessionData.learnings || [],
      
      // Goals
      goals_started: sessionData.goals_started || [],
      goals_completed: sessionData.goals_completed || [],
      
      // Procedures used
      procedures_used: sessionData.procedures_used || [],
      
      // Narrative links (filled in by linkNarrative)
      narrative: {
        themes: [],
        preceded_by: null,
        led_to: null,
        related: []
      },
      
      // Metadata
      metadata: sessionData.metadata || {}
    };

    // Save episode
    const episodePath = path.join(this.episodicDir, 'episodes', `${episodeId}.json`);
    this.safeWriteJSON(episodePath, episode);

    // Clear working memory
    await this.clearWorking();

    // Try to link narratively
    await this.linkNarrative(episodeId);

    return episode;
  }

  // =========================================
  // NARRATIVE LINKING
  // =========================================

  /**
   * Link episode to narrative threads
   */
  async linkNarrative(episodeId) {
    const episodePath = path.join(this.episodicDir, 'episodes', `${episodeId}.json`);
    const episode = this.safeParseJSON(episodePath, null);
    if (!episode) return null;

    // Load narratives
    const narratives = this.safeParseJSON(this.narrativesFile, []);

    // Extract themes from episode content
    const themes = this.extractThemes(episode);
    episode.narrative.themes = themes;

    // Find related episodes
    const related = await this.findRelatedEpisodes(episode, 5);
    episode.narrative.related = related.map(r => r.id);

    // Find preceding episode (most recent related)
    if (related.length > 0) {
      const mostRecent = related[0];
      episode.narrative.preceded_by = mostRecent.id;
      
      // Update the preceding episode to point to this one
      const precedingPath = path.join(this.episodicDir, 'episodes', `${mostRecent.id}.json`);
      const preceding = this.safeParseJSON(precedingPath, null);
      if (preceding) {
        preceding.narrative.led_to = episodeId;
        this.safeWriteJSON(precedingPath, preceding);
      }
    }

    // Save updated episode
    this.safeWriteJSON(episodePath, episode);

    // Update or create narrative threads
    for (const theme of themes) {
      let narrative = narratives.find(n => n.theme === theme);
      if (!narrative) {
        narrative = {
          theme,
          created_at: new Date().toISOString(),
          episodes: []
        };
        narratives.push(narrative);
      }
      if (!narrative.episodes.includes(episodeId)) {
        narrative.episodes.push(episodeId);
      }
      narrative.last_updated = new Date().toISOString();
    }

    this.safeWriteJSON(this.narrativesFile, narratives);

    return episode.narrative;
  }

  /**
   * Extract themes from episode
   */
  extractThemes(episode) {
    const themes = new Set();

    // From decisions
    for (const dec of episode.decisions || []) {
      if (dec.context) {
        const words = dec.context.toLowerCase().split(/\s+/);
        // Simple keyword extraction
        for (const word of words) {
          if (word.length > 5 && !['about', 'their', 'there', 'would', 'could', 'should'].includes(word)) {
            themes.add(word);
          }
        }
      }
    }

    // From learnings
    for (const learning of episode.learnings || []) {
      if (learning.topic) themes.add(learning.topic.toLowerCase());
    }

    // From goals
    for (const goal of [...(episode.goals_started || []), ...(episode.goals_completed || [])]) {
      if (goal.description) {
        const words = goal.description.toLowerCase().split(/\s+/).slice(0, 3);
        themes.add(words.join('-'));
      }
    }

    return Array.from(themes).slice(0, 5);
  }

  /**
   * Find related episodes
   */
  async findRelatedEpisodes(episode, limit = 5) {
    const related = [];
    
    try {
      const episodesDir = path.join(this.episodicDir, 'episodes');
      if (!fs.existsSync(episodesDir)) return related;

      const files = fs.readdirSync(episodesDir)
        .filter(f => f.endsWith('.json') && f !== `${episode.id}.json`)
        .sort()
        .reverse()
        .slice(0, 50); // Check last 50 episodes

      const currentThemes = new Set(episode.narrative?.themes || []);

      for (const file of files) {
        const other = this.safeParseJSON(path.join(episodesDir, file), null);
        if (!other) continue;

        const otherThemes = new Set(other.narrative?.themes || []);
        
        // Calculate overlap
        let overlap = 0;
        for (const theme of currentThemes) {
          if (otherThemes.has(theme)) overlap++;
        }

        if (overlap > 0) {
          related.push({
            id: other.id,
            overlap,
            timestamp: other.timestamp
          });
        }
      }
    } catch (e) {
      console.error('[memory-consolidator] Error finding related:', e.message);
    }

    return related
      .sort((a, b) => b.overlap - a.overlap || new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // =========================================
  // EPISODIC → SEMANTIC CONSOLIDATION
  // =========================================

  /**
   * Extract rules from episodic memory
   */
  async extractRules(minOccurrences = 3) {
    const rules = [];
    const patternCounts = {};

    try {
      const episodesDir = path.join(this.episodicDir, 'episodes');
      if (!fs.existsSync(episodesDir)) return rules;

      const files = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json'));

      // Count patterns across episodes
      for (const file of files) {
        const episode = this.safeParseJSON(path.join(episodesDir, file), null);
        if (!episode) continue;

        // Extract patterns from learnings
        for (const learning of episode.learnings || []) {
          const key = learning.pattern || learning.rule || learning.content;
          if (key) {
            patternCounts[key] = (patternCounts[key] || 0) + 1;
          }
        }

        // Extract patterns from successful decisions
        for (const dec of episode.decisions || []) {
          if (dec.outcome?.status === 'success' && dec.chosen) {
            const key = `When ${dec.context?.slice(0, 50)}, do: ${dec.chosen}`;
            patternCounts[key] = (patternCounts[key] || 0) + 1;
          }
        }
      }

      // Filter to rules that meet threshold
      for (const [pattern, count] of Object.entries(patternCounts)) {
        if (count >= minOccurrences) {
          rules.push({
            title: pattern.slice(0, 50),
            content: pattern,
            occurrences: count,
            confidence: Math.min(count / 10, 1)
          });
        }
      }
    } catch (e) {
      console.error('[memory-consolidator] Error extracting rules:', e.message);
    }

    return rules.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Promote rules to semantic memory
   */
  async promoteToSemantic(rules) {
    const rulesFile = path.join(this.semanticDir, 'rules.md');
    
    let content = '# Learned Rules\n\n';
    content += `_Last updated: ${new Date().toISOString()}_\n\n`;
    content += '---\n\n';

    for (const rule of rules) {
      content += `## ${rule.title}\n\n`;
      content += `${rule.content}\n\n`;
      content += `- **Occurrences:** ${rule.occurrences}\n`;
      content += `- **Confidence:** ${(rule.confidence * 100).toFixed(0)}%\n\n`;
    }

    return this.safeWriteJSON(rulesFile.replace('.md', '.md'), content);
  }

  /**
   * Run full consolidation cycle
   */
  async runConsolidation() {
    const results = {
      rules_extracted: 0,
      rules_promoted: 0,
      timestamp: new Date().toISOString()
    };

    // Extract rules from episodes
    const rules = await this.extractRules(3);
    results.rules_extracted = rules.length;

    // Promote to semantic if we have rules
    if (rules.length > 0) {
      await this.promoteToSemantic(rules);
      results.rules_promoted = rules.length;
    }

    return results;
  }

  // =========================================
  // PREFERENCES
  // =========================================

  /**
   * Save user preference
   */
  async savePreference(key, value, source = null) {
    const prefsFile = path.join(this.semanticDir, 'preferences.json');
    const prefs = this.safeParseJSON(prefsFile, {});

    prefs[key] = {
      value,
      source,
      learned_at: new Date().toISOString()
    };

    return this.safeWriteJSON(prefsFile, prefs);
  }

  /**
   * Get user preference
   */
  async getPreference(key) {
    const prefsFile = path.join(this.semanticDir, 'preferences.json');
    const prefs = this.safeParseJSON(prefsFile, {});
    return prefs[key]?.value || null;
  }

  /**
   * Get all preferences
   */
  async getAllPreferences() {
    const prefsFile = path.join(this.semanticDir, 'preferences.json');
    return this.safeParseJSON(prefsFile, {});
  }
}

module.exports = { MemoryConsolidator };
