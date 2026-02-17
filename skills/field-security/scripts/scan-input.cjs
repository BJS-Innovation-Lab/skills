#!/usr/bin/env node
/**
 * Field Security — Input Scanner
 * 
 * Scans inbound client messages for prompt injection, social engineering,
 * extraction attacks, and other threats. Designed for field agents serving
 * external clients.
 * 
 * Usage:
 *   node scan-input.cjs "message" [--user-id ID] [--json] [--sensitivity strict]
 *   echo "message" | node scan-input.cjs --stdin [--user-id ID]
 * 
 * Exit codes: 0 = allow, 1 = block, 2 = warn
 */

const fs = require('fs');
const path = require('path');

// ============== PATTERNS ==============
// Each pattern: { regex, category, subcategory, severity, description }

const PATTERNS = [
  // === PROMPT INJECTION ===
  // Instruction override
  { regex: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?|guidelines?)/i,
    category: 'prompt_injection', sub: 'instruction_override', severity: 'HIGH',
    desc: 'Attempt to override system instructions' },
  { regex: /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|rules?|programming)/i,
    category: 'prompt_injection', sub: 'instruction_override', severity: 'HIGH',
    desc: 'Attempt to disregard instructions' },
  { regex: /forget\s+(everything|all|your)\s+(you|instructions|rules|previous)/i,
    category: 'prompt_injection', sub: 'instruction_override', severity: 'HIGH',
    desc: 'Attempt to reset agent memory/instructions' },
  { regex: /new\s+instructions?\s*[:=]/i,
    category: 'prompt_injection', sub: 'instruction_override', severity: 'HIGH',
    desc: 'Attempt to inject new instructions' },
  { regex: /override\s+(safety|security|rules|restrictions|protocol)/i,
    category: 'prompt_injection', sub: 'instruction_override', severity: 'CRITICAL',
    desc: 'Direct safety override attempt' },
    
  // Role manipulation
  { regex: /you\s+are\s+now\s+(a|an|in)\s+(different|new|unrestricted|jailbroken|developer|admin|debug)/i,
    category: 'prompt_injection', sub: 'role_manipulation', severity: 'HIGH',
    desc: 'Attempt to reassign agent role' },
  { regex: /(pretend|act|behave|imagine)\s+(you'?re?|as\s+if)\s+(a\s+)?(different|unrestricted|evil|uncensored)/i,
    category: 'prompt_injection', sub: 'role_manipulation', severity: 'HIGH',
    desc: 'Roleplay-based jailbreak attempt' },
  { regex: /\b(DAN|do\s+anything\s+now|STAN|DUDE|AIM)\b/i,
    category: 'prompt_injection', sub: 'role_manipulation', severity: 'HIGH',
    desc: 'Known jailbreak persona' },
  { regex: /(developer|debug|admin|maintenance|service|test)\s+mode/i,
    category: 'prompt_injection', sub: 'role_manipulation', severity: 'HIGH',
    desc: 'Fake mode activation attempt' },
    
  // System impersonation
  { regex: /^\s*\[?\s*(system|SYSTEM)\s*[\]:]|\bSystem\s*:\s/,
    category: 'prompt_injection', sub: 'system_impersonation', severity: 'HIGH',
    desc: 'System message impersonation' },
  { regex: /\[OVERRIDE\]|\[ADMIN\]|\[ROOT\]|\[SUDO\]|\[URGENT\s*-\s*SYSTEM\]/i,
    category: 'prompt_injection', sub: 'system_impersonation', severity: 'CRITICAL',
    desc: 'Fake system tag injection' },
  { regex: /<<\s*(SYS|SYSTEM|INST|INSTRUCTIONS)\s*>>/i,
    category: 'prompt_injection', sub: 'system_impersonation', severity: 'HIGH',
    desc: 'Template tag injection' },
    
  // === EXTRACTION ATTACKS ===
  // Trying to extract system prompt, config, credentials
  { regex: /(show|display|print|reveal|tell|give)\s+(me\s+)?(your|the)\s+(system\s+prompt|instructions|rules|SOUL|soul\.md|agents\.md|config)/i,
    category: 'extraction', sub: 'system_prompt', severity: 'HIGH',
    desc: 'System prompt extraction attempt' },
  { regex: /(show|display|reveal|tell|give)\s+(me\s+)?(your|the)\s+(api\s*key|password|token|secret|credential|\.env|database|supabase)/i,
    category: 'extraction', sub: 'credentials', severity: 'CRITICAL',
    desc: 'Credential extraction attempt' },
  { regex: /repeat\s+(the\s+)?(text|prompt|instructions|message)\s+(above|before|at\s+the\s+(start|beginning|top))/i,
    category: 'extraction', sub: 'system_prompt', severity: 'HIGH',
    desc: 'Indirect prompt extraction via repeat' },
  { regex: /(what|who)\s+(are|is)\s+(the\s+)?(other\s+)?(clients?|customers?|companies|businesses)/i,
    category: 'extraction', sub: 'cross_client', severity: 'HIGH',
    desc: 'Cross-client information extraction' },
  { regex: /(how\s+many|list|name)\s+(your\s+)?(other\s+)?(clients?|customers?|users?)/i,
    category: 'extraction', sub: 'cross_client', severity: 'HIGH',
    desc: 'Client enumeration attempt' },
  { regex: /(other|different)\s+(clients?|customers?|companies|businesses)\s+(do\s+you|you)\s+(work|serve|help|have)/i,
    category: 'extraction', sub: 'cross_client', severity: 'HIGH',
    desc: 'Cross-client probing' },
  { regex: /do\s+you\s+(work|serve|help)\s+(with\s+)?(other|different|more)\s+(clients?|customers?|companies)/i,
    category: 'extraction', sub: 'cross_client', severity: 'HIGH',
    desc: 'Cross-client probing' },
  { regex: /(show|tell|what)\s+(me\s+)?(about\s+)?(your|the)\s+(team|agents?|other\s+ai|bots?|architecture|infrastructure)/i,
    category: 'extraction', sub: 'internal_info', severity: 'MEDIUM',
    desc: 'Internal architecture probing' },
    
  // === SOCIAL ENGINEERING ===
  { regex: /i\s*(am|'m)\s+(the\s+)?(owner|admin|boss|manager|ceo|cto|founder|johan|bridget)/i,
    category: 'social_engineering', sub: 'authority_claim', severity: 'HIGH',
    desc: 'Authority impersonation' },
  { regex: /(urgent|emergency|critical)\s*[!:]\s*(override|bypass|disable|ignore)/i,
    category: 'social_engineering', sub: 'urgency_pressure', severity: 'HIGH',
    desc: 'Urgency-based pressure to bypass rules' },
  { regex: /just\s+(this\s+)?(once|time)\s*(,?\s*(no\s+one|nobody)\s+will\s+(know|find\s+out|notice))?/i,
    category: 'social_engineering', sub: 'exception_request', severity: 'MEDIUM',
    desc: 'Exception request (social engineering)' },
  { regex: /(don'?t\s+tell|keep\s+(this\s+)?(a\s+)?secret|between\s+(us|you\s+and\s+me)|off\s+the\s+record)/i,
    category: 'social_engineering', sub: 'secrecy_request', severity: 'MEDIUM',
    desc: 'Secrecy request — potential data hiding' },
    
  // === COMMAND INJECTION ===
  { regex: /(?:^|\s)(cat|head|tail|less|more|grep|find)\s+.*\.(env|key|pem|json|yaml|conf|cfg|ini|secret)/i,
    category: 'command_injection', sub: 'credential_access', severity: 'CRITICAL',
    desc: 'Command to access credential files' },
  { regex: /(?:^|\s)(curl|wget|fetch|nc|netcat)\s+/i,
    category: 'command_injection', sub: 'exfiltration', severity: 'HIGH',
    desc: 'Potential data exfiltration command' },
  { regex: /(?:^|\s)rm\s+(-rf?\s+)?[\/~]/i,
    category: 'command_injection', sub: 'destructive', severity: 'CRITICAL',
    desc: 'Destructive command' },
  { regex: /(?:^|\s)(eval|exec|spawn|system)\s*\(/i,
    category: 'command_injection', sub: 'code_execution', severity: 'HIGH',
    desc: 'Code execution attempt' },
    
  // === ENCODING / OBFUSCATION ===
  { regex: /\\u[0-9a-f]{4}/i,
    category: 'obfuscation', sub: 'unicode_escape', severity: 'LOW',
    desc: 'Unicode escape sequences (possible obfuscation)' },
  { regex: /&#x?[0-9a-f]+;/i,
    category: 'obfuscation', sub: 'html_entities', severity: 'LOW',
    desc: 'HTML entity encoding (possible obfuscation)' },
  { regex: /[A-Za-z0-9+\/]{50,}={0,2}/,
    category: 'obfuscation', sub: 'base64', severity: 'LOW',
    desc: 'Possible base64 encoded payload' },
];

// ============== SEVERITY SCORING ==============
const SEVERITY_SCORES = { SAFE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const SCORE_TO_SEVERITY = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function scoreSeverity(findings) {
  if (findings.length === 0) return 'SAFE';
  
  let maxScore = 0;
  let totalScore = 0;
  
  for (const f of findings) {
    const s = SEVERITY_SCORES[f.severity] || 0;
    maxScore = Math.max(maxScore, s);
    totalScore += s;
  }
  
  // Multiple medium findings escalate to high
  if (totalScore >= 6 && maxScore < 3) maxScore = 3;
  // Multiple high findings escalate to critical
  if (totalScore >= 8 && maxScore < 4) maxScore = 4;
  
  return SCORE_TO_SEVERITY[Math.min(maxScore, 4)];
}

function severityToAction(severity, config) {
  const actions = config?.actions || {
    SAFE: 'allow', LOW: 'log', MEDIUM: 'warn', HIGH: 'block', CRITICAL: 'block_notify'
  };
  return actions[severity] || 'allow';
}

// ============== SCANNER ==============
function scanInput(text, opts = {}) {
  const findings = [];
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  for (const pattern of PATTERNS) {
    const match = normalizedText.match(pattern.regex) || text.match(pattern.regex);
    if (match) {
      findings.push({
        category: pattern.category,
        subcategory: pattern.sub,
        severity: pattern.severity,
        description: pattern.desc,
        matched: match[0].slice(0, 100)
      });
    }
  }
  
  const severity = scoreSeverity(findings);
  const action = severityToAction(severity, opts.config);
  
  return {
    severity,
    action,
    findings,
    timestamp: new Date().toISOString(),
    userId: opts.userId || null,
    inputLength: text.length
  };
}

// ============== LOGGING ==============
function logEvent(result, config) {
  if (result.severity === 'SAFE') return;
  
  const logFile = config?.log_file || 'memory/security/events.jsonl';
  const ws = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
  const fullPath = path.join(ws, logFile);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const entry = JSON.stringify({
    ...result,
    logged_at: new Date().toISOString()
  }) + '\n';
  
  fs.appendFileSync(fullPath, entry);
}

// ============== CONFIG ==============
function loadConfig() {
  const ws = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
  const configPath = path.join(ws, '.field-security.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

// ============== CLI ==============
function main() {
  const args = process.argv.slice(2);
  const opts = { json: false, userId: null, sensitivity: 'strict' };
  let inputText = null;
  let useStdin = false;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--user-id': opts.userId = args[++i]; break;
      case '--json': opts.json = true; break;
      case '--sensitivity': opts.sensitivity = args[++i]; break;
      case '--stdin': useStdin = true; break;
      default:
        if (!args[i].startsWith('--')) inputText = args[i];
    }
  }
  
  if (useStdin) {
    inputText = fs.readFileSync('/dev/stdin', 'utf-8');
  }
  
  if (!inputText) {
    console.error('Usage: node scan-input.cjs "message" [--user-id ID] [--json]');
    process.exit(1);
  }
  
  const config = loadConfig();
  const result = scanInput(inputText, { userId: opts.userId, config });
  
  // Log non-safe events
  logEvent(result, config);
  
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.severity === 'SAFE') {
      console.log('✅ SAFE — no threats detected');
    } else {
      const emoji = { LOW: '📝', MEDIUM: '⚠️', HIGH: '🛑', CRITICAL: '🚨' };
      console.log(`${emoji[result.severity] || '❓'} ${result.severity} — Action: ${result.action}`);
      console.log(`Findings: ${result.findings.length}`);
      for (const f of result.findings) {
        console.log(`  [${f.severity}] ${f.category}/${f.subcategory}: ${f.description}`);
        console.log(`         Matched: "${f.matched}"`);
      }
    }
  }
  
  // Exit codes: 0=allow, 1=block, 2=warn
  if (result.action === 'block' || result.action === 'block_notify') process.exit(1);
  if (result.action === 'warn') process.exit(2);
  process.exit(0);
}

// Export for use as module
module.exports = { scanInput, PATTERNS, scoreSeverity };

if (require.main === module) main();
