const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'process.env.SUPABASE_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const agents = [
  { id: '5fae1839-ab85-412c-acc0-033cbbbbd15b', name: 'Sybil' },
  { id: '415a84a4-af9e-4c98-9d48-040834436e44', name: 'Saber' },
  { id: '62bb0f39-2248-4b14-806d-1c498c654ee7', name: 'Sam' },
  { id: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb', name: 'Santos' },
  { id: 'f6198962-313d-4a39-89eb-72755602d468', name: 'Sage' }
];

async function registerAgents() {
  console.log('📡 Registering VULKN Agents (Slim Schema)...');
  
  for (const agent of agents) {
    const { data, error } = await supabase
      .from('agents')
      .upsert(agent, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Failed to register ${agent.name}:`, error.message);
    } else {
      console.log(`✅ Registered: ${agent.name}`);
    }
  }
}

registerAgents();
