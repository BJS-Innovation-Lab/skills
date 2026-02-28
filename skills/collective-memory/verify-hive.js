const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'process.env.SUPABASE_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHive() {
  console.log('📡 Verifying BJS Hive Mind connectivity...');
  
  const { data, error } = await supabase
    .from('bjs_hive_agents')
    .select('name');
    
  if (error) {
    console.error('❌ Hive verification failed:', error.message);
  } else {
    console.log('✅ Hive is ALIVE. Registered agents:');
    data.forEach(a => console.log(`   - ${a.name}`));
    
    // Test a sample "Fact" push
    console.log('\n🧠 Pushing first collective memory...');
    const { error: pushError } = await supabase
      .from('bjs_hive_memories')
      .insert({
        source_agent_id: '5fae1839-ab85-412c-acc0-033cbbbbd15b',
        type: 'fact',
        title: 'Hive Mind Initialized',
        content: 'The BJS Hive Mind was officially initialized on Feb 26, 2026. This database stores validated wisdom for the VULKN agent team.'
      });
      
    if (pushError) {
      console.error('❌ Failed to push test memory:', pushError.message);
    } else {
      console.log('✅ Test memory successfully synced to Hive!');
    }
  }
}

checkHive();
