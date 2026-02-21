#!/usr/bin/env node
/**
 * smart-trigger-field.cjs — Message classifier for field agents
 * 
 * Zero LLM tokens. Pure pattern matching.
 * Returns: { level: 'none'|'local'|'hq', query: string|null, reason: string }
 * 
 * Key difference from smart-trigger.cjs (internal agents):
 *   - No 'shared' level (field agents have no cross-agent brain)
 *   - Has 'hq' level instead → queries BJS Knowledge Base (read-only)
 *   - No internal team references (Sybil, Sage, investing, research paper, etc.)
 *   - Client-scoped: config includes client name, owner name, business type
 * 
 * Usage:
 *   # CLI mode
 *   node smart-trigger-field.cjs "how do I handle a refund request?"
 *   node smart-trigger-field.cjs   # runs test suite
 *   
 *   # Module mode
 *   const { classify } = require('./smart-trigger-field.cjs');
 *   const result = classify(message, { 
 *     agentName: 'santos', 
 *     clientName: 'La Taqueria',
 *     ownerName: 'Maria'
 *   });
 * 
 * Integration:
 *   When result.level === 'hq', run:
 *     node bjs-knowledge-search.cjs "<result.query>" --compact
 *   and inject the output as context before responding.
 */

// ============================================================
// FIELD AGENT CONFIGURATION — Set per client deployment
// ============================================================
const DEFAULT_CONFIG = {
  agentName: 'santos',
  
  // Client info (set during onboarding)
  clientName: '',          // e.g., 'La Taqueria'
  ownerName: '',           // e.g., 'Maria'
  ownerNames: [],          // e.g., ['Maria', 'Carlos'] — all client contacts
  businessType: '',        // e.g., 'restaurant', 'retail', 'salon'
  
  // Client project names (things the agent works on for this client)
  projectNames: [],        // e.g., ['social media', 'email campaign', 'website']
};

// ============================================================
// PATTERN DEFINITIONS
// ============================================================

