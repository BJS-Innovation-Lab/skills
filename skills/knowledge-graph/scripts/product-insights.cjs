#!/usr/bin/env node
/**
 * Product Insights Extractor
 * 
 * Scans Sam's conversation transcripts for pain points, friction,
 * feature requests, bugs, and improvement opportunities.
 * 
 * Usage:
 *   node product-insights.cjs --hours 24 [--verbose]
 *   node product-insights.cjs --days 7 --full-report
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- Config ---
const envPath = path.join(__dirname, '../../..', 'rag/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const hasFlag = (name) => args.includes(`--${name}`);
const HOURS = parseInt(getArg('hours') || '0');
const DAYS = parseInt(getArg('days') || (HOURS ? '0' : '1'));
const VERBOSE = hasFlag('verbose');
const FULL_REPORT = hasFlag('full-report');
const OUTPUT_DIR = path.join(__dirname, '../../../memory/product-insights');

// --- Fetch conversations ---
async function fetchConversations(hoursBack) {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);
  const since = new Date(Date.now() - hoursBack * 3600000).toISOString();
  
  const { data, error } = await db.from('conversations')
    .select('direction, message, timestamp, user_name, session_id')
    .ilike('agent_name', '%sam%')
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return data || [];
}

// --- Group by session/conversation thread ---
function groupConversations(messages) {
  // Group into conversation chunks by session or time gaps (>30 min)
  const threads = [];
  let current = [];
  let lastTime = 0;
  
  for (const m of messages) {
    const t = new Date(m.timestamp).getTime();
    if (t - lastTime > 30 * 60 * 1000 && current.length > 0) {
      threads.push(current);
      current = [];
    }
    current.push(m);
    lastTime = t;
  }
  if (current.length > 0) threads.push(current);
  return threads;
}

// --- Analyze with Gemini Flash ---
async function analyzeThread(messages) {
  const transcript = messages.map(m => {
    const who = m.direction === 'out' ? 'SAM (AI agent)' : extractUser(m.message);
    const text = cleanMessage(m.message);
    return `[${m.timestamp}] ${who}: ${text}`;
  }).join('\n');

  const prompt = `You are a product analyst for VULKN, a company that sells AI agents as a service to SMBs in Mexico.

Analyze this conversation between our AI agent "Sam" and a client. Extract:

1. **PAIN POINTS**: What frustrated the user? What didn't work? What took too long?
2. **BUGS**: Actual software bugs or errors mentioned
3. **FEATURE REQUESTS**: Things the user asked for that don't exist
4. **FRICTION**: Places where the interaction was awkward or confusing
5. **WINS**: What worked well? What made the user happy?
6. **PRODUCT IDEAS**: Based on the conversation, what could we build to make this better?
7. **SENTIMENT**: Overall user satisfaction (1-10) with reasoning

Be specific. Quote exact messages when relevant. Focus on actionable insights.
If the conversation is just admin/setup by founders (Bridget, Johan), skip it and return {"skip": true, "reason": "admin conversation"}.

CONVERSATION:
${transcript}

Return JSON:
{
  "skip": false,
  "user": "name",
  "client": "company if known",
  "pain_points": [{"description": "...", "severity": "high|medium|low", "quote": "..."}],
  "bugs": [{"description": "...", "quote": "..."}],
  "feature_requests": [{"description": "...", "quote": "..."}],
  "friction": [{"description": "...", "suggestion": "..."}],
  "wins": [{"description": "...", "quote": "..."}],
  "product_ideas": [{"idea": "...", "reasoning": "..."}],
  "sentiment": {"score": 7, "reasoning": "..."},
  "summary": "One paragraph summary of the key insight from this conversation"
}

Return ONLY valid JSON.`;

  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY required');
  
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    }),
  });
  
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

function extractUser(message) {
  const m = message?.match(/\[Telegram\s+([^\]]+?)\s+id:/);
  return m ? m[1] : 'USER';
}

function cleanMessage(message) {
  // Strip Telegram metadata prefix
  return (message || '').replace(/^\[Telegram[^\]]*\]\s*/, '').replace(/^\[message_id:[^\]]*\]\s*/gm, '').trim();
}

