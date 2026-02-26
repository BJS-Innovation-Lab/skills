/**
 * PII Guard — Detection and redaction for collective memory
 * 
 * Defense in depth:
 * 1. Regex patterns for obvious PII
 * 2. Semantic detection via LLM
 * 3. Secret detection (API keys, passwords)
 * 
 * Usage:
 *   const { scanForPII, redactPII, isShareable } = require('./pii-guard');
 *   
 *   const result = await scanForPII(text);
 *   if (result.clean) {
 *     // Safe to share
 *   } else {
 *     const redacted = redactPII(text);
 *     // Share redacted version, or quarantine
 *   }
 */

// ============================================
// PATTERN DEFINITIONS
// ============================================

const PII_PATTERNS = {
  // Contact info
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone_us: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  phone_mx: /\b(?:\+?52[-.\s]?)?(?:\(?[0-9]{2,3}\)?[-.\s]?)?[0-9]{3,4}[-.\s]?[0-9]{4}\b/g,
  phone_intl: /\b\+[0-9]{1,3}[-.\s]?[0-9]{6,14}\b/g,
  
  // Identity
  ssn: /\b[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{4}\b/g,
  curp_mx: /\b[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]\b/gi,  // Mexican ID
  rfc_mx: /\b[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}\b/gi,  // Mexican tax ID
  passport: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
  
  // Financial
  credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  iban: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]?){0,16}\b/gi,
  
  // Addresses (loose patterns, may need refinement)
  zip_us: /\b[0-9]{5}(?:-[0-9]{4})?\b/g,
  zip_mx: /\b[0-9]{5}\b/g,  // Mexican postal code (same format)
  
  // Network/Auth
  ip_address: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  mac_address: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
};

const SECRET_PATTERNS = {
  // API Keys
  openai_key: /\bsk-[A-Za-z0-9]{32,}\b/g,
  anthropic_key: /\bsk-ant-[A-Za-z0-9_-]{32,}\b/g,
  github_token: /\bghp_[A-Za-z0-9]{36,}\b/g,
  github_oauth: /\bgho_[A-Za-z0-9]{36,}\b/g,
  stripe_key: /\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
  aws_key: /\bAKIA[0-9A-Z]{16}\b/g,
  aws_secret: /\b[A-Za-z0-9/+=]{40}\b/g,  // Loose, may have false positives
  google_api: /\bAIza[A-Za-z0-9_-]{35}\b/g,
  supabase_key: /\beyJ[A-Za-z0-9_-]{100,}\b/g,  // JWT format
  telegram_token: /\b[0-9]{8,10}:[A-Za-z0-9_-]{35}\b/g,
  
  // Generic secrets
  generic_key: /\b(?:api[_-]?key|apikey|secret[_-]?key|auth[_-]?token|access[_-]?token|bearer)[:\s=]["']?[A-Za-z0-9_-]{16,}["']?\b/gi,
  password_field: /\b(?:password|passwd|pwd)[:\s=]["']?[^\s"']{4,}["']?\b/gi,
  
  // Connection strings
  database_url: /\b(?:postgres|mysql|mongodb|redis):\/\/[^\s]+/gi,
};

const REDACTION_MAP = {
  email: '[EMAIL_REDACTED]',
  phone_us: '[PHONE_REDACTED]',
  phone_mx: '[PHONE_REDACTED]',
  phone_intl: '[PHONE_REDACTED]',
  ssn: '[SSN_REDACTED]',
  curp_mx: '[CURP_REDACTED]',
  rfc_mx: '[RFC_REDACTED]',
  passport: '[PASSPORT_REDACTED]',
  credit_card: '[CC_REDACTED]',
  iban: '[IBAN_REDACTED]',
  zip_us: '[ZIP]',
  zip_mx: '[ZIP]',
  ip_address: '[IP_REDACTED]',
  mac_address: '[MAC_REDACTED]',
  openai_key: '[API_KEY_REDACTED]',
  anthropic_key: '[API_KEY_REDACTED]',
  github_token: '[GITHUB_TOKEN_REDACTED]',
  github_oauth: '[GITHUB_TOKEN_REDACTED]',
  stripe_key: '[STRIPE_KEY_REDACTED]',
  aws_key: '[AWS_KEY_REDACTED]',
  aws_secret: '[AWS_SECRET_REDACTED]',
  google_api: '[GOOGLE_KEY_REDACTED]',
  supabase_key: '[SUPABASE_KEY_REDACTED]',
  telegram_token: '[TELEGRAM_TOKEN_REDACTED]',
  generic_key: '[SECRET_REDACTED]',
  password_field: '[PASSWORD_REDACTED]',
  database_url: '[DATABASE_URL_REDACTED]',
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Scan text for PII and secrets using regex patterns
 * @param {string} text - Text to scan
 * @returns {Object} Scan result with findings
 */
function scanPatterns(text) {
  const findings = {
    pii: [],
    secrets: [],
    matches: {}
  };
  
  // Check PII patterns
  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      findings.pii.push(name);
      findings.matches[name] = matches.length;
    }
  }
  
  // Check secret patterns
  for (const [name, pattern] of Object.entries(SECRET_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      findings.secrets.push(name);
      findings.matches[name] = matches.length;
    }
  }
  
  return {
    clean: findings.pii.length === 0 && findings.secrets.length === 0,
    pii_found: findings.pii,
    secrets_found: findings.secrets,
    match_counts: findings.matches,
    severity: findings.secrets.length > 0 ? 'critical' : 
              findings.pii.length > 0 ? 'high' : 'none'
  };
}

