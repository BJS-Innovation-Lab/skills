const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

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
  }
}

checkHive();
