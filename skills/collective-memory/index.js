/**
 * Collective Memory — Shared memory layer for agent collectives
 * 
 * Features:
 * - Share memories to collective pool (with PII protection)
 * - Search collective memories
 * - Validate and rate memories
 * - Synthesis layer (queen bee or distributed)
 * 
 * Usage:
 *   const collective = require('./collective-memory');
 *   
 *   // Share a memory
 *   await collective.share(agentId, memoryId, { type: 'learning', title: '...' });
 *   
 *   // Search
 *   const results = await collective.search(agentId, 'how to handle X');
 *   
 *   // Synthesize (queen bee)
 *   const insights = await collective.synthesize({ days: 7 });
 */

const { createClient } = require('@supabase/supabase-js');
const { scanForPII, redactPII, assessShareability } = require('./pii-guard');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

function getClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

// ============================================
// SHARE TO COLLECTIVE
// ============================================

/**
 * Share a memory to the collective pool
 * @param {string} agentId - ID of the sharing agent
 * @param {Object} memory - Memory to share
 * @param {Object} options - Options including llmCall for semantic scan
 * @returns {Object} Result of sharing attempt
 */
async function share(agentId, memory, options = {}) {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }
  
  const { content, type, title, tags = [], domain, stakes = 'medium' } = memory;
  const { llmCall, skipSemantic = false, forceShare = false } = options;
  
  // Step 1: Assess shareability
  const assessment = assessShareability({ type, content, stakes });
  if (!assessment.shareable && !forceShare) {
    return {
      success: false,
      reason: 'not_shareable',
      assessment
    };
  }
  
  // Step 2: Full PII scan
  const scan = await scanForPII(content, { llmCall, skipSemantic });
  
  // Step 3: Handle based on scan result
  let finalContent = content;
  let quarantined = false;
  
  if (!scan.clean) {
    if (scan.recommendation === 'block') {
      return {
        success: false,
        reason: 'blocked_sensitive_content',
        scan
      };
    }
    
    if (scan.recommendation === 'quarantine') {
      quarantined = true;
    }
    
    // Redact before storing
    const redaction = redactPII(content);
    finalContent = redaction.redacted_text;
  }
  
  // Step 4: Generate embedding (if embedding function provided)
  let embedding = null;
  if (options.embedFn) {
    try {
      embedding = await options.embedFn(finalContent);
    } catch (e) {
      console.error('Embedding failed:', e.message);
    }
  }
  
  // Step 5: Insert into collective
  const { data, error } = await client
    .from('collective_memories')
    .insert({
      source_agent_id: agentId,
      source_memory_id: memory.id || null,
      type,
      title,
      content: finalContent,
      domain,
      tags,
      embedding,
      pii_scanned: true,
      pii_scan_at: new Date().toISOString(),
      pii_scan_result: scan,
      quarantined,
      confidence: 0.5  // Initial confidence
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Step 6: Log the share action
  await client.from('collective_audit_log').insert({
    action: quarantined ? 'shared_quarantined' : 'shared',
    memory_id: data.id,
    agent_id: agentId,
    reason: scan.clean ? 'clean_content' : 'redacted_before_share'
  });
  
  return {
    success: true,
    memory_id: data.id,
    quarantined,
    was_redacted: !scan.clean
  };
}

// ============================================
// SEARCH COLLECTIVE
// ============================================

/**
 * Search collective memories
 * @param {string} agentId - ID of the searching agent
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Matching memories
 */
async function search(agentId, query, options = {}) {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }
  
  const { 
    limit = 10, 
    type = null, 
    domain = null,
    minConfidence = 0.3,
    includeQuarantined = false,
    embedFn = null
  } = options;
  
  let results;
  
  // Semantic search if embedding function provided
  if (embedFn) {
    try {
      const queryEmbedding = await embedFn(query);
      
      const { data, error } = await client.rpc('match_collective_memories', {
        query_embedding: queryEmbedding,
        match_count: limit,
        min_confidence: minConfidence
      });
      
      if (error) throw error;
      results = data;
    } catch (e) {
      console.error('Semantic search failed, falling back to text:', e.message);
      results = null;
    }
  }
  
  // Fallback: text search
  if (!results) {
    let queryBuilder = client
      .from('collective_memories')
      .select('*')
      .textSearch('content', query)
      .gte('confidence', minConfidence)
      .order('confidence', { ascending: false })
      .limit(limit);
    
    if (!includeQuarantined) {
      queryBuilder = queryBuilder.eq('quarantined', false);
    }
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }
    if (domain) {
      queryBuilder = queryBuilder.eq('domain', domain);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return { success: false, error: error.message };
    }
    results = data;
  }
  
  // Log the query
  await client.from('memory_queries').insert({
    agent_id: agentId,
    query_text: query,
    results_count: results.length
  });
  
  // Update retrieval stats
  if (results.length > 0) {
    const ids = results.map(r => r.id);
    await client
      .from('collective_memories')
      .update({ 
        times_retrieved: client.raw('times_retrieved + 1'),
        last_retrieved_at: new Date().toISOString()
      })
      .in('id', ids);
  }
  
  return {
    success: true,
    results,
    count: results.length,
    query
  };
}