// Level HQ: Query BJS Knowledge Base — agent needs operational knowledge from HQ
const HQ_PATTERNS = [
  // Procedural questions — "how do I do X?"
  /how (do|should|would|can|could) (i|we) /i,
  /what('s| is) the (process|procedure|protocol|steps?|way) (for|to)/i,
  /is there a (template|guide|checklist|procedure|process) for/i,
  /standard (procedure|process|protocol|practice) for/i,
  /what('s| is) (the|our) (policy|rule|guideline) (on|about|for|regarding)/i,
  /step.by.step/i,
  
  // Error / failure — something broke
  /error|failed|broken|not working|can('t| not) (connect|send|access|load|find)/i,
  /something (went|is) wrong/i,
  /doesn('t| not) (work|load|connect|respond|send)/i,
  /can('t|not) figure (out|it)/i,
  /why (is|does|did) (this|it) (not|fail|error|break|crash)/i,
  /keeps (failing|crashing|erroring|breaking|timing out)/i,
  /what do i do (when|if|about)/i,
  
  // Scope / authority — "can I / should I?"
  /can i (do|offer|promise|give|authorize|approve|change|modify)/i,
  /am i (allowed|supposed|able|authorized) to/i,
  /should i (be doing|handle|take care of|deal with)/i,
  /(outside|beyond|within) my (scope|authority|role|responsibility)/i,
  /is (this|that) something (i|we) (handle|do|can|should)/i,
  /do i have (permission|authority|access) to/i,
  
  // Escalation decisions — "should I escalate?"
  /should i (escalate|contact|tell|notify|alert|involve|reach out)/i,
  /is this (urgent|important|serious|critical) enough/i,
  /do i need to (tell|contact|escalate|notify|involve)/i,
  /when (should|do) i (escalate|contact|reach out|involve)/i,
  /how do i (escalate|report|flag) (this|a|an)/i,
  
  // Tool / skill usage — "how does X work?"
  /how does .* (work|function|operate)/i,
  /never used (this|that|the) before/i,
  /what (skill|tool) (do i|should i|can i) use/i,
  /where (do i find|is) (the|a) (tool|skill|script|command)/i,
  /how (to|do i) (use|run|set up|configure|install)/i,
  
  // Best practices — "what's the best way to...?"
  /what('s| is) the best (way|approach|practice|method) (to|for)/i,
  /any (tips|advice|suggestions|recommendations) (for|on|about)/i,
  /best practice(s)? (for|when|about)/i,
  /what (works|worked) (best|well) (for|when|with)/i,
  
  // Template / script requests
  /do (we|i) have a (template|script|format|example) for/i,
  /what (should|do) i (say|tell|respond|write) (when|if|to)/i,
  /how (should|do) i (respond|reply|handle|approach) (when|if|to|a)/i,
  /what('s| is) (the|a) good (response|reply|way to say)/i,
  
  // Unknown situation
  /i('m| am) not sure (how|what|whether|if)/i,
  /i don('t| do not) know (how|what|whether|if)/i,
  /what (do i do|should i do|happens) (if|when|now)/i,
  /first time (i('m| am)|dealing with|seeing|encountering)/i,
  /never (seen|encountered|dealt with|had) (this|a|an)/i,
];

// Level LOCAL: Search agent's own memory — client-specific context needed
const LOCAL_PATTERNS = [
  // Past client interactions
  /remember when/i,
  /last time (we|i|you|the client|the owner)/i,
  /didn('t| not) we (already|just|recently)/i,
  /we (discussed|talked about|decided|agreed)/i,
  /you (said|told|mentioned|promised|committed)/i,
  /i (said|told|mentioned) (you|this|that)/i,
  /in the past (i|we|you)/i,
  /(before|previously|earlier) (i|we|you)/i,
  /what happened with/i,
  /what was (the|that)/i,
  /when did (we|i|you)/i,
  
  // Temporal references
  /(yesterday|this morning|earlier today|tonight|last night).{5,}/i,
  /last (week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /(a |two |three |few )?(days?|weeks?|hours?) ago/i,
  /the other day/i,
  /back when (we|i|you)/i,
  
  // Client preferences / history
  /what does .* (prefer|like|want|need|usually|always)/i,
  /how does .* (usually|typically|normally|always)/i,
  /(the|their|our) (usual|normal|regular|typical) (order|schedule|routine|process)/i,
  /what('s| is) (their|the client('s|s)) (preference|schedule|routine)/i,
  
  // Decision making for client
  /should (we|i) /i,
  /what('s| is) (the|our) (plan|strategy|approach|next step)/i,
  /i think we should/i,
  /what are (the|our) (priorities|options)/i,
  
  // Commitments / follow-ups
  /what('s| is) (pending|overdue|outstanding)/i,
  /did (i|we|you) (finish|complete|deliver|send)/i,
  /any (open|pending) (commitments|tasks|items|follow.?ups)/i,
  /what do i (need to|owe|still have to)/i,
  /you (were|was) supposed to/i,
  /did you (ever |actually )?(finish|complete|send|deliver|do)/i,
  
  // Client corrections
  /that('s| is) not (right|correct|how|what)/i,
  /actually.*(not|wrong|incorrect|different)/i,
  /no[,.]? (that|this|it)('s| is)/i,
  
  // Frustration / repetition
  /i already (told|said|mentioned|explained|sent)/i,
  /(how many|how much) times (do i|have i|did i)/i,
  /still (haven('t| not)|waiting|no )/i,
  
  // Comparisons
  /(better|worse|different) than (what we had|before|last|the previous)/i,
  /how does this compare/i,
  
  // Vague past references
  /that thing (we|you|i) (talked|discussed|mentioned|worked)/i,
  /the thing from (before|earlier|yesterday|last)/i,
  /what (i|we|you) (were|was) (talking|working|looking) (about|on)/i,
  
  // Status
  /are we on track/i,
  /how did .* (turn out|go|work|perform|end up)/i,
  
  // Spanish recall patterns
  /(ayer|anoche|la semana pasada|el mes pasado|antes|anteriormente)/i,
  /que (habiamos|habíamos|dijimos|decidimos|acordamos|hicimos)/i,
  /(te acuerdas|recuerdas|no te dije|ya te dije)/i,
  /(que paso|qué pasó) con/i,
  /(donde|dónde) (esta|está|quedo|quedó)/i,
  /(como|cómo) (hago|hice|hacemos|se hace)/i,
  
  // Explicit recall
  /search (your |my )?(memory|files|notes|logs)/i,
  /check (your |my )?(memory|files|notes|logs)/i,
  /do you (remember|recall|know)/i,
];

// Level NONE: Skip — routine messages
const SKIP_PATTERNS = [
  /^(ok|okay|sure|yes|no|thanks|thank you|got it|sounds good|perfect|great|nice|cool|👍|❤️|🙌|lol|haha|jaja|vale|si|sí|claro|bueno|órale)\.?$/i,
  /^HEARTBEAT/,
  /^NO_REPLY$/,
  /^(hi|hello|hey|hola|buenos días|buenas tardes|buenas noches|morning|good morning|gm|gn|good night)\.?$/i,
];

// ============================================================
// CLASSIFIER
// ============================================================

function classify(message, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const msg = message.trim();
  
  // Skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(msg)) {
      return { level: 'none', query: null, reason: 'routine message' };
    }
  }
  
  // Very short messages — check for temporal keywords
  const TEMPORAL_SHORT = /^(yesterday|last week|last month|before|earlier|previously|ayer|la semana pasada)\.?$/i;
  if (msg.length < 20 && TEMPORAL_SHORT.test(msg)) {
    return { level: 'local', query: msg, reason: 'short temporal reference' };
  }
  
  // Very short messages usually routine
  if (msg.length < 10 && !msg.includes('?')) {
    return { level: 'none', query: null, reason: 'short message, no question' };
  }
  
  // Check HQ patterns first (procedural needs take priority)
  for (const pattern of HQ_PATTERNS) {
    if (pattern.test(msg)) {
      const query = extractQuery(msg);
      return { 
        level: 'hq', 
        query, 
        reason: `matched hq pattern: ${pattern.source.slice(0, 40)}` 
      };
    }
  }
  
  // Check local patterns
  for (const pattern of LOCAL_PATTERNS) {
    if (pattern.test(msg)) {
      const query = extractQuery(msg);
      return { 
        level: 'local', 
        query, 
        reason: `matched local pattern: ${pattern.source.slice(0, 40)}` 
      };
    }
  }
  
  // Owner name with context → local
  const ownerNames = [cfg.ownerName, ...(cfg.ownerNames || [])].filter(Boolean);
  const mentionsOwner = ownerNames.some(name =>
    name && new RegExp(`\\b${name}\\b`, 'i').test(msg)
  );
  if (mentionsOwner && (msg.includes('said') || msg.includes('told') || msg.includes('wants') || msg.includes('dijo') || msg.includes('quiere') || msg.includes('?'))) {
    const query = extractQuery(msg);
    return { level: 'local', query, reason: 'mentions client owner with context' };
  }
  
  // Client name or project with question → local
  const clientTerms = [cfg.clientName, cfg.businessType, ...cfg.projectNames].filter(Boolean);
  const mentionsClientTerm = clientTerms.some(term =>
    term && new RegExp(`\\b${term}\\b`, 'i').test(msg)
  );
  if (mentionsClientTerm && msg.includes('?')) {
    const query = extractQuery(msg);
    return { level: 'local', query, reason: 'mentions client/project + question' };
  }
  
  // Non-trivial questions might benefit from local search
  if (msg.includes('?') && msg.length > 30) {
    const query = extractQuery(msg);
    return { level: 'local', query, reason: 'non-trivial question' };
  }
  
  // Default: no search
  return { level: 'none', query: null, reason: 'no trigger patterns matched' };
}

function extractQuery(message) {
  return message
    .replace(/^(can you |could you |please |hey |so |ok so |also |oye |por favor )/i, '')
    .replace(/\?+$/, '')
    .replace(/[^\w\sáéíóúñü'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

// ============================================================
// CLI MODE
// ============================================================
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    const tests = [
      // HQ level (should query BJS Knowledge Base)
      'how do I handle a customer who wants a refund?',
      'is there a template for responding to complaints?',
      'should I escalate this to someone?',
      'something went wrong with the email tool',
      'can I authorize a 20% discount?',
      'what\'s the best way to onboard a new client?',
      'how does the creativity engine work?',
      'I\'m not sure how to handle this situation',
      'first time dealing with a billing dispute',
      'cómo hago para configurar el cron?',
      
      // Local level (should search own memory)
      'what did the client say about the logo last week?',
      'remember when we discussed the social media schedule?',
      'what\'s pending for this week?',
      'María told me she wants to change the hours',
      'yesterday we agreed to post on Tuesdays',
      'qué pasó con el pedido de María?',
      
      // None (routine)
      'ok sounds good',
      'hola',
      'gracias!',
      'HEARTBEAT_OK',
      'yes',
      
      // Edge cases
      'the customer is really upset and I don\'t know what to do',
      'never seen this error before — API timeout on send',
      'should I promise same-day delivery?',
      'how many times do I have to explain this?',
    ];
    
    console.log('Smart Trigger (Field Agent) — Test Suite\n');
    console.log('Level    | Query (truncated)                    | Reason');
    console.log('---------|--------------------------------------|------------------');
    
    for (const test of tests) {
      const result = classify(test);
      const q = (result.query || '-').slice(0, 36).padEnd(36);
      const lvl = result.level.padEnd(8);
      console.log(`${lvl} | ${q} | ${result.reason.slice(0, 40)}`);
    }
  } else {
    const result = classify(args.join(' '));
    console.log(JSON.stringify(result, null, 2));
  }
}

// ============================================================
// MODULE EXPORT
// ============================================================
module.exports = { classify, DEFAULT_CONFIG };
