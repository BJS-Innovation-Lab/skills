/**
 * VULKN Knowledge Graph — Core Library
 * Direct PostgreSQL connection via pg (not Supabase REST)
 */

const { Client, Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.join(__dirname, '../../..', 'rag/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

let pool;

function init() {
  if (pool) return pool;
  const pw = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
  pool = new Pool({
    connectionString: `postgresql://postgres:${pw}@db.fcgiuzmmvcnovaciykbx.supabase.co:5432/postgres`,
    max: 5,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

function getPool() { if (!pool) init(); return pool; }

// --- Entity Operations ---

async function addEntity(entityType, name, properties = {}, tenantId = null, accessScope = 'tenant') {
  const p = getPool();
  const { rows } = await p.query(
    `INSERT INTO kg_entities (entity_type, name, properties, tenant_id, access_scope) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [entityType, name, JSON.stringify(properties), tenantId, accessScope]
  );
  return rows[0].id;
}

async function getEntity(id) {
  const { rows } = await getPool().query('SELECT * FROM kg_entities WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findEntities(filters = {}) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.entityType) { conditions.push(`entity_type = $${i++}`); params.push(filters.entityType); }
  if (filters.tenantId) { conditions.push(`tenant_id = $${i++}`); params.push(filters.tenantId); }
  if (filters.name) { conditions.push(`name ILIKE $${i++}`); params.push(`%${filters.name}%`); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const limit = filters.limit ? `LIMIT ${parseInt(filters.limit)}` : 'LIMIT 200';

  const { rows } = await getPool().query(`SELECT * FROM kg_entities ${where} ORDER BY created_at DESC ${limit}`, params);
  return rows;
}

async function updateEntity(id, updates) {
  const sets = [];
  const params = [id];
  let i = 2;

  if (updates.properties !== undefined) { sets.push(`properties = $${i++}`); params.push(JSON.stringify(updates.properties)); }
  if (updates.name !== undefined) { sets.push(`name = $${i++}`); params.push(updates.name); }
  sets.push(`updated_at = now()`);

  await getPool().query(`UPDATE kg_entities SET ${sets.join(', ')} WHERE id = $1`, params);
}

async function resolveEntity(entityType, name, properties = {}, tenantId = null) {
  const p = getPool();
  const tenantCondition = tenantId ? 'AND tenant_id = $3' : 'AND tenant_id IS NULL';
  const params = tenantId ? [entityType, name, tenantId] : [entityType, name];

  const { rows } = await p.query(
    `SELECT * FROM kg_entities WHERE entity_type = $1 AND LOWER(name) = LOWER($2) ${tenantCondition} LIMIT 1`,
    params
  );

  if (rows.length > 0) {
    const existing = rows[0];
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
  const { rows } = await getPool().query(
    `INSERT INTO kg_edges (relationship, source_id, target_id, properties, valid_from, valid_to, confidence, provenance, tenant_id, access_scope)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      relationship, sourceId, targetId, JSON.stringify(properties),
      opts.validFrom || new Date().toISOString(), opts.validTo || null,
      opts.confidence ?? 1.0, opts.provenance || null,
      opts.tenantId || null, opts.accessScope || 'tenant',
    ]
  );
  return rows[0].id;
}

async function findEdges(filters = {}) {
  const conditions = ['e.invalidated_at IS NULL'];
  const params = [];
  let i = 1;

  if (filters.sourceId) { conditions.push(`e.source_id = $${i++}`); params.push(filters.sourceId); }
  if (filters.targetId) { conditions.push(`e.target_id = $${i++}`); params.push(filters.targetId); }
  if (filters.relationship) { conditions.push(`e.relationship = $${i++}`); params.push(filters.relationship); }
  if (filters.tenantId) { conditions.push(`(e.tenant_id = $${i++} OR e.tenant_id IS NULL)`); params.push(filters.tenantId); }

  const limit = filters.limit ? `LIMIT ${parseInt(filters.limit)}` : 'LIMIT 100';
  const where = conditions.join(' AND ');

  const { rows } = await getPool().query(`
    SELECT e.*, 
      json_build_object('id', s.id, 'entity_type', s.entity_type, 'name', s.name, 'properties', s.properties) as source,
      json_build_object('id', t.id, 'entity_type', t.entity_type, 'name', t.name, 'properties', t.properties) as target
    FROM kg_edges e
    JOIN kg_entities s ON e.source_id = s.id
    JOIN kg_entities t ON e.target_id = t.id
    WHERE ${where}
    ORDER BY e.created_at DESC ${limit}
  `, params);
  return rows;
}

async function invalidateEdge(id) {
  await getPool().query('UPDATE kg_edges SET invalidated_at = now() WHERE id = $1', [id]);
}

// --- Graph Traversal ---

async function traverse(startId, opts = {}) {
  const maxDepth = opts.maxDepth || 3;
  const tenantId = opts.tenantId;
  const direction = opts.direction || 'both';

  const visited = new Set([startId]);
  const results = [];
  let frontier = [startId];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const nextFrontier = [];
    const placeholders = frontier.map((_, i) => `$${i + 1}`).join(',');
    const params = [...frontier];

    let dirCondition;
    if (direction === 'outgoing') dirCondition = `e.source_id IN (${placeholders})`;
    else if (direction === 'incoming') dirCondition = `e.target_id IN (${placeholders})`;
    else dirCondition = `(e.source_id IN (${placeholders}) OR e.target_id IN (${placeholders}))`;

    let tenantCond = '';
    if (tenantId) {
      params.push(tenantId);
      tenantCond = `AND (e.tenant_id = $${params.length} OR e.tenant_id IS NULL)`;
    }

    const { rows } = await getPool().query(`
      SELECT e.id as edge_id, e.relationship, e.properties as edge_props, e.confidence,
        e.source_id, e.target_id,
        s.id as s_id, s.entity_type as s_type, s.name as s_name, s.properties as s_props,
        t.id as t_id, t.entity_type as t_type, t.name as t_name, t.properties as t_props
      FROM kg_edges e
      JOIN kg_entities s ON e.source_id = s.id
      JOIN kg_entities t ON e.target_id = t.id
      WHERE ${dirCondition} AND e.invalidated_at IS NULL ${tenantCond}
    `, params);

    for (const row of rows) {
      const fromNode = frontier.includes(row.source_id) ? row.source_id : row.target_id;
      const neighborId = row.source_id === fromNode ? row.target_id : row.source_id;
      const neighbor = row.source_id === fromNode
        ? { id: row.t_id, entity_type: row.t_type, name: row.t_name, properties: row.t_props }
        : { id: row.s_id, entity_type: row.s_type, name: row.s_name, properties: row.s_props };

      results.push({
        edge: { id: row.edge_id, relationship: row.relationship, properties: row.edge_props, confidence: row.confidence },
        node: neighbor,
        depth,
        from: fromNode,
      });

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        nextFrontier.push(neighborId);
      }
    }
    frontier = nextFrontier;
  }

  return results;
}

// --- Episode Operations ---

async function addEpisode(agentId, rawMessages, opts = {}) {
  const { rows } = await getPool().query(
    `INSERT INTO kg_episodes (agent_id, client_id, conversation_id, raw_messages, extraction_version, extracted_entities, extracted_edges, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      agentId, opts.clientId || null, opts.conversationId || null,
      JSON.stringify(rawMessages), opts.extractionVersion || 'v3',
      opts.entityIds || [], opts.edgeIds || [],
      opts.tenantId || null,
    ]
  );
  return rows[0].id;
}

async function cleanupExpiredEpisodes() {
  const { rowCount } = await getPool().query('DELETE FROM kg_episodes WHERE expires_at < now()');
  return rowCount;
}

// --- Stats ---

async function stats(tenantId = null) {
  const p = getPool();
  const tc = tenantId ? ' WHERE tenant_id = $1' : '';
  const params = tenantId ? [tenantId] : [];

  const [e, ed, ep] = await Promise.all([
    p.query(`SELECT count(*) FROM kg_entities${tc}`, params),
    p.query(`SELECT count(*) FROM kg_edges${tc}`, params),
    p.query(`SELECT count(*) FROM kg_episodes${tc}`, params),
  ]);

  return {
    entities: parseInt(e.rows[0].count),
    edges: parseInt(ed.rows[0].count),
    episodes: parseInt(ep.rows[0].count),
  };
}

async function close() {
  if (pool) { await pool.end(); pool = null; }
}

module.exports = {
  init, getPool, addEntity, getEntity, findEntities, updateEntity, resolveEntity,
  addEdge, findEdges, invalidateEdge, traverse,
  addEpisode, cleanupExpiredEpisodes, stats, close,
};
