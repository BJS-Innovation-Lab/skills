#!/usr/bin/env node
/**
 * Field Security — Consent & Access Grant Logger
 * 
 * Detects when clients share access grants (GitHub repos, email credentials,
 * API keys, platform invites) and auto-logs them to a client-scoped access log.
 * 
 * Usage:
 *   node scan-consent.cjs "message" --client clientname [--user-id ID] [--user-name NAME] [--json]
 *   echo "message" | node scan-consent.cjs --stdin --client clientname
 * 
 * Output: JSON with detected grants. Writes to clients/{name}/access-log.md
 */

const fs = require('fs');
const path = require('path');

// ============== ACCESS GRANT PATTERNS ==============

const GRANT_PATTERNS = [
  // GitHub / Git access
  { regex: /github\.com\/[\w-]+\/[\w-]+\/invitations?/i,
    category: 'repo_access', platform: 'github',
    desc: 'GitHub repository invitation link' },
  { regex: /(te\s+d[ioí]\s+acceso|gave\s+you\s+access|added\s+you|te\s+agrego|te\s+agregué)\s*(a|to|al|push|write|admin)?/i,
    category: 'repo_access', platform: 'generic',
    desc: 'Explicit access grant statement' },
  { regex: /(collaborator|contributor|admin|write\s+access|push\s+access)/i,
    category: 'repo_access', platform: 'github',
    desc: 'Repository permission grant' },

  // Email / credentials sharing
  { regex: /mi\s+(correo|email|mail)\s+(es|is)\s+\S+@\S+/i,
    category: 'contact_info', platform: 'email',
    desc: 'Client sharing their email address' },
  { regex: /\S+@\S+\.\S+/i,
    category: 'contact_info', platform: 'email',
    desc: 'Email address detected' },
  { regex: /(su\s+celular|phone|tel[eé]fono|whatsapp)\s*(es|is|registrado)?\s*:?\s*[\+\d\s\-\(\)]{8,}/i,
    category: 'contact_info', platform: 'phone',
    desc: 'Phone number shared' },

  // Platform access
  { regex: /(vercel|netlify|railway|supabase|heroku)\s*(project|deploy|dashboard)/i,
    category: 'platform_access', platform: 'hosting',
    desc: 'Hosting platform access mentioned' },
  { regex: /conectar\s+mi\s+(correo|outlook|gmail|email)|connect\s+my\s+(email|outlook|gmail)/i,
    category: 'platform_access', platform: 'email_integration',
    desc: 'Client requesting email integration' },

  // Credential sharing (needs quarantine warning)
  { regex: /(password|contraseña|api.?key|token|secret)\s*(es|is|=|:)\s*\S+/i,
    category: 'credential', platform: 'unknown',
    desc: 'Possible credential shared in message — QUARANTINE' },

  // Team data sharing
  { regex: /(su\s+(celular|correo|mail|email)|their\s+(phone|email|cell))\s*(es|is|registrado)?\s*/i,
    category: 'team_data', platform: 'contact',
    desc: 'Client sharing team member contact info' },

  // Document / file sharing
  { regex: /(te\s+(mand[eéo]|env[ií][eéo])\s+(los?\s+)?(pdf|archivo|document|file)s?|sent\s+you\s+(the\s+)?(pdf|file|document)s?)/i,
    category: 'document_share', platform: 'file',
    desc: 'Client sharing documents/files' },
  { regex: /guarda.*en\s+tu\s+memoria|save.*in\s+your\s+memory|remember\s+(all\s+)?(the|these)/i,
    category: 'data_retention_request', platform: 'memory',
    desc: 'Client explicitly requesting data retention' },
];

// ============== CONTACT EXTRACTION ==============

function extractContacts(text) {
  const contacts = [];
  
  // Email addresses
  const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g);
  if (emails) emails.forEach(e => contacts.push({ type: 'email', value: e }));
  
  // Phone numbers (Mexican format + international)
  const phones = text.match(/\+?\d[\d\s\-\(\)]{7,}/g);
  if (phones) phones.forEach(p => contacts.push({ type: 'phone', value: p.trim() }));
  
  // Names associated with contact info
  const namePatterns = [
    /(?:(?:es|is)\s+)?(\w+\s+\w+)\s+su\s+(?:celular|correo|mail)/gi,
    /(\w+\s+\w+)\s+(?:their|his|her)\s+(?:phone|email|cell)/gi,
    /(?:El?\s+)?(\d+)\s+es\s+(\w+\s+\w+)/gi,
  ];
  
  return contacts;
}

// ============== MAIN SCANNER ==============

function scanForGrants(text, opts = {}) {
  const results = [];
  
  for (const pattern of GRANT_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      results.push({
        category: pattern.category,
        platform: pattern.platform,
        description: pattern.desc,
        matched: match[0],
        isCredential: pattern.category === 'credential',
      });
    }
  }
  
  const contacts = extractContacts(text);
  
  return {
    hasGrants: results.length > 0,
    grants: results,
    contacts,
    hasCredential: results.some(r => r.isCredential),
    timestamp: new Date().toISOString(),
    userId: opts.userId || 'unknown',
    userName: opts.userName || 'unknown',
    client: opts.client || 'unknown',
  };
}

