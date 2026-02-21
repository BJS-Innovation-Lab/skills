#!/usr/bin/env node
/**
 * smart-trigger.cjs — Classify incoming messages for memory retrieval needs
 * 
 * Zero LLM tokens. Pure pattern matching.
 * Returns: { level: 'none'|'local'|'shared', query: string|null, reason: string }
 * 
 * Usage:
 *   # CLI mode (for testing)
 *   node smart-trigger.cjs "what did Saber decide about the investing strategy?"
 *   
 *   # Module mode (for integration)
 *   const { classify } = require('./smart-trigger.cjs');
 *   const result = classify(message, { agentName: 'sybil', teamNames: [...] });
 * 
 * Integration:
 *   Add to HEARTBEAT.md or agent boot sequence. When result.level !== 'none',
 *   run the appropriate search before responding.
 */

// ============================================================
// TEAM CONFIGURATION — Update when team changes
// ============================================================
// Auto-detect agent name from IDENTITY.md
let _detectedAgent = 'unknown';
try {
  const _ws = process.env.WORKSPACE || require('path').join(process.env.HOME, '.openclaw', 'workspace');
  const _id = require('fs').readFileSync(require('path').join(_ws, 'IDENTITY.md'), 'utf-8');
  const _m = _id.match(/\*\*Name:\*\*\s*(.+)/i);
  if (_m) _detectedAgent = _m[1].trim().toLowerCase();
} catch {}

const DEFAULT_CONFIG = {
  agentName: _detectedAgent,
  
  // All agent names (triggers shared search when mentioned)
  teamNames: ['sybil', 'sybi', 'saber', 'sage', 'sam', 'santos'],
  
  // Human names (triggers local search — personal context)
  humanNames: ['bridget', 'johan'],
  
  // Project names (triggers local or shared depending on context)
  projectNames: [
    'vulkn', 'investing', 'truth hire', 'truthhire',
    'side b', 'side-b', 'storybookretro', 'storybook retro',
    'when agents remember', 'the paper', 'research paper',
    'hq dashboard', 'hq-front'
  ],
  
  // Client names
  clientNames: ['vulkn', 'storybookretro'],
};

// ============================================================
// PATTERN DEFINITIONS
// ============================================================

