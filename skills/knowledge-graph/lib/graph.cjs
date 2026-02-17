#!/usr/bin/env node
/**
 * VULKN Knowledge Graph — Core Library
 * 
 * Lightweight graph engine backed by Supabase (PostgreSQL).
 * No external graph DB needed. Owns the full lifecycle:
 *   addNode, addEdge, traverse, findPatterns, query
 * 
 * Tables required: kg_nodes, kg_edges (see migrations/)
 * 
 * Usage:
 *   const { Graph } = require('./graph.cjs');
 *   const g = new Graph();  // reads env from rag/.env
 *   await g.addNode('agent', { name: 'Sam', emoji: '🛠️' });
 *   await g.addEdge(samId, clientId, 'SERVES', { start_date: '2026-02-01' });
 *   const results = await g.traverse(samId, 'SERVES', { depth: 2 });
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Env ─────────────────────────────────────────────────────────────
const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const ENV_PATHS = [
  path.join(WORKSPACE, 'rag/.env'),
  path.join(__dirname, '../../rag/.env'),
];
for (const envPath of ENV_PATHS) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
    break;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// ── HTTP helpers ────────────────────────────────────────────────────
async function sbFetch(endpoint, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': opts.prefer || 'return=representation',
  };
  
  const resp = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase ${opts.method || 'GET'} ${endpoint}: ${resp.status} ${text}`);
  }
  
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// ── Graph Class ─────────────────────────────────────────────────────
// ── Scope Constants ─────────────────────────────────────────────────
// One graph, scoped views. Per Bridget: cross-client insights require
// a single graph — but field agents must not see other clients' data.
const SCOPES = {
  GLOBAL: 'global',           // shared knowledge (agent capabilities, team structure)
  INTERNAL: 'internal',       // HQ-only (pricing, strategy, research)
  client: (name) => `client:${name.toLowerCase()}`,  // client-specific data
};

const ACCESS_LEVELS = {
  field: (clientScopes) => ['global', ...clientScopes],         // field agents: their clients + global
  hq: () => null,                                                // HQ agents: everything (no filter)
  founder: () => null,                                           // founders: everything
};

class Graph {
  /**
   * @param {object} opts
   * @param {string} [opts.nodeTable] - Supabase table for nodes
   * @param {string} [opts.edgeTable] - Supabase table for edges  
   * @param {string} [opts.scope] - Default scope for new nodes ('global', 'internal', 'client:name')
   * @param {string[]} [opts.visibleScopes] - Scopes this graph instance can read (null = all)
   */
  constructor(opts = {}) {
    this.nodeTable = opts.nodeTable || 'kg_nodes';
    this.edgeTable = opts.edgeTable || 'kg_edges';
    this.defaultScope = opts.scope || SCOPES.GLOBAL;
    this.visibleScopes = opts.visibleScopes || null; // null = no filter (HQ/founder)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }
  }

  // ── Nodes ───────────────────────────────────────────────────────
  
  /**
   * Add a node to the graph.
   * @param {string} type - Node type (agent, client, person, conversation, etc.)
   * @param {object} properties - Node properties
   * @param {string} [externalId] - Optional stable ID for dedup (e.g. telegram user ID)
   * @returns {object} Created node
   */
  async addNode(type, properties, externalId = null) {
    const id = externalId || crypto.randomUUID();
    
    // Upsert: if externalId exists, merge properties
    if (externalId) {
      const existing = await this.getNode(externalId);
      if (existing) {
        return this.updateNode(externalId, { 
          ...existing.properties, 
          ...properties,
          _updated: new Date().toISOString()
        });
      }
    }
    
    const scope = properties._scope || this.defaultScope;
    const node = {
      id,
      node_type: type,
      properties: { ...properties, _scope: scope, _created: new Date().toISOString() },
    };
    
    const [result] = await sbFetch(this.nodeTable, {
      method: 'POST',
      body: node,
    });
    
    return result;
  }

  /**
   * Get a node by ID.
   */
  async getNode(id) {
    const results = await sbFetch(`${this.nodeTable}?id=eq.${id}`);
    return results[0] || null;
  }

  /**
   * Find nodes by type and optional property filters.
   * Respects scope visibility — field agents only see their assigned clients + global.
   */
  async findNodes(type, filters = {}) {
    let query = `${this.nodeTable}?node_type=eq.${type}`;
    for (const [key, value] of Object.entries(filters)) {
      query += `&properties->>$.${key}=eq.${encodeURIComponent(value)}`;
    }
    // Apply scope filter if this graph instance has visibility restrictions
    if (this.visibleScopes) {
      const scopeFilter = this.visibleScopes.map(s => `properties->>_scope.eq.${s}`).join(',');
      query += `&or=(${scopeFilter})`;
    }
    return sbFetch(query);
  }

  /**
   * Find a node by type and a specific property value.
   */
  async findNode(type, propKey, propValue) {
    const results = await sbFetch(
      `${this.nodeTable}?node_type=eq.${type}&properties->>$.${propKey}=eq.${encodeURIComponent(propValue)}`
    );
    return results[0] || null;
  }

  /**
   * Update a node's properties (merge).
   */
  async updateNode(id, properties) {
    const [result] = await sbFetch(`${this.nodeTable}?id=eq.${id}`, {
      method: 'PATCH',
      body: { properties },
    });
    return result;
  }

  /**
   * Delete a node and all its edges.
   */
  async deleteNode(id) {
    await sbFetch(`${this.edgeTable}?or=(from_node.eq.${id},to_node.eq.${id})`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    await sbFetch(`${this.nodeTable}?id=eq.${id}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
  }

  // ── Edges ───────────────────────────────────────────────────────

  /**
   * Add an edge between two nodes.
   * @param {string} fromNode - Source node ID
   * @param {string} toNode - Target node ID
   * @param {string} type - Relationship type (SERVES, WORKS_FOR, LED_TO, etc.)
   * @param {object} [properties] - Edge properties
   * @returns {object} Created edge
   */
  async addEdge(fromNode, toNode, type, properties = {}) {
    // Dedup: don't create duplicate edges
    const existing = await sbFetch(
      `${this.edgeTable}?from_node=eq.${fromNode}&to_node=eq.${toNode}&edge_type=eq.${type}&limit=1`
    );
    if (existing.length > 0) {
      // Merge properties
      return this.updateEdge(existing[0].id, { 
        ...existing[0].properties, 
        ...properties,
        _updated: new Date().toISOString()
      });
    }

    const edge = {
      id: crypto.randomUUID(),
      from_node: fromNode,
      to_node: toNode,
      edge_type: type,
      properties: { ...properties, _created: new Date().toISOString() },
    };
    
    const [result] = await sbFetch(this.edgeTable, {
      method: 'POST',
      body: edge,
    });
    
    return result;
  }

  /**
   * Get edges from a node, optionally filtered by type.
   */
  async getEdgesFrom(nodeId, edgeType = null) {
    let query = `${this.edgeTable}?from_node=eq.${nodeId}`;
    if (edgeType) query += `&edge_type=eq.${edgeType}`;
    return sbFetch(query);
  }

  /**
   * Get edges to a node, optionally filtered by type.
   */
  async getEdgesTo(nodeId, edgeType = null) {
    let query = `${this.edgeTable}?to_node=eq.${nodeId}`;
    if (edgeType) query += `&edge_type=eq.${edgeType}`;
    return sbFetch(query);
  }

  /**
   * Update an edge's properties.
   */
  async updateEdge(id, properties) {
    const [result] = await sbFetch(`${this.edgeTable}?id=eq.${id}`, {
      method: 'PATCH',
      body: { properties },
    });
    return result;
  }

  // ── Traversal ─────────────────────────────────────────────────

  /**
   * Traverse the graph from a starting node.
   * Returns all connected nodes up to `depth` hops.
   * 
   * @param {string} startId - Starting node ID
   * @param {object} opts - { depth: 2, edgeTypes: ['SERVES', 'WORKS_FOR'], direction: 'out'|'in'|'both' }
   * @returns {object} { nodes: [...], edges: [...], paths: [...] }
   */
  async traverse(startId, opts = {}) {
    const depth = opts.depth || 2;
    const direction = opts.direction || 'both';
    const edgeTypes = opts.edgeTypes || null;

    const visited = new Set();
    const allNodes = [];
    const allEdges = [];
    const paths = [];

    async function visit(nodeId, currentDepth, path) {
      if (currentDepth > depth || visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = await this.getNode(nodeId);
      if (node) allNodes.push(node);

      if (currentDepth >= depth) return;

      // Get outgoing edges
      if (direction === 'out' || direction === 'both') {
        let edges = await this.getEdgesFrom(nodeId);
        if (edgeTypes) edges = edges.filter(e => edgeTypes.includes(e.edge_type));
        for (const edge of edges) {
          allEdges.push(edge);
          const newPath = [...path, { edge, direction: 'out' }];
          paths.push(newPath);
          await visit.call(this, edge.to_node, currentDepth + 1, newPath);
        }
      }

      // Get incoming edges
      if (direction === 'in' || direction === 'both') {
        let edges = await this.getEdgesTo(nodeId);
        if (edgeTypes) edges = edges.filter(e => edgeTypes.includes(e.edge_type));
        for (const edge of edges) {
          allEdges.push(edge);
          const newPath = [...path, { edge, direction: 'in' }];
          paths.push(newPath);
          await visit.call(this, edge.from_node, currentDepth + 1, newPath);
        }
      }
    }

    await visit.call(this, startId, 0, []);

    return {
      nodes: allNodes,
      edges: [...new Map(allEdges.map(e => [e.id, e])).values()], // dedup
      paths,
    };
  }

  // ── Pattern Detection ─────────────────────────────────────────

  /**
   * Find nodes connected through a specific relationship chain.
   * Example: findChain(['agent', 'SERVES', 'client', 'EMPLOYS', 'person'])
   * 
   * @param {string[]} chain - Alternating [nodeType, edgeType, nodeType, ...]
   * @returns {object[]} Array of matching paths
   */
  async findChain(chain) {
    if (chain.length < 3 || chain.length % 2 === 0) {
      throw new Error('Chain must be [nodeType, edgeType, nodeType, ...]');
    }

    // Start with all nodes of the first type
    const startNodes = await this.findNodes(chain[0]);
    const results = [];

    for (const startNode of startNodes) {
      const paths = await this._followChain(startNode, chain.slice(1), [startNode]);
      results.push(...paths);
    }

    return results;
  }

  async _followChain(currentNode, remainingChain, currentPath) {
    if (remainingChain.length === 0) return [currentPath];

    const [edgeType, targetType, ...rest] = remainingChain;
    const edges = await this.getEdgesFrom(currentNode.id, edgeType);
    const results = [];

    for (const edge of edges) {
      const targetNode = await this.getNode(edge.to_node);
      if (targetNode && targetNode.node_type === targetType) {
        const newPath = [...currentPath, edge, targetNode];
        const subResults = await this._followChain(targetNode, rest, newPath);
        results.push(...subResults);
      }
    }

    return results;
  }

  /**
   * Find patterns: nodes of a given type that share a relationship pattern.
   * Example: "Find all clients that EXHIBITS the same pattern"
   */
  async findSharedPatterns(nodeType, edgeType, minCount = 2) {
    // Get all edges of this type
    const allEdges = await sbFetch(`${this.edgeTable}?edge_type=eq.${edgeType}`);
    
    // Group by target
    const targetGroups = {};
    for (const edge of allEdges) {
      if (!targetGroups[edge.to_node]) targetGroups[edge.to_node] = [];
      targetGroups[edge.to_node].push(edge.from_node);
    }

    // Find targets shared by >= minCount sources
    const shared = [];
    for (const [targetId, sourceIds] of Object.entries(targetGroups)) {
      if (sourceIds.length >= minCount) {
        const target = await this.getNode(targetId);
        const sources = await Promise.all(sourceIds.map(id => this.getNode(id)));
        shared.push({ 
          sharedNode: target, 
          connectedNodes: sources.filter(Boolean),
          count: sourceIds.length 
        });
      }
    }

    return shared;
  }

  // ── Stats ─────────────────────────────────────────────────────

  /**
   * Get graph statistics.
   */
  async stats() {
    const nodes = await sbFetch(`${this.nodeTable}?select=node_type`);
    const edges = await sbFetch(`${this.edgeTable}?select=edge_type`);

    const nodesByType = {};
    for (const n of nodes) {
      nodesByType[n.node_type] = (nodesByType[n.node_type] || 0) + 1;
    }

    const edgesByType = {};
    for (const e of edges) {
      edgesByType[e.edge_type] = (edgesByType[e.edge_type] || 0) + 1;
    }

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType,
      edgesByType,
    };
  }
}

module.exports = { Graph, SCOPES, ACCESS_LEVELS };
