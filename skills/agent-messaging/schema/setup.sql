-- Agent Messaging System for VULKN
-- Created: 2026-03-06
-- Purpose: Replace A2A with Supabase-based messaging

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Routing
  client_id TEXT NOT NULL DEFAULT 'vulkn-internal',
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  
  -- Content
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'message', -- message, escalation, alert, notification
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_messages_to_agent ON agent_messages(to_agent);
CREATE INDEX IF NOT EXISTS idx_messages_from_agent ON agent_messages(from_agent);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON agent_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON agent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON agent_messages(to_agent, read) WHERE read = false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can see messages TO or FROM them
CREATE POLICY "agents_own_messages"
ON agent_messages
FOR SELECT
USING (
  to_agent = current_setting('app.agent_id', true)
  OR from_agent = current_setting('app.agent_id', true)
);

-- Policy: Agents can insert messages (send)
CREATE POLICY "agents_can_send"
ON agent_messages
FOR INSERT
WITH CHECK (
  from_agent = current_setting('app.agent_id', true)
);

-- Policy: Agents can update their received messages (mark as read)
CREATE POLICY "agents_can_mark_read"
ON agent_messages
FOR UPDATE
USING (
  to_agent = current_setting('app.agent_id', true)
)
WITH CHECK (
  to_agent = current_setting('app.agent_id', true)
);

-- ============================================
-- ADMIN ACCESS (bypasses RLS)
-- ============================================

-- Create admin role for founders/observers
-- Run these with service_role key which bypasses RLS anyway
-- Or create a specific admin policy:

CREATE POLICY "admins_see_all"
ON agent_messages
FOR ALL
USING (
  current_setting('app.role', true) = 'admin'
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to send a message
CREATE OR REPLACE FUNCTION send_agent_message(
  p_to_agent TEXT,
  p_message TEXT,
  p_subject TEXT DEFAULT NULL,
  p_message_type TEXT DEFAULT 'message',
  p_priority TEXT DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO agent_messages (
    from_agent,
    to_agent,
    subject,
    message,
    message_type,
    priority,
    metadata,
    client_id
  ) VALUES (
    current_setting('app.agent_id', true),
    p_to_agent,
    p_subject,
    p_message,
    p_message_type,
    p_priority,
    p_metadata,
    COALESCE(current_setting('app.client_id', true), 'vulkn-internal')
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread messages
CREATE OR REPLACE FUNCTION get_unread_messages()
RETURNS SETOF agent_messages AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM agent_messages
  WHERE to_agent = current_setting('app.agent_id', true)
    AND read = false
  ORDER BY 
    CASE priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'normal' THEN 3 
      WHEN 'low' THEN 4 
    END,
    created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_messages
  SET read = true, read_at = now(), updated_at = now()
  WHERE id = p_message_id
    AND to_agent = current_setting('app.agent_id', true);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTION
-- ============================================

-- Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- View: Today's messages (for admin dashboard)
CREATE OR REPLACE VIEW messages_today AS
SELECT 
  id,
  client_id,
  from_agent,
  to_agent,
  subject,
  LEFT(message, 100) as message_preview,
  message_type,
  priority,
  read,
  created_at
FROM agent_messages
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- View: Unread count per agent
CREATE OR REPLACE VIEW unread_counts AS
SELECT 
  to_agent,
  COUNT(*) as unread_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count
FROM agent_messages
WHERE read = false
GROUP BY to_agent;

-- ============================================
-- SAMPLE DATA (VULKN Team)
-- ============================================

-- Register known agents (optional, for validation)
CREATE TABLE IF NOT EXISTS known_agents (
  agent_id TEXT PRIMARY KEY,
  display_name TEXT,
  client_id TEXT DEFAULT 'vulkn-internal',
  role TEXT DEFAULT 'agent', -- agent, observer, admin
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO known_agents (agent_id, display_name, role) VALUES
  ('sybil', 'Sybil', 'agent'),
  ('saber', 'Saber', 'agent'),
  ('sage', 'Sage', 'agent'),
  ('santos', 'Santos', 'agent'),
  ('sam', 'Sam', 'agent'),
  ('vulkn-cs', 'VULKN CS Agent', 'observer'),
  ('bridget', 'Bridget', 'admin'),
  ('johan', 'Johan', 'admin')
ON CONFLICT (agent_id) DO NOTHING;
