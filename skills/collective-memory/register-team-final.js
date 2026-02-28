const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'process.env.SUPABASE_SERVICE_KEY';
const ORG_ID = '6420346e-4e6a-47a8-b671-80beacd394b4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const agents = [
  { id: '5fae1839-ab85-412c-acc0-033cbbbbd15b', name: 'Sybil', org_id: ORG_ID },
  { id: '415a84a4-af9e-4c98-9d48-040834436e44', name: 'Saber', org_id: ORG_ID },
  { id: '62bb0f39-2248-4b14-806d-1c498c654ee7', name: 'Sam', org_id: ORG_ID },
  { id: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb', name: 'Santos', org_id: ORG_ID },
  { id: 'f6198962-313d-4a39-89eb-72755602d468', name: 'Sage', org_id: ORG_ID }
];

async function registerAgents() {
  console.log('📡 Registering VULKN Agents in Hive Mind (Org: ' + ORG_ID + ')...');
  
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