// ============================================
// VALIDATE MEMORIES
// ============================================

/**
 * Validate a collective memory (confirm it's useful/accurate)
 * @param {string} agentId - ID of the validating agent
 * @param {string} memoryId - ID of the memory to validate
 * @param {boolean} useful - Whether the memory was useful
 * @returns {Object} Validation result
 */
async function validate(agentId, memoryId, useful = true) {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }
  
  // Get current memory
  const { data: memory, error: fetchError } = await client
    .from('collective_memories')
    .select('validations, validated_by, confidence')
    .eq('id', memoryId)
    .single();
  
  if (fetchError) {
    return { success: false, error: fetchError.message };
  }
  
  // Check if already validated by this agent
  const validatedBy = memory.validated_by || [];
  if (validatedBy.includes(agentId)) {
    return { success: false, error: 'Already validated by this agent' };
  }
  
  // Update validation
  const newValidations = memory.validations + (useful ? 1 : -1);
  const newConfidence = Math.min(1, Math.max(0, 0.5 + (newValidations * 0.1)));
  
  const { error: updateError } = await client
    .from('collective_memories')
    .update({
      validations: newValidations,
      validated_by: [...validatedBy, agentId],
      confidence: newConfidence
    })
    .eq('id', memoryId);
  
  if (updateError) {
    return { success: false, error: updateError.message };
  }
  
  return {
    success: true,
    memory_id: memoryId,
    new_validations: newValidations,
    new_confidence: newConfidence
  };
}

// ============================================
// SYNTHESIS (QUEEN BEE)
// ============================================

/**
 * Synthesize insights from collective memories
 * @param {Object} options - Synthesis options
 * @returns {Object} Synthesis results
 */