// --- Aggregate insights ---
function aggregateInsights(analyses) {
  const all = {
    pain_points: [],
    bugs: [],
    feature_requests: [],
    friction: [],
    wins: [],
    product_ideas: [],
    sentiments: [],
  };

  for (const a of analyses) {
    if (a.skip) continue;
    const tag = `[${a.user || 'unknown'} / ${a.client || 'unknown'}]`;
    for (const p of a.pain_points || []) all.pain_points.push({ ...p, source: tag });
    for (const b of a.bugs || []) all.bugs.push({ ...b, source: tag });
    for (const f of a.feature_requests || []) all.feature_requests.push({ ...f, source: tag });
    for (const f of a.friction || []) all.friction.push({ ...f, source: tag });
    for (const w of a.wins || []) all.wins.push({ ...w, source: tag });
    for (const i of a.product_ideas || []) all.product_ideas.push({ ...i, source: tag });
    if (a.sentiment) all.sentiments.push({ ...a.sentiment, source: tag });
  }

  return all;
}

// --- Generate report ---
function generateReport(insights, analyses, period) {
  const now = new Date().toISOString().slice(0, 10);
  const avgSentiment = insights.sentiments.length > 0
    ? (insights.sentiments.reduce((s, x) => s + x.score, 0) / insights.sentiments.length).toFixed(1)
    : 'N/A';

  let md = `# Product Insights Report — ${now}\n`;
  md += `**Period:** ${period}\n`;
  md += `**Conversations analyzed:** ${analyses.length} (${analyses.filter(a => !a.skip).length} client, ${analyses.filter(a => a.skip).length} admin/skipped)\n`;
  md += `**Average sentiment:** ${avgSentiment}/10\n\n`;

  if (insights.bugs.length > 0) {
    md += `## 🐛 Bugs (${insights.bugs.length})\n`;
    for (const b of insights.bugs) {
      md += `- **${b.description}** ${b.source}\n`;
      if (b.quote) md += `  > "${b.quote}"\n`;
    }
    md += '\n';
  }

  if (insights.pain_points.length > 0) {
    md += `## 😤 Pain Points (${insights.pain_points.length})\n`;
    const high = insights.pain_points.filter(p => p.severity === 'high');
    const med = insights.pain_points.filter(p => p.severity === 'medium');
    const low = insights.pain_points.filter(p => p.severity === 'low');
    for (const group of [{ label: '🔴 HIGH', items: high }, { label: '🟡 MEDIUM', items: med }, { label: '⚪ LOW', items: low }]) {
      if (group.items.length === 0) continue;
      md += `### ${group.label}\n`;
      for (const p of group.items) {
        md += `- **${p.description}** ${p.source}\n`;
        if (p.quote) md += `  > "${p.quote}"\n`;
      }
    }
    md += '\n';
  }

  if (insights.feature_requests.length > 0) {
    md += `## 💡 Feature Requests (${insights.feature_requests.length})\n`;
    for (const f of insights.feature_requests) {
      md += `- **${f.description}** ${f.source}\n`;
      if (f.quote) md += `  > "${f.quote}"\n`;
    }
    md += '\n';
  }

  if (insights.friction.length > 0) {
    md += `## 🧱 Friction Points (${insights.friction.length})\n`;
    for (const f of insights.friction) {
      md += `- **${f.description}** ${f.source}\n`;
      if (f.suggestion) md += `  💡 Suggestion: ${f.suggestion}\n`;
    }
    md += '\n';
  }

  if (insights.wins.length > 0) {
    md += `## 🎉 Wins (${insights.wins.length})\n`;
    for (const w of insights.wins) {
      md += `- **${w.description}** ${w.source}\n`;
      if (w.quote) md += `  > "${w.quote}"\n`;
    }
    md += '\n';
  }

  if (insights.product_ideas.length > 0) {
    md += `## 🚀 Product Ideas (${insights.product_ideas.length})\n`;
    for (const i of insights.product_ideas) {
      md += `- **${i.idea}** ${i.source}\n`;
      if (i.reasoning) md += `  ${i.reasoning}\n`;
    }
    md += '\n';
  }

  if (insights.sentiments.length > 0) {
    md += `## 📊 Sentiment by Client\n`;
    for (const s of insights.sentiments) {
      md += `- **${s.score}/10** ${s.source} — ${s.reasoning}\n`;
    }
  }

  return md;
}

