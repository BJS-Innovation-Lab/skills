-- VULKN Knowledge Graph — Core Tables
-- Run against Supabase PostgreSQL

-- Nodes: entities in the graph (agents, clients, people, conversations, etc.)
CREATE TABLE IF NOT EXISTS kg_nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON kg_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_properties ON kg_nodes USING GIN(properties);

-- Edges: relationships between nodes
CREATE TABLE IF NOT EXISTS kg_edges (
  id TEXT PRIMARY KEY,
  from_node TEXT NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  to_node TEXT NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON kg_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON kg_edges(to_node);
CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON kg_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_kg_edges_from_type ON kg_edges(from_node, edge_type);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to_type ON kg_edges(to_node, edge_type);

-- Prevent duplicate edges (same from, to, type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_edges_unique 
  ON kg_edges(from_node, to_node, edge_type);

-- Multi-hop traversal function (PostgreSQL recursive CTE)
CREATE OR REPLACE FUNCTION kg_traverse(
  start_node TEXT,
  max_depth INT DEFAULT 3,
  edge_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  node_id TEXT,
  node_type TEXT,
  node_properties JSONB,
  depth INT,
  path TEXT[]
) AS $$
WITH RECURSIVE traversal AS (
  -- Base case: starting node
  SELECT 
    n.id AS node_id,
    n.node_type,
    n.properties AS node_properties,
    0 AS depth,
    ARRAY[n.id] AS path
  FROM kg_nodes n
  WHERE n.id = start_node

  UNION ALL

  -- Recursive case: follow edges
  SELECT 
    n.id,
    n.node_type,
    n.properties,
    t.depth + 1,
    t.path || n.id
  FROM traversal t
  JOIN kg_edges e ON (e.from_node = t.node_id OR e.to_node = t.node_id)
  JOIN kg_nodes n ON (
    n.id = CASE WHEN e.from_node = t.node_id THEN e.to_node ELSE e.from_node END
  )
  WHERE t.depth < max_depth
    AND NOT (n.id = ANY(t.path))  -- prevent cycles
    AND (edge_filter IS NULL OR e.edge_type = ANY(edge_filter))
)
SELECT * FROM traversal;
$$ LANGUAGE SQL STABLE;
