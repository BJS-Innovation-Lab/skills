/**
 * Memory Interface
 * Abstracts memory access to work with both current (MEMORY.md) 
 * and future (agentic-learning) memory systems
 */

const fs = require('fs').promises;
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

/**
 * Check if agentic-learning system is enabled
 * @returns {Promise<boolean>}
 */
async function isAgenticLearningEnabled() {
  try {
    const configPath = path.join(WORKSPACE, 'learning/config.yaml');
    await fs.access(configPath);
    
    // Check if enabled in config
    const config = await fs.readFile(configPath, 'utf-8');
    return config.includes('enabled: true');
  } catch {
    return false;
  }
}

/**
 * Get project context from memory
 * Works with both current and future memory systems
 * @returns {Promise<Object>} Context object
 */
async function getProjectContext() {
  const agenticEnabled = await isAgenticLearningEnabled();
  
  if (agenticEnabled) {
    return await getAgenticLearningContext();
  } else {
    return await getCurrentMemoryContext();
  }
}

/**
 * Get context from current memory system (MEMORY.md + daily files)
 */
async function getCurrentMemoryContext() {
  const context = {
    priorities: [],
    recentContext: '',
    pastResearch: [],
    system: 'current'
  };
  
  try {
    // Read MEMORY.md
    const memoryPath = path.join(WORKSPACE, 'MEMORY.md');
    const memoryContent = await fs.readFile(memoryPath, 'utf-8');
    
    // Extract current projects/priorities section
    const projectsMatch = memoryContent.match(/## (?:Current Projects|Key Information|Recent Events)([\s\S]*?)(?=##|$)/i);
    if (projectsMatch) {
      context.priorities = projectsMatch[1].trim().split('\n').filter(l => l.trim());
    }
    
    // Read recent daily memory files (last 3 days)
    const memoryDir = path.join(WORKSPACE, 'memory');
    const today = new Date();
    const recentContent = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dailyPath = path.join(memoryDir, `${dateStr}.md`);
      
      try {
        const dailyContent = await fs.readFile(dailyPath, 'utf-8');
        recentContent.push(`--- ${dateStr} ---\n${dailyContent}`);
      } catch {
        // File doesn't exist, skip
      }
    }
    
    context.recentContext = recentContent.join('\n\n');
    
    // Read MVP-TRACKER if exists
    try {
      const trackerPath = path.join(WORKSPACE, 'MVP-TRACKER.md');
      const trackerContent = await fs.readFile(trackerPath, 'utf-8');
      context.priorities.push('--- MVP Tracker ---');
      context.priorities.push(trackerContent.substring(0, 2000)); // Limit size
    } catch {
      // No tracker, skip
    }
    
  } catch (error) {
    console.error('[MemoryInterface] Error reading current memory:', error.message);
  }
  
  return context;
}

/**
 * Get context from agentic-learning system
 */
async function getAgenticLearningContext() {
  const context = {
    priorities: [],
    recentContext: '',
    pastResearch: [],
    system: 'agentic-learning'
  };
  
  try {
    const learningDir = path.join(WORKSPACE, 'learning');
    
    // Query semantic memory for priorities
    const semanticPath = path.join(learningDir, 'memory/semantic/rules.md');
    try {
      const semanticContent = await fs.readFile(semanticPath, 'utf-8');
      context.priorities = semanticContent.split('\n').filter(l => l.trim());
    } catch {
      // No semantic memory yet
    }
    
    // Query episodic memory (recent episodes)
    const episodicDir = path.join(learningDir, 'memory/episodic/episodes');
    try {
      const episodes = await fs.readdir(episodicDir);
      const recentEpisodes = episodes.slice(-5); // Last 5 episodes
      
      const episodeContent = [];
      for (const ep of recentEpisodes) {
        const epContent = await fs.readFile(path.join(episodicDir, ep), 'utf-8');
        episodeContent.push(epContent);
      }
      context.recentContext = episodeContent.join('\n\n');
    } catch {
      // No episodic memory yet
    }
    
  } catch (error) {
    console.error('[MemoryInterface] Error reading agentic-learning memory:', error.message);
  }
  
  return context;
}

/**
 * Get past research insights from Supabase
 * @param {Object} supabase - Supabase client
 * @param {number} limit - Max insights to fetch
 */
async function getPastResearchInsights(supabase, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('research_insights')
      .select('insight, insight_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[MemoryInterface] Error fetching past research:', error.message);
    return [];
  }
}

/**
 * Build context prompt for relevance scoring
 * @param {Object} context - Context from getProjectContext
 * @returns {string} Formatted context for LLM
 */
function buildContextPrompt(context) {
  return `
## Current Project Context

### Priorities
${context.priorities.join('\n')}

### Recent Activity (Last 3 Days)
${context.recentContext || 'No recent activity logged.'}

### Past Research Insights
${context.pastResearch.length > 0 
  ? context.pastResearch.map(r => `- ${r.insight}`).join('\n')
  : 'No past research insights.'}

---
Use this context to evaluate paper relevance. Papers should help with current priorities or build on past insights.
`.trim();
}

module.exports = {
  isAgenticLearningEnabled,
  getProjectContext,
  getPastResearchInsights,
  buildContextPrompt
};
