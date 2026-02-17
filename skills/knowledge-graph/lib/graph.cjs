/**
 * VULKN Knowledge Graph — Core Library
 * PostgreSQL-backed graph operations via Supabase
 * 
 * Usage:
 *   const graph = require('./graph.cjs');
 *   await graph.init();
 *   const id = await graph.addEntity('Person', 'Javier Mitrani', { role: 'CEO' }, tenantId);
 *   await graph.addEdge('WORKS_AT', personId, orgId, {}, { tenantId });
 *   const results = await graph.traverse(startId, { maxDepth: 3, relationships: ['WORKS_AT'] });
 */

const { createClient } = require('@supabase/supabase-js');

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;

function init() {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY required');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

function getClient() {
  if (!supabase) init();
  return supabase;
}

// --- Entity Operations ---

async function addEntity(entityType, name, properties = {}, tenantId = null, accessScope = 'tenant') {
  const db = getClient();
  const { data, error } = await db.from('kg_entities').insert({
    entity_type: entityType,
    name,
    properties,
    tenant_id: tenantId,
    access_scope: accessScope,
  }).select('id').single();
  if (error) throw new Error(`addEntity failed: ${error.message}`);
  return data.id;
}

async function getEntity(id) {
  const db = getClient();
  const { data, error } = await db.from('kg_entities').select('*').eq('id', id).single();
  if (error) throw new Error(`getEntity failed: ${error.message}`);
  return data;
}

async function findEntities(filters = {}) {
  const db = getClient();
  let q = db.from('kg_entities').select('*');
  if (filters.entityType) q = q.eq('entity_type', filters.entityType);
  if (filters.tenantId) q = q.eq('tenant_id', filters.tenantId);
  if (filters.name) q = q.ilike('name', `%${filters.name}%`);
  if (filters.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) throw new Error(`findEntities failed: ${error.message}`);
  return data;
}

async function updateEntity(id, updates) {
  const db = getClient();
  const { error } = await db.from('kg_entities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`updateEntity failed: ${error.message}`);
}

async function resolveEntity(entityType, name, properties = {}, tenantId = null) {
  // Find existing entity by type + name + tenant, or create new
  const db = getClient();
  let q = db.from('kg_entities').select('*')
    .eq('entity_type', entityType)
    .ilike('name', name);
  if (tenantId) q = q.eq('tenant_id', tenantId);
  else q = q.is('tenant_id', null);
  
  const { data } = await q.limit(1);
  if (data && data.length > 0) {
    // Merge properties
    const existing = data[0];
    const merged = { ...existing.properties, ...properties };
    if (JSON.stringify(merged) !== JSON.stringify(existing.properties)) {
      await updateEntity(existing.id, { properties: merged });
    }
    return { id: existing.id, created: false };
  }
  const id = await addEntity(entityType, name, properties, tenantId);
  return { id, created: true };
}

// --- Edge Operations ---

async function addEdge(relationship, sourceId, targetId, properties = {}, opts = {}) {
  const db = getClient();
  const { data, error } = await db.from('kg_edges').insert({
    relationship,
    source_id: sourceId,
    target_id: targetId,
    properties,
    valid_from: opts.validFrom || new Date().toISOString(),
    valid_to: opts.validTo || null,
    confidence: opts.confidence ?? 1.0,
    provenance: opts.provenance || null,
    tenant_id: opts.tenantId || null,
    access_scope: opts.accessScope || 'tenant',
  }).select('id').single();
  if (error) throw new Error(`addEdge failed: ${error.message}`);
  return data.id;
}

async function findEdges(filters = {}) {
  const db = getClient();
  let q = db.from('kg_edges').select('*, source:kg_entities!source_id(*), target:kg_entities!target_id(*)');
  if (filters.sourceId) q = q.eq('source_id', filters.sourceId);
  if (filters.targetId) q = q.eq('target_id', filters.targetId);
  if (filters.relationship) q = q.eq('relationship', filters.relationship);
  if (filters.tenantId) q = q.eq('tenant_id', filters.tenantId);
  if (filters.activeOnly !== false) q = q.is('invalidated_at', null);
  if (filters.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) throw new Error(`findEdges failed: ${error.message}`);
  return data;
}

async function invalidateEdge(id, reason) {
  const db = getClient();
  const { error } = await db.from('kg_edges').update({
    invalidated_at: new Date().toISOString(),
    properties: db.rpc ? undefined : undefined, // TODO: append reason to properties
  }).eq('id', id);
  if (error) throw new Error(`invalidateEdge failed: ${error.message}`);
}

// --- Graph Traversal ---

async function traverse(startId, opts = {}) {
  const maxDepth = opts.maxDepth || 3;
  const relationships = opts.relationships; // null = all
  const tenantId = opts.tenantId;
  const direction = opts.direction || 'outgoing'; // 'outgoing', 'incoming', 'both'

  const db = getClient();
  
  // Use recursive CTE via RPC or raw SQL
  // For now, do iterative BFS in JS (works fine for depth ≤ 5)
  const visited = new Set([startId]);
  const results = [];
  let frontier = [startId];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const nextFrontier = [];
    
    for (const nodeId of frontier) {
      let q = db.from('kg_edges')
        .select('*, source:kg_entities!source_id(id,entity_type,name,properties), target:kg_entities!target_id(id,entity_type,name,properties)')
        .is('invalidated_at', null);

      if (direction === 'outgoing') {
        q = q.eq('source_id', nodeId);
      } else if (direction === 'incoming') {
        q = q.eq('target_id', nodeId);
      } else {
        q = q.or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);
      }

      if (relationships) q = q.in('relationship', relationships);
      if (tenantId) q = q.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

      const { data, error } = await q;
      if (error) continue;

      for (const edge of data || []) {
        const neighborId = edge.source_id === nodeId ? edge.target_id : edge.source_id;
        const neighbor = edge.source_id === nodeId ? edge.target : edge.source;
        
        results.push({
          edge: { id: edge.id, relationship: edge.relationship, properties: edge.properties, confidence: edge.confidence },
          node: neighbor,
          depth,
          from: nodeId,
        });

        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextFrontier.push(neighborId);
        }
      }
    }
    frontier = nextFrontier;
  }

  return results;
}

