-- Supabase table for storing Slack installations

CREATE TABLE IF NOT EXISTS slack_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  app_token TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  raw_response JSONB,
  
  -- Ensure one installation per team per agent
  UNIQUE(team_id, agent_name)
);

-- Index for quick lookups
CREATE INDEX idx_slack_installations_team ON slack_installations(team_id);
CREATE INDEX idx_slack_installations_agent ON slack_installations(agent_name);

-- RLS policies (adjust as needed)
ALTER TABLE slack_installations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON slack_installations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Example: Allow reading own team's installations
-- CREATE POLICY "Users can view own team" ON slack_installations
--   FOR SELECT
--   USING (team_id = current_setting('request.jwt.claims')::json->>'team_id');
