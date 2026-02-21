-- Conversations table — structured message log from field agents
-- Enables querying full chat history by agent, client, user, date

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  agent_name text NOT NULL,
  session_id text,
  client_id text,           -- e.g. 'click-seguros'
  user_id text,             -- telegram user id or name
  user_name text,           -- display name
  direction text NOT NULL,  -- 'in' (user→agent) or 'out' (agent→user)
  message text NOT NULL,
  message_type text DEFAULT 'text',  -- 'text', 'tool_call', 'tool_result', 'system'
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS conv_agent_ts ON conversations (agent_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_client_ts ON conversations (client_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_user_ts ON conversations (user_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS conv_date ON conversations (timestamp DESC);

-- RLS (keep open for service key access)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_key_all" ON conversations FOR ALL USING (true) WITH CHECK (true);

-- Function to query conversations by agent + date range
CREATE OR REPLACE FUNCTION get_conversations(
  p_agent text,
  p_start timestamptz,
  p_end timestamptz,
  p_client text DEFAULT NULL,
  p_user text DEFAULT NULL,
  p_limit int DEFAULT 500
)
RETURNS TABLE (
  id uuid,
  session_id text,
  client_id text,
  user_name text,
  direction text,
  message text,
  message_type text,
  ts timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT c.id, c.session_id, c.client_id, c.user_name, c.direction, c.message, c.message_type, c.timestamp
  FROM conversations c
  WHERE c.agent_name = p_agent
    AND c.timestamp >= p_start
    AND c.timestamp <= p_end
    AND (p_client IS NULL OR c.client_id = p_client)
    AND (p_user IS NULL OR c.user_name = p_user)
  ORDER BY c.timestamp ASC
  LIMIT p_limit;
$$;