/**
 * Redact all detected PII and secrets from text
 * @param {string} text - Text to redact
 * @returns {Object} Redacted text and summary
 */
function redactPII(text) {
  let redacted = text;
  const redactions = [];
  
  // Redact secrets first (higher priority)
  for (const [name, pattern] of Object.entries(SECRET_PATTERNS)) {
    const matches = redacted.match(pattern);
    if (matches) {
      redacted = redacted.replace(pattern, REDACTION_MAP[name] || '[REDACTED]');
      redactions.push({ type: name, count: matches.length });
    }
  }
  
  // Then PII
  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = redacted.match(pattern);
    if (matches) {
      redacted = redacted.replace(pattern, REDACTION_MAP[name] || '[REDACTED]');
      redactions.push({ type: name, count: matches.length });
    }
  }
  
  return {
    original_length: text.length,
    redacted_text: redacted,
    redacted_length: redacted.length,
    redactions: redactions,
    was_modified: redactions.length > 0
  };
}

/**
 * Semantic PII detection using LLM
 * For catching context-based PII that regex misses
 * @param {string} text - Text to analyze
 * @param {Function} llmCall - Function to call LLM (passed in to avoid dependency)
 * @returns {Object} Semantic analysis result
 */
async function scanSemantic(text, llmCall) {
  if (!llmCall) {
    return { skipped: true, reason: 'no_llm_provided' };
  }
  
  const prompt = `Analyze this text for sensitive information that should NOT be shared in a collective memory system.

Look for:
1. Personal names tied to specific real individuals (not generic examples)
2. Specific business/company names that identify a customer
3. Physical addresses or specific locations
4. Financial details tied to individuals (amounts, account references)
5. Health or medical information
6. Legal case details
7. Any secrets, credentials, or authentication tokens
8. Private conversation content that wasn't meant to be shared

Text to analyze:
"""
${text.substring(0, 2000)}
"""

Respond with JSON only:
{
  "contains_sensitive": true/false,
  "findings": ["list of specific concerns"],
  "risk_level": "none|low|medium|high|critical",
  "recommendation": "share|redact|quarantine|block"
}`;

  try {
    const response = await llmCall(prompt);
    return JSON.parse(response);
  } catch (e) {
    return { 
      error: true, 
      message: e.message,
      recommendation: 'quarantine'  // When in doubt, don't share
    };
  }
}