// ============== ACCESS LOG WRITER ==============

function writeAccessLog(scan, workspace) {
  if (!scan.hasGrants && scan.contacts.length === 0) return null;
  
  const clientDir = path.join(workspace, 'clients', scan.client);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  const logPath = path.join(clientDir, 'access-log.md');
  const isNew = !fs.existsSync(logPath);
  
  let entry = '';
  if (isNew) {
    entry += `# Access Log — ${scan.client}\n\nAutomated log of access grants, data sharing, and consent events.\nGenerated by field-security/scan-consent.cjs\n\n---\n\n`;
  }
  
  entry += `## ${scan.timestamp}\n`;
  entry += `**From:** ${scan.userName} (${scan.userId})\n\n`;
  
  if (scan.grants.length > 0) {
    entry += `### Grants Detected\n`;
    for (const g of scan.grants) {
      const flag = g.isCredential ? ' ⚠️ CREDENTIAL' : '';
      entry += `- **${g.category}** (${g.platform})${flag}: ${g.description}\n`;
      entry += `  - Matched: \`${g.matched}\`\n`;
    }
    entry += '\n';
  }
  
  if (scan.contacts.length > 0) {
    entry += `### Contact Info Shared\n`;
    for (const c of scan.contacts) {
      entry += `- ${c.type}: \`${c.value}\`\n`;
    }
    entry += '\n';
  }
  
  if (scan.hasCredential) {
    entry += `> ⚠️ **CREDENTIAL DETECTED** — Agent should warn client not to share credentials in chat. Escalate to Johan for secure storage.\n\n`;
  }
  
  entry += `---\n\n`;
  
  fs.appendFileSync(logPath, entry);
  return logPath;
}

// ============== CLIENT-SCOPED STORAGE ==============

function writeClientContact(scan, workspace) {
  if (scan.contacts.length === 0) return null;
  
  const clientDir = path.join(workspace, 'clients', scan.client);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  const contactPath = path.join(clientDir, 'team-contacts.md');
  const isNew = !fs.existsSync(contactPath);
  
  if (isNew) {
    const header = `# Team Contacts — ${scan.client}\n\nClient-provided contact information. Auto-detected by field-security.\nThis file is client-scoped — never surface in cross-client contexts.\n\n---\n\n`;
    fs.writeFileSync(contactPath, header);
  }
  
  // Read existing to avoid duplicates
  const existing = fs.readFileSync(contactPath, 'utf8');
  const newContacts = scan.contacts.filter(c => !existing.includes(c.value));
  
  if (newContacts.length > 0) {
    let addition = `### Added ${scan.timestamp}\n`;
    addition += `Source: ${scan.userName}\n`;
    for (const c of newContacts) {
      addition += `- ${c.type}: \`${c.value}\`\n`;
    }
    addition += '\n';
    fs.appendFileSync(contactPath, addition);
  }
  
  return newContacts.length > 0 ? contactPath : null;
}

// ============== CLI ==============

function main() {
  const args = process.argv.slice(2);
  const useStdin = args.includes('--stdin');
  const jsonOut = args.includes('--json');
  const clientIdx = args.indexOf('--client');
  const userIdIdx = args.indexOf('--user-id');
  const userNameIdx = args.indexOf('--user-name');
  const noWrite = args.includes('--dry-run');
  
  const client = clientIdx >= 0 ? args[clientIdx + 1] : null;
  const userId = userIdIdx >= 0 ? args[userIdIdx + 1] : 'unknown';
  const userName = userNameIdx >= 0 ? args[userNameIdx + 1] : 'unknown';
  
  if (!client) {
    console.error('Error: --client is required');
    process.exit(1);
  }
  
  const getText = () => {
    if (useStdin) return fs.readFileSync(0, 'utf8').trim();
    const textArgs = args.filter(a => !a.startsWith('--') && 
      a !== client && a !== userId && a !== userName);
    return textArgs.join(' ');
  };
  
  const text = getText();
  if (!text) {
    console.error('Error: no text provided');
    process.exit(1);
  }
  
  const scan = scanForGrants(text, { userId, userName, client });
  
  const workspace = process.env.WORKSPACE || 
    path.resolve(__dirname, '..', '..', '..');
  
  let logPath = null;
  let contactPath = null;
  
  if (!noWrite && scan.hasGrants) {
    logPath = writeAccessLog(scan, workspace);
  }
  if (!noWrite && scan.contacts.length > 0) {
    contactPath = writeClientContact(scan, workspace);
  }
  
  const output = {
    ...scan,
    logPath,
    contactPath,
  };
  
  if (jsonOut) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    if (!scan.hasGrants && scan.contacts.length === 0) {
      console.log('No access grants or contact info detected.');
    } else {
      console.log(`Detected ${scan.grants.length} grant(s), ${scan.contacts.length} contact(s)`);
      if (logPath) console.log(`Access log: ${logPath}`);
      if (contactPath) console.log(`Contacts: ${contactPath}`);
      if (scan.hasCredential) {
        console.log('⚠️  CREDENTIAL DETECTED — warn client, escalate to Johan');
      }
    }
  }
  
  // Exit 1 if credential detected (needs intervention)
  process.exit(scan.hasCredential ? 1 : 0);
}

main();
