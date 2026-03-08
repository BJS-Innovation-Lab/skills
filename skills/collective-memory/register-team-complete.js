const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../rag/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORG_ID = '6420346e-4e6a-47a8-b671-80beacd394b4';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const agents = [
  { id: '5fae1839-ab85-412c-acc0-033cbbbbd15b', name: 'Sybil', org_id: ORG_ID },
  { id: '415a84a4-af9e-4c98-9d48-040834436e44', name: 'Saber', org_id: ORG_ID },
  { id: '62bb0f39-2248-4b14-806d-1c498c654ee7', name: 'Sam', org_id: ORG_ID },
  { id: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb', name: 'Santos', org_id: ORG_ID },
  { id: 'f6198962-313d-4a39-89eb-72755602d468', name: 'Sage', org_id: ORG_ID }
];

async function registerAgents() {
  console.log('📡 Registering VULKN Agents to Hive Mind...');
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  
  // Step 1: Create the Org if it doesn't exist
  console.log('Building Org structure...');
  const { error: orgError } = await supabase
    .from('orgs')
    .upsert({ id: ORG_ID, name: 'VULKN / BJS LABS' });
    
  if (orgError) {
    console.error('❌ Failed to create Org:', orgError.message);
  } else {
    console.log('✅ Org created/verified');
  }

  // Step 2: Register Agents
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
  
  console.log('🐝 Hive Mind registration complete!');
}

registerAgents();
