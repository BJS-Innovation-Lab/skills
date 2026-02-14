/**
 * Research Adapter - Integrates Sybil's Research Intelligence into Pre-Decision RAG
 * 
 * Queries the research_insights table in Supabase to surface relevant
 * research findings during decision-making.
 * 
 * Philosophy: Pull, not Push - insights surface automatically when relevant.
 * 
 * @author Saber (with Sybil's research system)
 * @date 2026-02-13
 */

const { createClient } = require('@supabase/supabase-js');

class ResearchAdapter {
  constructor(options = {}) {
    // Supabase config - uses the shared BJS Labs project
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
    this.supabaseKey = options.supabaseKey || process.env.SUPABASE_ANON_KEY;
    
    this.client = null;
    this.enabled = false;
    
    // Thresholds (0.40 = stricter relevance with text-embedding-3-small)
    this.matchThreshold = options.matchThreshold || 0.40;
    this.matchCount = options.matchCount || 3;
    
    // Embedding config (must match Sybil's: text-embedding-3-small, 1536-dim)
    this.embeddingModel = 'text-embedding-3-small';
    this.embeddingDimension = 1536;
    
    this._init();
  }

  /**
   * Initialize Supabase client
   */
  _init() {
    if (!this.supabaseKey) {
      console.warn('[research-adapter] SUPABASE_ANON_KEY not set - research insights disabled');
      return;
    }
    
    try {
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
      this.enabled = true;
      console.log('[research-adapter] Initialized successfully');
    } catch (e) {
      console.error('[research-adapter] Failed to initialize:', e.message);
    }
  }

  /**
   * Generate embedding for query text using OpenAI
   */
  async generateEmbedding(text) {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('[research-adapter] OPENAI_API_KEY not set - cannot generate embeddings');
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (e) {
      console.error('[research-adapter] Embedding generation failed:', e.message);
      return null;
    }
  }

  /**
   * Search research insights using semantic similarity
   * 
   * @param {string} query - The search query (decision context)
   * @param {object} options - Search options
   * @returns {Array} - Matching research insights
   */
  async searchInsights(query, options = {}) {
    if (!this.enabled || !this.client) {
      return [];
    }

    const threshold = options.threshold || this.matchThreshold;
    const limit = options.limit || this.matchCount;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        return [];
      }

      // Call Sybil's search function
      const { data, error } = await this.client.rpc('search_research_insights', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) {
        console.error('[research-adapter] Search error:', error.message);
        return [];
      }

      // Track that these insights were surfaced
      if (data && data.length > 0) {
        await this._trackSurfaced(data.map(d => d.id));
      }

      return data || [];
    } catch (e) {
      console.error('[research-adapter] Search failed:', e.message);
      return [];
    }
  }

  /**
   * Track when insights are surfaced (for analytics)
   */
  async _trackSurfaced(insightIds) {
    if (!this.client || !insightIds.length) return;

    try {
      // Increment times_surfaced using RPC or direct SQL
      // Note: Supabase JS client doesn't support raw SQL in update
      // Use an RPC function or do a read-modify-write
      for (const id of insightIds) {
        const { data } = await this.client
          .from('research_insights')
          .select('times_surfaced')
          .eq('id', id)
          .single();
        
        if (data) {
          await this.client
            .from('research_insights')
            .update({ times_surfaced: (data.times_surfaced || 0) + 1 })
            .eq('id', id);
        }
      }
    } catch (e) {
      // Non-critical, don't fail
      console.warn('[research-adapter] Failed to track surfaced:', e.message);
    }
  }

  /**
   * Track when an insight is actually used/referenced
   */
  async trackReferenced(insightId) {
    if (!this.client) return;

    try {
      const { data } = await this.client
        .from('research_insights')
        .select('times_referenced')
        .eq('id', insightId)
        .single();
      
      if (data) {
        await this.client
          .from('research_insights')
          .update({ times_referenced: (data.times_referenced || 0) + 1 })
          .eq('id', insightId);
      }
    } catch (e) {
      console.warn('[research-adapter] Failed to track referenced:', e.message);
    }
  }

  /**
   * Format insights for injection into context
   */
  formatForInjection(insights) {
    if (!insights || insights.length === 0) {
      return null;
    }

    let text = '**Related Research:**\n\n';

    for (const insight of insights) {
      const score = insight.similarity ? ` (${(insight.similarity * 100).toFixed(0)}% match)` : '';
      text += `• ${insight.insight}${score}\n`;
      text += `  📄 Source: ${insight.paper_title || 'Unknown'}\n`;
      if (insight.paper_url) {
        text += `  🔗 [View Paper](${insight.paper_url})\n`;
      }
      text += '\n';
    }

    return text.trim();
  }

  /**
   * Get adapter status
   */
  status() {
    return {
      enabled: this.enabled,
      supabaseUrl: this.supabaseUrl,
      matchThreshold: this.matchThreshold,
      matchCount: this.matchCount,
      embeddingModel: this.embeddingModel
    };
  }
}

module.exports = { ResearchAdapter };