/**
 * Full PII scan - patterns + semantic
 * @param {string} text - Text to scan
 * @param {Object} options - Options including llmCall function
 * @returns {Object} Complete scan result
 */
async function scanForPII(text, options = {}) {
  const { llmCall, skipSemantic = false } = options;
  
  // Layer 1: Pattern matching
  const patternResult = scanPatterns(text);
  
  // Layer 2: Semantic analysis (if provided)
  let semanticResult = { skipped: true };
  if (!skipSemantic && llmCall) {
    semanticResult = await scanSemantic(text, llmCall);
  }
  
  // Combine results
  const isClean = patternResult.clean && 
                  (!semanticResult.contains_sensitive || semanticResult.skipped);
  
  const severity = patternResult.severity !== 'none' ? patternResult.severity :
                   semanticResult.risk_level || 'none';
  
  return {
    clean: isClean,
    pattern_scan: patternResult,
    semantic_scan: semanticResult,
    overall_severity: severity,
    recommendation: isClean ? 'share' : 
                    severity === 'critical' ? 'block' :
                    severity === 'high' ? 'quarantine' : 'redact',
    scanned_at: new Date().toISOString()
  };
}

/**
 * Check if a memory should be shareable based on type and content
 * @param {Object} memory - Memory object with type and content
 * @returns {Object} Shareability assessment
 */
function assessShareability(memory) {
  const { type, content, stakes } = memory;
  
  // Types that should never be shared
  const NEVER_SHARE_TYPES = [
    'customer_interaction',
    'private_conversation', 
    'credential_used',
    'personal_note',
    'confidential'
  ];
  
  // Types that are generally safe to share
  const SAFE_TYPES = [
    'technique',
    'pattern',
    'learning',
    'insight',
    'warning',
    'best_practice'
  ];
  
  if (NEVER_SHARE_TYPES.includes(type)) {
    return {
      shareable: false,
      reason: 'type_restricted',
      type: type
    };
  }
  
  // Scan content
  const contentScan = scanPatterns(content);
  
  if (!contentScan.clean) {
    return {
      shareable: false,
      reason: 'pii_detected',
      findings: contentScan
    };
  }
  
  // Safe type + clean content = shareable
  if (SAFE_TYPES.includes(type)) {
    return {
      shareable: true,
      reason: 'safe_type_clean_content',
      type: type
    };
  }
  
  // Unknown type, clean content - allow but flag
  return {
    shareable: true,
    reason: 'unknown_type_clean_content',
    type: type,
    note: 'Consider adding type to explicit safe/unsafe list'
  };
}

// ============================================
// BATCH OPERATIONS (for Queen Bee audits)
// ============================================

/**
 * Audit a batch of collective memories
 * @param {Array} memories - Array of memory objects
 * @param {Object} options - Options including llmCall
 * @returns {Object} Audit results
 */
async function auditBatch(memories, options = {}) {
  const results = {
    total: memories.length,
    clean: 0,
    flagged: 0,
    quarantine: [],
    redact: [],
    scanned_at: new Date().toISOString()
  };
  
  for (const memory of memories) {
    const scan = await scanForPII(memory.content, options);
    
    if (scan.clean) {
      results.clean++;
    } else {
      results.flagged++;
      
      if (scan.recommendation === 'quarantine' || scan.recommendation === 'block') {
        results.quarantine.push({
          id: memory.id,
          severity: scan.overall_severity,
          findings: scan.pattern_scan
        });
      } else {
        results.redact.push({
          id: memory.id,
          severity: scan.overall_severity,
          findings: scan.pattern_scan
        });
      }
    }
  }
  
  return results;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Core functions
  scanPatterns,
  scanSemantic,
  scanForPII,
  redactPII,
  
  // Assessment
  assessShareability,
  
  // Batch operations
  auditBatch,
  
  // Patterns (for testing/extension)
  PII_PATTERNS,
  SECRET_PATTERNS,
  REDACTION_MAP
};