// Level 3: SHARED BRAIN — cross-agent knowledge needed
const SHARED_PATTERNS = [
  // Asking about other agents
  /what did (\w+) (decide|say|think|do|build|create|write|send|propose)/i,
  /what('s| is| does) (\w+) (working on|doing|building|thinking)/i,
  /has (\w+) (done|finished|started|sent|completed)/i,
  /ask (\w+) (about|for|to)/i,
  /(\w+)('s|s) (proposal|plan|idea|approach|decision|report)/i,
  
  // Cross-team knowledge
  /what do we know about/i,
  /does (anyone|the team|we) (know|have|remember)/i,
  /team (decision|consensus|agreement)/i,
  /who (is|was) (responsible|working on|handling)/i,
  
  // Shared project status
  /project status/i,
  /where are we (on|with)/i,
  /what('s| is) the (status|state|progress)/i,
  
  // Investment decisions (always check shared brain)
  /should we (buy|sell|short|long|trade|invest|hold)/i,
  /(buy|sell|short|long) (?:some |more )?(btc|eth|bitcoin|ethereum|stock|crypto)/i,
  /trading (signal|decision|recommendation)/i,
  /portfolio (update|status|review)/i,
];

// Level 2: LOCAL SEARCH — agent's own memory needed  
const LOCAL_PATTERNS = [
  // Past references
  /remember when/i,
  /last time (we|i|you)/i,
  /didn('t| not) we (already|just|recently)/i,
  /we (discussed|talked about|decided|agreed)/i,
  /you (said|told|mentioned|promised|committed)/i,
  /i (said|told|mentioned) (you|this|that)/i,
  /in the past (i|we|you)/i,
  /(before|previously|earlier) (i|we|you) (told|said|discussed|mentioned)/i,
  /what happened with/i,
  /what was (the|that)/i,
  /when did (we|i|you)/i,
  
  // Temporal references (yesterday, last week, etc.)
  /yesterday (we|i|you|bridget|johan|saber|sage|sam)/i,
  /(yesterday|this morning|earlier today|tonight|last night).{5,}/i,
  /last (week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /(a |two |three |few )?(days?|weeks?|hours?) ago/i,
  /the other day/i,
  /on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /wasn('t| not) that (from|on|last|the)/i,
  /back when (we|i|you)/i,
  /^before[,.]? (we|i|you|it|that|this)/i,
  
  // Decision making
  /should (we|i) /i,
  /what('s| is) (the|our) (plan|strategy|approach|next step)/i,
  /let('s| us) (decide|figure out|think about|plan)/i,
  /i think we should/i,
  /implementation (order|plan|priority)/i,
  /what are (the|our) (priorities|options)/i,
  
  // Procedures / how-to
  /how do (i|we|you)/i,
  /what('s| is) the process for/i,
  /can you (show|remind|tell) me how/i,
  /where (is|are|do i find)/i,
  
  // Commitments / pending
  /what('s| is) (pending|overdue|outstanding)/i,
  /did (i|we|you) (finish|complete|deliver|send)/i,
  /what do i owe/i,
  /any (open|pending) (commitments|tasks|items)/i,
  
  // Corrections / principles
  /bridget (said|told|asked|wants|mentioned)/i,
  /johan (said|told|asked|wants|mentioned)/i,
  /the rule (is|about|for)/i,
  /our (principle|policy|rule) (on|about|for)/i,
  
  // Founder corrections (ALWAYS search — critical for surfacing prior guidance)
  /actually.*(not|wrong|incorrect|different)/i,
  /that('s| is) not (right|correct|what)/i,
  /you('re| are) (missing|forgetting|wrong|off)/i,
  /no[,.]? (that|this|it)('s| is)/i,
  /not what (i|we) (said|meant|decided|agreed)/i,
  
  // Past actions / references
  /same (thing|way|approach) as (last|before|previously)/i,
  /(do|try) what (you|we) did (before|last|previously)/i,
  /like (last|that) time/i,
  /why did (we|i|you) (decide|choose|go with|pick)/i,
  /what was (our|the) (reason|logic|thinking)/i,
  
  // Speed / urgency decisions (critical after "time is never an issue" incident)
  /(ship|build|do) (it |this |that )?(fast|quick|quickly|asap|now)/i,
  /let('s| us) just (get|ship|do|build)/i,
  /hurry|rush|speed up|quickly/i,
  
  // Frustration / repetition (user upset = check what you missed)
  /this is wrong (again|still)/i,
  /(we|you) keep (making|doing|getting)/i,
  /i already (told|said|mentioned|explained|sent)/i,
  /(how many|how much) times (do i|have i|did i)/i,
  /again\?/i,
  /still (haven('t| not)|waiting|no )/i,
  
  // Promises / commitments
  /you (were|was) supposed to/i,
  /where('s| is) (that|the) .*(you promised|i asked for)/i,
  /did you (ever |actually )?(finish|complete|send|deliver|do)/i,
  /what happened to (the|that)/i,
  
  // Comparisons (need prior context)
  /(better|worse|different) than (what we had|before|last|the previous)/i,
  /how does this compare/i,
  /which (one|approach|version|method) (worked|is|was) better/i,
  
  // Vague references to past context
  /that thing (we|you|i) (talked|discussed|mentioned|worked)/i,
  /the thing from (before|earlier|yesterday|last)/i,
  /can you (pull|bring|look) (that|it) up/i,
  /you know what (i mean|i'm talking about)/i,
  /what (i|we|you) (were|was) (talking|working|looking) (about|on)/i,
  /what were we/i,
  
  // Status / tracking
  /are we on track/i,
  /what('s| is) (our|the) (budget|timeline|deadline)/i,
  /what('s| is) our (last|latest|current|recent) (trade|position|P&L|portfolio|PnL)/i,
  /(our|the|my) (last|latest|recent) (trade|position|order)/i,
  /how did .* (turn out|go|work|perform|end up)/i,
  /what('s| is) (our|the) P&?L/i,
  
  // Spanish temporal/recall patterns (Johan)
  /(ayer|anoche|la semana pasada|el mes pasado|antes|anteriormente)/i,
  /que (habiamos|habíamos|dijimos|decidimos|acordamos|hicimos)/i,
  /(te acuerdas|recuerdas|no te dije|ya te dije)/i,
  /(que paso|qué pasó) con/i,
  /(donde|dónde) (esta|está|quedo|quedó)/i,
  
  // Explicit recall
  /search (your |my )?(memory|files|notes|logs)/i,
  /check (your |my )?(memory|files|notes|logs)/i,
  /do you (remember|recall|know)/i,
  /is (it|that|this) in (your |my )?(memory|notes)/i,
];

// Level 0: NO SEARCH — routine messages
const SKIP_PATTERNS = [
  /^(ok|okay|sure|yes|no|thanks|thank you|got it|sounds good|perfect|great|nice|cool|👍|❤️|🙌|lol|haha)\.?$/i,
  /^HEARTBEAT/,
  /^NO_REPLY$/,
  /^(hi|hello|hey|morning|good morning|gm|gn|good night)\.?$/i,
];

// ============================================================
// CLASSIFIER
// ============================================================

function classify(message, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const msg = message.trim();
  
  // Skip patterns — definite no-search
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(msg)) {
      return { level: 'none', query: null, reason: 'routine message' };
    }
  }
  
  // Very short messages — check for temporal keywords before skipping
  const TEMPORAL_SHORT = /^(yesterday|last week|last month|before|earlier|previously|back then|the other day|last time)\.?$/i;
  if (msg.length < 15 && TEMPORAL_SHORT.test(msg)) {
    return { level: 'local', query: msg, reason: 'short temporal reference' };
  }
  
  // Very short messages are usually routine
  if (msg.length < 10 && !msg.includes('?')) {
    return { level: 'none', query: null, reason: 'short message, no question' };
  }
  
  // Check for other agent names → shared search
  const otherAgents = cfg.teamNames.filter(n => 
    n.toLowerCase() !== cfg.agentName.toLowerCase()
  );
  const mentionsOtherAgent = otherAgents.some(name => 
    new RegExp(`\\b${name}\\b`, 'i').test(msg)
  );
  
  // Check for client names → shared search  
  const mentionsClient = cfg.clientNames.some(name =>
    new RegExp(`\\b${name}\\b`, 'i').test(msg)
  );
  
  // Check shared patterns
  for (const pattern of SHARED_PATTERNS) {
    if (pattern.test(msg)) {
      // Extract a search query from the message
      const query = extractQuery(msg);
      return { 
        level: 'shared', 
        query, 
        reason: `matched shared pattern: ${pattern.source.slice(0, 40)}` 
      };
    }
  }
  
  // Other agent mentioned + question = shared
  if (mentionsOtherAgent && msg.includes('?')) {
    const query = extractQuery(msg);
    return { 
      level: 'shared', 
      query, 
      reason: `mentions team member + question` 
    };
  }
  
  // Client mentioned = shared (other agents may have context)
  if (mentionsClient) {
    const query = extractQuery(msg);
    return { 
      level: 'shared', 
      query, 
      reason: `mentions client: ${cfg.clientNames.find(n => new RegExp(`\\b${n}\\b`, 'i').test(msg))}` 
    };
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
  
  // Project names → local (escalate to shared if needed)
  const mentionsProject = cfg.projectNames.some(name =>
    new RegExp(`\\b${name}\\b`, 'i').test(msg)
  );
  if (mentionsProject && msg.includes('?')) {
    const query = extractQuery(msg);
    return { 
      level: 'local', 
      query, 
      reason: `mentions project + question` 
    };
  }

  // Human names with context
  const mentionsHuman = cfg.humanNames.some(name =>
    new RegExp(`\\b${name}\\b`, 'i').test(msg)
  );
  if (mentionsHuman && (msg.includes('said') || msg.includes('told') || msg.includes('wants') || msg.includes('?'))) {
    const query = extractQuery(msg);
    return {
      level: 'local',
      query,
      reason: `mentions founder with context`
    };
  }

  // Questions that aren't routine might benefit from local search
  if (msg.includes('?') && msg.length > 30) {
    const query = extractQuery(msg);
    return { 
      level: 'local', 
      query, 
      reason: 'non-trivial question' 
    };
  }
  
  // Default: no search needed
  return { level: 'none', query: null, reason: 'no trigger patterns matched' };
}

function extractQuery(message) {
  // Clean the message into a search query
  // Remove filler words, keep the substance
  return message
    .replace(/^(can you |could you |please |hey |so |ok so |also )/i, '')
    .replace(/\?+$/, '')
    .replace(/[^\w\s'-]/g, ' ')
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
    // Test suite
    const tests = [
      'ok sounds good',
      'what did Saber decide about the investing strategy?',
      'should we buy more ETH?',
      'remember when we discussed the memory architecture?',
      'how do I set up the cron job?',
      'can you check what Sage said about the backend?',
      'where are we on the Vulkn project?',
      'Bridget told us time is never an issue, right?',
      'lets build the smart trigger',
      'what is the process for deploying to Vercel?',
      'nice work on that!',
      'I think we should redesign the memory system',
      'portfolio status update please',
      'has Sam finished the risk monitoring?',
      'hi',
      'what do we know about the client?',
      'our principle on shipping fast?',
    ];
    
    console.log('Smart Trigger Classifier — Test Suite\n');
    console.log('Level    | Query (truncated)                    | Reason');
    console.log('---------|--------------------------------------|------------------');
    
    for (const test of tests) {
      const result = classify(test);
      const q = (result.query || '-').slice(0, 36).padEnd(36);
      const lvl = result.level.padEnd(8);
      console.log(`${lvl} | ${q} | ${result.reason.slice(0, 40)}`);
    }
  } else {
    // Single message classification
    const result = classify(args.join(' '));
    console.log(JSON.stringify(result, null, 2));
  }
}

// ============================================================
// MODULE EXPORT
// ============================================================
module.exports = { classify, DEFAULT_CONFIG };