async function synthesize(options = {}) {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }
  
  const {
    days = 7,
    minMemories = 3,
    queenBeeId,  // Agent performing synthesis
    llmCall      // LLM function for analysis
  } = options;
  
  if (!llmCall) {
    return { success: false, error: 'LLM function required for synthesis' };
  }
  
  // Get recent memories
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: memories, error } = await client
    .from('collective_memories')
    .select('*')
    .gte('created_at', since)
    .eq('quarantined', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  if (memories.length < minMemories) {
    return { 
      success: true, 
      message: 'Not enough memories for synthesis',
      count: memories.length,
      minimum: minMemories
    };
  }
  
  // Group by domain/type for targeted synthesis
  const groups = {};
  for (const memory of memories) {
    const key = memory.domain || memory.type || 'general';
    if (!groups[key]) groups[key] = [];
    groups[key].push(memory);
  }
  
  const syntheses = [];
  
  // Synthesize each group
  for (const [groupKey, groupMemories] of Object.entries(groups)) {
    if (groupMemories.length < 2) continue;
    
    const memoryTexts = groupMemories
      .map((m, i) => `[${i + 1}] ${m.title || 'Untitled'}: ${m.content}`)
      .join('\n\n');
    
    const prompt = `Analyze these ${groupMemories.length} memories from our agent collective (domain: ${groupKey}).

Look for:
1. Patterns that appear across multiple memories
2. Insights that could help other agents
3. Warnings about common pitfalls
4. Techniques that seem effective

Memories:
${memoryTexts}

If you find a meaningful pattern or insight, respond with JSON:
{
  "found_pattern": true,
  "type": "pattern|principle|warning|technique",
  "title": "Brief title",
  "content": "The insight in 2-3 sentences",
  "confidence": 0.0-1.0,
  "source_indices": [1, 3, 5]  // which memories contributed
}

If no meaningful pattern exists, respond:
{"found_pattern": false, "reason": "why"}`;

    try {
      const response = await llmCall(prompt);
      const result = JSON.parse(response);
      
      if (result.found_pattern) {
        // Store the synthesis
        const sourceIds = result.source_indices.map(i => groupMemories[i - 1]?.id).filter(Boolean);
        
        const { data: synthesis, error: insertError } = await client
          .from('syntheses')
          .insert({
            synthesized_by: queenBeeId,
            source_memories: sourceIds,
            type: result.type,
            title: result.title,
            content: result.content,
            status: 'proposed',
            impact_score: result.confidence
          })
          .select()
          .single();
        
        if (!insertError) {
          syntheses.push(synthesis);
        }
      }
    } catch (e) {
      console.error(`Synthesis failed for group ${groupKey}:`, e.message);
    }
  }
  
  return {
    success: true,
    memories_analyzed: memories.length,
    groups_processed: Object.keys(groups).length,
    syntheses_created: syntheses.length,
    syntheses
  };
}

// ============================================
// AUDIT (QUEEN BEE)
// ============================================

/**
 * Audit collective memories for PII (periodic cleanup)
 * @param {Object} options - Audit options
 * @returns {Object} Audit results
 */
async function audit(options = {}) {
  const client = getClient();
  if (!client) {
    return { success: false, error: 'Database not configured' };
  }
  
  const { days = 7, llmCall } = options;
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Get memories not yet scanned or scanned before threshold
  const { data: memories, error } = await client
    .from('collective_memories')
    .select('*')
    .or(`pii_scanned.eq.false,pii_scan_at.lt.${since}`)
    .eq('quarantined', false);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  const results = {
    scanned: 0,
    clean: 0,
    quarantined: 0,
    redacted: 0
  };
  
  for (const memory of memories) {
    const scan = await scanForPII(memory.content, { llmCall });
    results.scanned++;
    
    if (scan.clean) {
      results.clean++;
      // Update scan timestamp
      await client
        .from('collective_memories')
        .update({
          pii_scanned: true,
          pii_scan_at: new Date().toISOString(),
          pii_scan_result: scan
        })
        .eq('id', memory.id);
    } else {
      // Quarantine or redact
      if (scan.recommendation === 'quarantine' || scan.recommendation === 'block') {
        results.quarantined++;
        await client
          .from('collective_memories')
          .update({
            quarantined: true,
            pii_scanned: true,
            pii_scan_at: new Date().toISOString(),
            pii_scan_result: scan
          })
          .eq('id', memory.id);
      } else {
        results.redacted++;
        const redaction = redactPII(memory.content);
        await client
          .from('collective_memories')
          .update({
            content: redaction.redacted_text,
            pii_scanned: true,
            pii_scan_at: new Date().toISOString(),
            pii_scan_result: { ...scan, redaction }
          })
          .eq('id', memory.id);
      }
    }
  }
  
  return {
    success: true,
    ...results,
    audited_at: new Date().toISOString()
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Core operations
  share,
  search,
  validate,
  
  // Queen bee operations
  synthesize,
  audit,
  
  // Utilities
  getClient
};
