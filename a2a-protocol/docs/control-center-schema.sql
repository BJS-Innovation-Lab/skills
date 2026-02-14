-- A2A Control Center Schema v2
-- Uses cc_ prefix to avoid conflicts with existing tables
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CC_AGENTS TABLE
-- Registry of all agents in the control center
-- ============================================
CREATE TABLE IF NOT EXISTS cc_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  agent_role TEXT,
  org_id UUID NOT NULL,
  capabilities JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'error')),
  last_heartbeat TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_agents_org_id ON cc_agents(org_id);
CREATE INDEX IF NOT EXISTS idx_cc_agents_status ON cc_agents(status);

-- ============================================
-- CC_HEALTH TABLE
-- Health pings and uptime metrics
-- ============================================
CREATE TABLE IF NOT EXISTS cc_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES cc_agents(agent_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  cpu_usage NUMERIC(5,2),
  memory_usage NUMERIC(5,2),
  active_tasks INTEGER DEFAULT 0,
  pending_messages INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_health_agent_id ON cc_health(agent_id);
CREATE INDEX IF NOT EXISTS idx_cc_health_created_at ON cc_health(created_at DESC);

-- ============================================
-- CC_MESSAGES TABLE
-- Central log of inter-agent messages
-- ============================================
CREATE TABLE IF NOT EXISTS cc_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_agent_id UUID NOT NULL,
  to_agent_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'task', 'response', 'broadcast', 'system')),
  subject TEXT,
  content JSONB NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read', 'processed', 'failed')),
  thread_id UUID,
  parent_message_id UUID REFERENCES cc_messages(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cc_messages_to_agent ON cc_messages(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_from_agent ON cc_messages(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_status ON cc_messages(status);
CREATE INDEX IF NOT EXISTS idx_cc_messages_thread ON cc_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_cc_messages_created_at ON cc_messages(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION cc_get_pending_messages(p_agent_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS SETOF cc_messages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM cc_messages
  WHERE to_agent_id = p_agent_id AND status = 'pending'
  ORDER BY
    CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
    created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cc_update_agent_heartbeat(p_agent_id UUID, p_status TEXT DEFAULT 'online')
RETURNS void AS $$
BEGIN
  UPDATE cc_agents SET last_heartbeat = NOW(), status = p_status, updated_at = NOW()
  WHERE agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cc_register_agent(
  p_agent_id UUID, p_agent_name TEXT, p_org_id UUID,
  p_agent_role TEXT DEFAULT NULL, p_capabilities JSONB DEFAULT '[]'::jsonb, p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS cc_agents AS $$
DECLARE v_agent cc_agents;
BEGIN
  INSERT INTO cc_agents (agent_id, agent_name, org_id, agent_role, capabilities, metadata, status, last_heartbeat)
  VALUES (p_agent_id, p_agent_name, p_org_id, p_agent_role, p_capabilities, p_metadata, 'online', NOW())
  ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_role = COALESCE(EXCLUDED.agent_role, cc_agents.agent_role),
    capabilities = EXCLUDED.capabilities,
    metadata = cc_agents.metadata || EXCLUDED.metadata,
    status = 'online', last_heartbeat = NOW(), updated_at = NOW()
  RETURNING * INTO v_agent;
  RETURN v_agent;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE cc_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_agents_select" ON cc_agents FOR SELECT USING (true);
CREATE POLICY "cc_agents_insert" ON cc_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "cc_agents_update" ON cc_agents FOR UPDATE USING (true);

CREATE POLICY "cc_health_select" ON cc_health FOR SELECT USING (true);
CREATE POLICY "cc_health_insert" ON cc_health FOR INSERT WITH CHECK (true);

CREATE POLICY "cc_messages_select" ON cc_messages FOR SELECT USING (true);
CREATE POLICY "cc_messages_insert" ON cc_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "cc_messages_update" ON cc_messages FOR UPDATE USING (true);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE cc_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_health;
ALTER PUBLICATION supabase_realtime ADD TABLE cc_messages;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION cc_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cc_agents_updated_at
  BEFORE UPDATE ON cc_agents FOR EACH ROW EXECUTE FUNCTION cc_update_updated_at();