// --- Main ---
async function main() {
  const hoursBack = HOURS || (DAYS * 24);
  const period = HOURS ? `Last ${HOURS} hours` : `Last ${DAYS} days`;
  
  console.log(`🔍 Product Insights Extractor`);
  console.log(`   Period: ${period}`);

  const messages = await fetchConversations(hoursBack);
  console.log(`   Messages: ${messages.length}`);

  if (messages.length === 0) {
    console.log('   No messages found. Done.');
    return;
  }

  // Filter out system/cron messages
  const clientMessages = messages.filter(m => 
    !m.message?.startsWith('System:') && 
    !m.message?.includes('[SYSTEM A2A]') &&
    m.message?.length > 5
  );
  console.log(`   Client messages (filtered): ${clientMessages.length}`);

  const threads = groupConversations(clientMessages);
  console.log(`   Conversation threads: ${threads.length}`);

  // Only analyze threads with >5 messages (skip tiny fragments)
  const significant = threads.filter(t => t.length >= 5);
  console.log(`   Significant threads (≥5 msgs): ${significant.length}\n`);

  const analyses = [];
  for (let i = 0; i < significant.length; i++) {
    const thread = significant[i];
    const user = extractUser(thread.find(m => m.direction === 'in')?.message || '');
    console.log(`   📝 Thread ${i + 1}/${significant.length}: ${thread.length} msgs, user: ${user}`);
    
    try {
      const result = await analyzeThread(thread);
      result.user = result.user || user;
      analyses.push(result);
      
      if (result.skip) {
        console.log(`      ⏭️ Skipped: ${result.reason}`);
      } else {
        const painCount = (result.pain_points || []).length;
        const bugCount = (result.bugs || []).length;
        const winCount = (result.wins || []).length;
        console.log(`      ✅ Pain: ${painCount}, Bugs: ${bugCount}, Wins: ${winCount}, Sentiment: ${result.sentiment?.score || '?'}/10`);
      }
    } catch (err) {
      console.error(`      ❌ Failed: ${err.message}`);
    }

    // Rate limit
    if (i < significant.length - 1) await new Promise(r => setTimeout(r, 200));
  }

  // Aggregate and report
  const insights = aggregateInsights(analyses);
  const report = generateReport(insights, analyses, period);

  // Save report
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `insights-${new Date().toISOString().slice(0, 10)}.md`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, report);
  console.log(`\n📄 Report saved: ${filepath}`);

  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 SUMMARY`);
  console.log(`   🐛 Bugs: ${insights.bugs.length}`);
  console.log(`   😤 Pain points: ${insights.pain_points.length} (${insights.pain_points.filter(p => p.severity === 'high').length} high)`);
  console.log(`   💡 Feature requests: ${insights.feature_requests.length}`);
  console.log(`   🧱 Friction: ${insights.friction.length}`);
  console.log(`   🎉 Wins: ${insights.wins.length}`);
  console.log(`   🚀 Product ideas: ${insights.product_ideas.length}`);
  const avgS = insights.sentiments.length > 0
    ? (insights.sentiments.reduce((s, x) => s + x.score, 0) / insights.sentiments.length).toFixed(1)
    : 'N/A';
  console.log(`   📈 Avg sentiment: ${avgS}/10`);

  // Output JSON for piping
  if (FULL_REPORT) {
    const jsonPath = filepath.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ insights, analyses, period }, null, 2));
    console.log(`   JSON: ${jsonPath}`);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
