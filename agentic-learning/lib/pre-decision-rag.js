/**
 * Pre-Decision RAG - Retrieve context before making decisions
 * 
 * Searches past decisions, failures, procedures, and research insights
 * to enrich the current decision context.
 * 
 * Research integration: Pulls from Sybil's research_insights table
 * to surface relevant academic findings during decision-making.
 */

const fs = require('fs');
const path = require('path');
const { ResearchAdapter } = require('./research-adapter');

class PreDecisionRAG {
  constructor(learningDir, options = {}) {
    this.learningDir = learningDir;
    this.decisionsDir = path.join(learningDir, 'decisions');
    this.failuresDir = path.join(learningDir, 'failures');
    this.proceduresDir = path.join(learningDir, 'procedures');
    this.semanticDir = path.join(learningDir, 'memory', 'semantic');
    
    // Initialize research adapter for Sybil's research intelligence
    this.researchAdapter = new ResearchAdapter(options.research || {});
  }

  /**
   * Safe JSON parse
   */
  safeParseJSON(filePath, defaultValue) {
    try {
      if (!fs.existsSync(filePath)) return defaultValue;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Simple text similarity (word overlap)
   */
  similarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let overlap = 0;
    for (const word of words1) {
      if (words2.has(word)) overlap++;
    }
    
    return overlap / Math.max(words1.size, words2.size);
  }

  /**
   * Search past decisions
   */
  async searchDecisions(query, limit = 5) {
    const results = [];
    
    try {
      const files = fs.readdirSync(this.decisionsDir)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
        .sort()
        .reverse()
        .slice(0, 30); // Last 30 days
      
      for (const file of files) {
        const decisions = this.safeParseJSON(path.join(this.decisionsDir, file), []);
        
        for (const dec of decisions) {
          const text = [dec.context, dec.question, dec.chosen, dec.reasoning]
            .filter(Boolean).join(' ');
          
          const score = this.similarity(query, text);
          if (score > 0.1) {
            results.push({
              type: 'decision',
              id: dec.id,
              score,
              context: dec.context?.slice(0, 150),
              chosen: dec.chosen,
              outcome: dec.outcome?.status,
              date: file.replace('.json', '')
            });
          }
        }
      }
    } catch (e) {
      console.error('[pre-decision-rag] Error searching decisions:', e.message);
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Search failures
   */
  async searchFailures(query, limit = 3) {
    const results = [];
    
    try {
      const logFile = path.join(this.failuresDir, 'log.jsonl');
      if (!fs.existsSync(logFile)) return results;
      
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l);
      
      for (const line of lines.slice(-100)) { // Last 100 failures
        try {
          const failure = JSON.parse(line);
          const text = [failure.context, failure.error, failure.root_cause]
            .filter(Boolean).join(' ');
          
          const score = this.similarity(query, text);
          if (score > 0.1) {
            results.push({
              type: 'failure',
              id: failure.id,
              score,
              context: failure.context?.slice(0, 150),
              error: failure.error?.slice(0, 100),
              lesson: failure.lesson || failure.root_cause
            });
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    } catch (e) {
      console.error('[pre-decision-rag] Error searching failures:', e.message);
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Search procedures
   */
  async searchProcedures(query, limit = 3) {
    const results = [];
    
    try {
      const activeDir = path.join(this.proceduresDir, 'active');
      if (!fs.existsSync(activeDir)) return results;
      
      const files = fs.readdirSync(activeDir).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const proc = this.safeParseJSON(path.join(activeDir, file), null);
        if (!proc) continue;
        
        const text = [
          proc.name,
          proc.description,
          ...(proc.trigger?.patterns || []),
          ...(proc.trigger?.context || [])
        ].filter(Boolean).join(' ');
        
        const score = this.similarity(query, text);
        if (score > 0.1) {
          results.push({
            type: 'procedure',
            id: proc.id,
            score,
            name: proc.name,
            description: proc.description?.slice(0, 100),
            success_rate: proc.metrics?.success_rate,
            steps: proc.steps?.length || 0
          });
        }
      }
    } catch (e) {
      console.error('[pre-decision-rag] Error searching procedures:', e.message);
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Search learned rules
   */
  async searchRules(query, limit = 3) {
    const results = [];
    
    try {
      const rulesFile = path.join(this.semanticDir, 'rules.md');
      if (!fs.existsSync(rulesFile)) return results;
      
      const content = fs.readFileSync(rulesFile, 'utf-8');
      const sections = content.split(/^##\s+/m).filter(s => s.trim());
      
      for (const section of sections) {
        const lines = section.split('\n');
        const title = lines[0]?.trim();
        const body = lines.slice(1).join('\n').trim();
        
        if (!title || !body) continue;
        
        const score = this.similarity(query, `${title} ${body}`);
        if (score > 0.1) {
          results.push({
            type: 'rule',
            score,
            title,
            content: body.slice(0, 200)
          });
        }
      }
    } catch (e) {
      console.error('[pre-decision-rag] Error searching rules:', e.message);
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Search research insights via Sybil's research intelligence system
   */
  async searchResearchInsights(query, limit = 3) {
    if (!this.researchAdapter || !this.researchAdapter.enabled) {
      return [];
    }

    try {
      const insights = await this.researchAdapter.searchInsights(query, { limit });
      
      // Transform to match our result format
      return insights.map(insight => ({
        type: 'research',
        id: insight.id,
        score: insight.similarity || 0.8,
        insight: insight.insight,
        paper_title: insight.paper_title,
        paper_url: insight.paper_url,
        paper_abstract: insight.paper_abstract
      }));
    } catch (e) {
      console.error('[pre-decision-rag] Error searching research:', e.message);
      return [];
    }
  }

  /**
   * Main retrieval function - searches all sources including research
   */
  async retrieve(query, options = {}) {
    const maxItems = options.maxItems || 7; // Increased to accommodate research

    const [decisions, failures, procedures, rules, research] = await Promise.all([
      options.searchDecisions !== false ? this.searchDecisions(query, 3) : [],
      options.searchFailures !== false ? this.searchFailures(query, 2) : [],
      options.searchProcedures !== false ? this.searchProcedures(query, 2) : [],
      options.searchRules !== false ? this.searchRules(query, 2) : [],
      options.searchResearch !== false ? this.searchResearchInsights(query, 3) : []
    ]);

    // Combine and sort by score
    const all = [...decisions, ...failures, ...procedures, ...rules, ...research]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);

    return {
      query,
      retrieved_at: new Date().toISOString(),
      items: all,
      counts: {
        decisions: decisions.length,
        failures: failures.length,
        procedures: procedures.length,
        rules: rules.length,
        research: research.length
      }
    };
  }

  /**
   * Format retrieved context for injection
   */
  formatForInjection(retrieved) {
    if (!retrieved.items || retrieved.items.length === 0) {
      return null;
    }

    let text = '**Relevant History:**\n\n';

    for (const item of retrieved.items) {
      switch (item.type) {
        case 'decision':
          text += `• **Past Decision** (${item.outcome || 'pending'}): ${item.context}\n`;
          if (item.chosen) text += `  → Chose: ${item.chosen}\n`;
          break;
        
        case 'failure':
          text += `• **Past Failure**: ${item.context}\n`;
          if (item.lesson) text += `  → Lesson: ${item.lesson}\n`;
          break;
        
        case 'procedure':
          text += `• **Procedure "${item.name}"**: ${item.description || 'No description'}\n`;
          if (item.success_rate) text += `  → Success rate: ${(item.success_rate * 100).toFixed(0)}%\n`;
          break;
        
        case 'rule':
          text += `• **Rule "${item.title}"**: ${item.content}\n`;
          break;
        
        case 'research':
          text += `• **Research Insight**: ${item.insight}\n`;
          text += `  📄 Source: ${item.paper_title || 'Unknown'}\n`;
          if (item.paper_url) {
            text += `  🔗 [View Paper](${item.paper_url})\n`;
          }
          break;
      }
      text += '\n';
    }

    return text.trim();
  }

  /**
   * Get research adapter for direct access if needed
   */
  getResearchAdapter() {
    return this.researchAdapter;
  }
}

module.exports = { PreDecisionRAG };
