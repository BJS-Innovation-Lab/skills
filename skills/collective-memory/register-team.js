const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'process.env.SUPABASE_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const agents = [
  { id: '5fae1839-ab85-412c-acc0-033cbbbbd15b', name: 'Sybil', model: 'google/gemini-3-flash-preview' },
  { id: '415a84a4-af9e-4c98-9d48-040834436e44', name: 'Saber', model: 'anthropic/claude-sonnet-4-0' },
  { id: '62bb0f39-2248-4b14-806d-1c498c654ee7', name: 'Sam', model: 'anthropic/claude-sonnet-4-0' },
  { id: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb', name: 'Santos', model: 'anthropic/claude-sonnet-4-0' },
  { id: 'f6198962-313d-4a39-89eb-72755602d468', name: 'Sage', model: 'anthropic/claude-sonnet-4-0' }
];

async function registerAgents() {
  console.log('📡 Registering VULKN Agents in Hive Mind...');
  
  for (const agent of agents) {
    const { data, error } = await supabase
      .from('agents')
      .upsert(agent, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error(`❌ Failed to register ${agent.name}:`, error.message);
    } else {
      console.log(`✅ Registered: ${agent.name} (${agent.id})`);
    }
  }
}

registerAgents();
