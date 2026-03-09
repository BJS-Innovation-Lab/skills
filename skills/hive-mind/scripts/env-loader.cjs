/**
 * Shared env loader for hive-mind scripts
 * Auto-loads from rag/.env if SUPABASE_URL not already set
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  // Skip if already loaded
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return;
  }

  // Try multiple locations for .env
  const workspace = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
  const envPaths = [
    path.join(workspace, 'rag/.env'),
    path.join(workspace, '.env'),
    path.join(__dirname, '../../../rag/.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, ''); // Strip quotes
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
      return;
    }
  }

  console.error('Warning: Could not find .env file for Supabase credentials');
}

module.exports = { loadEnv };