// --- Episode Operations ---

async function addEpisode(agentId, rawMessages, opts = {}) {
  const db = getClient();
  const { data, error } = await db.from('kg_episodes').insert({
    agent_id: agentId,
    client_id: opts.clientId || null,
    conversation_id: opts.conversationId || null,
    raw_messages: rawMessages,
    extraction_version: opts.extractionVersion || 'v3',
    extracted_entities: opts.entityIds || [],
    extracted_edges: opts.edgeIds || [],
    tenant_id: opts.tenantId || null,
  }).select('id').single();
  if (error) throw new Error(`addEpisode failed: ${error.message}`);
  return data.id;
}

async function cleanupExpiredEpisodes() {
  const db = getClient();
  const { data, error } = await db.from('kg_episodes')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');
  if (error) throw new Error(`cleanupExpiredEpisodes failed: ${error.message}`);
  return (data || []).length;
}

// --- Utility ---

async function stats(tenantId = null) {
  const db = getClient();
  let eq = tenantId ? { tenant_id: tenantId } : {};
  
  const [entities, edges, episodes] = await Promise.all([
    db.from('kg_entities').select('entity_type', { count: 'exact', head: true }),
    db.from('kg_edges').select('relationship', { count: 'exact', head: true }),
    db.from('kg_episodes').select('id', { count: 'exact', head: true }),
  ]);

  return {
    entities: entities.count || 0,
    edges: edges.count || 0,
    episodes: episodes.count || 0,
  };
}

module.exports = {
  init,
  getClient,
  addEntity,
  getEntity,
  findEntities,
  updateEntity,
  resolveEntity,
  addEdge,
  findEdges,
  invalidateEdge,
  traverse,
  addEpisode,
  cleanupExpiredEpisodes,
  stats,
};
