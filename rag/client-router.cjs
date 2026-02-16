/**
 * client-router.cjs — Map session/chat IDs to client names
 * 
 * Used by multi-client agents (e.g., Sam serving 2+ clients)
 * to route memory reads/writes to the correct client namespace.
 * 
 * Usage:
 *   const { getClientId, CLIENT_MAP } = require('./client-router.cjs');
 *   const clientId = getClientId('telegram:direct:12345');
 *   // Returns 'acme' or null (for agent-level/shared context)
 * 
 * Configuration:
 *   Set CLIENT_MAP in rag/.client-map.json:
 *   {
 *     "telegram:direct:12345": "acme",
 *     "telegram:direct:67890": "globex",
 *     "telegram:group:-100123": "acme"
 *   }
 * 
 *   Or via env: CLIENT_MAP_FILE=/path/to/map.json
 */

const fs = require('fs');
const path = require('path');

const MAP_FILE = process.env.CLIENT_MAP_FILE || path.join(__dirname, '.client-map.json');

let CLIENT_MAP = {};

try {
  if (fs.existsSync(MAP_FILE)) {
    CLIENT_MAP = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('client-router: Could not load client map:', e.message);
}

/**
 * Get client ID from a session key or chat identifier.
 * Returns null if no mapping found (treat as shared/agent-level context).
 * 
 * @param {string} sessionKey - e.g., 'telegram:direct:12345' or 'agent:main:telegram:direct:12345'
 * @returns {string|null} - client name/id or null
 */
function getClientId(sessionKey) {
  if (!sessionKey) return null;
  
  // Try exact match first
  if (CLIENT_MAP[sessionKey]) return CLIENT_MAP[sessionKey];
  
  // Try extracting the chat-specific part
  // session keys look like: agent:main:telegram:direct:USER_ID
  const parts = sessionKey.split(':');
  
  // Try from the end: telegram:direct:ID, direct:ID, just ID
  for (let i = Math.max(0, parts.length - 3); i < parts.length; i++) {
    const suffix = parts.slice(i).join(':');
    if (CLIENT_MAP[suffix]) return CLIENT_MAP[suffix];
  }
  
  // Try just the last part (user ID)
  const lastPart = parts[parts.length - 1];
  if (CLIENT_MAP[lastPart]) return CLIENT_MAP[lastPart];
  
  return null;
}

/**
 * Get the memory directory for a client.
 * @param {string} clientId - client name
 * @param {string} workspace - workspace root
 * @returns {string} - path to client memory dir
 */
function getClientMemoryDir(clientId, workspace) {
  if (!clientId) return path.join(workspace, 'memory');
  const dir = path.join(workspace, 'memory', 'clients', clientId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { getClientId, getClientMemoryDir, CLIENT_MAP };
