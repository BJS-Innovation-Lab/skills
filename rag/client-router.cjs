/**
 * client-router.cjs — Map session/chat IDs to client names + user context
 * 
 * Used by multi-client agents (e.g., Sam serving 2+ clients)
 * to route memory reads/writes to the correct client namespace.
 * 
 * Usage:
 *   const { getClientId, getUserContext, CLIENT_MAP } = require('./client-router.cjs');
 *   const clientId = getClientId('telegram:direct:12345');
 *   const ctx = getUserContext('12345');
 *   // ctx = { clientId: 'click-seguros', userId: '12345', userName: 'Javier', isolation: 'user-first' }
 * 
 * Configuration (.client-map.json) — supports both flat and rich formats:
 * 
 *   Flat (backward-compatible):
 *   { "12345": "acme", "67890": "globex" }
 * 
 *   Rich (with user names + isolation mode):
 *   {
 *     "clients": {
 *       "click-seguros": {
 *         "users": {
 *           "8356964364": "Javier",
 *           "7595883487": "Suzanne"
 *         },
 *         "isolation": "user-first"
 *       }
 *     }
 *   }
 * 
 *   Isolation modes (per client, field agent decides):
 *     "shared"     — everyone sees everything (default)
 *     "user-first" — prioritize current user's history, but can access team pool
 *     "strict"     — each employee only sees their own conversations
 */

const fs = require('fs');
const path = require('path');

const MAP_FILE = process.env.CLIENT_MAP_FILE || path.join(__dirname, '.client-map.json');

let CLIENT_MAP = {};    // flat: userId -> clientName (backward compat)
let CLIENT_CONFIG = {}; // rich: clientName -> { users, isolation }
let _isRichFormat = false;

try {
  if (fs.existsSync(MAP_FILE)) {
    const raw = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
    
    if (raw.clients) {
      // Rich format
      _isRichFormat = true;
      CLIENT_CONFIG = raw.clients;
      // Build flat map for backward compatibility
      for (const [clientName, config] of Object.entries(CLIENT_CONFIG)) {
        if (config.users) {
          for (const userId of Object.keys(config.users)) {
            CLIENT_MAP[userId] = clientName;
          }
        }
      }
    } else {
      // Flat format (backward compatible)
      CLIENT_MAP = raw;
    }
  }
} catch (e) {
  console.warn('client-router: Could not load client map:', e.message);
}

/**
 * Get client ID from a session key or chat identifier.
 * Returns null if no mapping found (treat as shared/agent-level context).
 */
function getClientId(sessionKey) {
  if (!sessionKey) return null;
  
  // Try exact match first
  if (CLIENT_MAP[sessionKey]) return CLIENT_MAP[sessionKey];
  
  // Try extracting the chat-specific part
  const parts = sessionKey.split(':');
  
  for (let i = Math.max(0, parts.length - 3); i < parts.length; i++) {
    const suffix = parts.slice(i).join(':');
    if (CLIENT_MAP[suffix]) return CLIENT_MAP[suffix];
  }
  
  const lastPart = parts[parts.length - 1];
  if (CLIENT_MAP[lastPart]) return CLIENT_MAP[lastPart];
  
  return null;
}

/**
 * Get full user context: client, user name, isolation mode.
 * @param {string} sessionKey - session key or user ID
 * @returns {{ clientId: string|null, userId: string|null, userName: string|null, isolation: string }}
 */
function getUserContext(sessionKey) {
  const clientId = getClientId(sessionKey);
  if (!clientId) return { clientId: null, userId: null, userName: null, isolation: 'shared' };
  
  // Extract user ID (last numeric part of session key)
  const parts = (sessionKey || '').split(':');
  const userId = parts[parts.length - 1] || null;
  
  // Look up user name and isolation from rich config
  const config = CLIENT_CONFIG[clientId] || {};
  const userName = (config.users && userId) ? (config.users[userId] || null) : null;
  const isolation = config.isolation || 'shared';
  
  return { clientId, userId, userName, isolation };
}

/**
 * Get isolation mode for a client.
 * @param {string} clientId
 * @returns {"shared"|"user-first"|"strict"}
 */
function getIsolationMode(clientId) {
  if (!clientId || !CLIENT_CONFIG[clientId]) return 'shared';
  return CLIENT_CONFIG[clientId].isolation || 'shared';
}

/**
 * Get the memory directory for a client (and optionally a specific user).
 */
function getClientMemoryDir(clientId, workspace, userId) {
  if (!clientId) return path.join(workspace, 'memory');
  
  const clientDir = path.join(workspace, 'memory', 'clients', clientId);
  
  // If strict or user-first isolation with a userId, use per-user subdirectory
  const isolation = getIsolationMode(clientId);
  if (userId && (isolation === 'strict' || isolation === 'user-first')) {
    // Use user name if available, otherwise user ID
    const config = CLIENT_CONFIG[clientId] || {};
    const userName = (config.users && config.users[userId]) 
      ? config.users[userId].toLowerCase().replace(/\s+/g, '-') 
      : userId;
    const dir = path.join(clientDir, userName);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  
  if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });
  return clientDir;
}

/**
 * Check if the client map uses rich format.
 */
function isRichFormat() { return _isRichFormat; }

module.exports = { 
  getClientId, getUserContext, getIsolationMode, 
  getClientMemoryDir, isRichFormat, 
  CLIENT_MAP, CLIENT_CONFIG 
};
