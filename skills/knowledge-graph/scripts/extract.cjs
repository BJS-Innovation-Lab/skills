#!/usr/bin/env node
/**
 * KG Extraction Pipeline
 * 
 * Extracts entities and relationships from conversation chunks using Gemini Flash.
 * Passes known entities to prevent duplicates (entity resolution in-prompt).
 * 
 * Usage:
 *   node extract.cjs --agent sam --days 7 [--dry-run] [--verbose]
 *   node extract.cjs --file /path/to/messages.json [--tenant-id UUID]
 */

const fs = require('fs');
const path = require('path');
const graph = require('../lib/graph.cjs');

// --- Config ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 20; // messages per extraction
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// --- Args ---
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const hasFlag = (name) => args.includes(`--${name}`);
const AGENT_NAME = getArg('agent');
const DAYS = parseInt(getArg('days') || '7');
const FILE_PATH = getArg('file');
const TENANT_ID = getArg('tenant-id');
const DRY_RUN = hasFlag('dry-run');
const VERBOSE = hasFlag('verbose');

// --- Extraction Prompt (v3, validated) ---
function buildPrompt(messages, knownEntities) {
  const knownList = knownEntities.length > 0
    ? `\n## KNOWN ENTITIES (reuse these IDs, do NOT create duplicates)\n${knownEntities.map(e => `- [${e.id}] ${e.entity_type}: "${e.name}"`).join('\n')}\n`
    : '';

  return `You are a knowledge graph extraction engine for a business intelligence system.
Extract entities and relationships from the following conversation.

## ENTITY TYPES (use exactly these)
Person, Organization, Product, Topic, Decision, Preference, Task, Event, Conversation, Skill, Lead, Campaign

## RELATIONSHIP TYPES (use exactly these)  
WORKS_AT, HAS_ROLE, KNOWS, REPORTS_TO, PREFERS, DECIDED, DISCUSSED, MENTIONED_IN, RELATED_TO, ASSIGNED_TO, PART_OF, USES, LED_TO, SIMILAR_TO, REFERRED_BY, CONVERTED_TO

## RULES
1. Entity resolution: If an entity matches a known entity below, use its existing ID (field: "existing_id")
2. For NEW entities, set "existing_id": null
3. Capture sentiment (-1.0 to 1.0) on Conversation entities
4. Capture capability gaps as Topic entities with topic_type: "gap"
5. Distinguish between AI agents (Person with role containing "agent") and human contacts
6. Extract contact info (email, phone) as Person properties
7. Capture decisions with reasoning and status
8. Keep confidence scores honest (0.0-1.0)
${knownList}
## CONVERSATION
${messages.map(m => `[${m.timestamp || m.created_at}] ${m.direction === 'outgoing' ? 'AGENT' : (m.user_name || 'USER')}: ${m.message}`).join('\n')}

## OUTPUT FORMAT (strict JSON)
{
  "entities": [
    {
      "existing_id": null,
      "entity_type": "Person",
      "name": "Exact Name",
      "properties": { "role": "CEO", "phone": "+52..." },
      "confidence": 0.95
    }
  ],
  "relationships": [
    {
      "relationship": "WORKS_AT",
      "source": "Exact Name of source entity",
      "target": "Exact Name of target entity",
      "properties": {},
      "confidence": 0.9
    }
  ],
  "conversation_summary": {
    "summary": "Brief summary of this conversation chunk",
    "sentiment": 0.3,
    "engagement_score": 7,
    "capability_gaps": ["thing agent couldn't do"],
    "key_topics": ["topic1", "topic2"]
  }
}

Return ONLY valid JSON. No markdown fences, no commentary.`;
}

// --- Fetch conversations from Supabase ---
async function fetchConversations(agentName, days) {
  const { createClient } = require('@supabase/supabase-js');
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await db.from('conversations')
    .select('*')
    .ilike('agent_name', agentName)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });
  
  if (error) throw new Error(`Fetch conversations failed: ${error.message}`);
  return data || [];
}

// --- Call Gemini Flash ---
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY required');
  
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });
  
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON (handle markdown fences)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// --- Batch messages ---
function batchMessages(messages, batchSize = BATCH_SIZE) {
  const batches = [];
  for (let i = 0; i < messages.length; i += batchSize) {
    batches.push(messages.slice(i, i + batchSize));
  }
  return batches;
}

// --- Ingest extraction results ---
async function ingestResults(extraction, tenantId, agentId, rawMessages) {
  const entityIds = [];
  const edgeIds = [];
  
  // 1. Resolve/create entities
  const entityMap = {}; // name → id
  for (const e of extraction.entities || []) {
    if (e.existing_id) {
      entityMap[e.name] = e.existing_id;
      // Update properties if new info
      await graph.updateEntity(e.existing_id, { properties: e.properties });
    } else {
      const result = await graph.resolveEntity(e.entity_type, e.name, e.properties, tenantId);
      entityMap[e.name] = result.id;
      entityIds.push(result.id);
      if (VERBOSE) console.log(`  ${result.created ? '✨ NEW' : '🔗 EXISTING'} ${e.entity_type}: ${e.name}`);
    }
  }

  // 2. Create Conversation entity
  const convSummary = extraction.conversation_summary || {};
  const convResult = await graph.resolveEntity('Conversation', 
    convSummary.summary?.slice(0, 100) || 'Conversation chunk',
    {
      summary: convSummary.summary,
      sentiment: convSummary.sentiment,
      engagement_score: convSummary.engagement_score,
      capability_gaps: convSummary.capability_gaps,
      key_topics: convSummary.key_topics,
      message_count: rawMessages.length,
    },
    tenantId
  );
  const convId = convResult.id;
  entityIds.push(convId);

  // 3. Create edges
  for (const r of extraction.relationships || []) {
    const sourceId = entityMap[r.source];
    const targetId = entityMap[r.target];
    if (!sourceId || !targetId) {
      if (VERBOSE) console.log(`  ⚠️ Skipping edge ${r.source} -[${r.relationship}]-> ${r.target}: entity not found`);
      continue;
    }
    try {
      const edgeId = await graph.addEdge(r.relationship, sourceId, targetId, r.properties || {}, {
        confidence: r.confidence || 0.8,
        provenance: 'extraction:v3',
        tenantId,
      });
      edgeIds.push(edgeId);
      if (VERBOSE) console.log(`  🔗 ${r.source} -[${r.relationship}]-> ${r.target}`);
    } catch (err) {
      if (VERBOSE) console.log(`  ❌ Edge failed: ${err.message}`);
    }
  }

  // 4. Create MENTIONED_IN edges for all entities → conversation
  for (const [name, id] of Object.entries(entityMap)) {
    if (id === convId) continue;
    try {
      await graph.addEdge('MENTIONED_IN', id, convId, {}, {
        confidence: 0.9,
        provenance: 'extraction:v3',
        tenantId,
      });
    } catch (err) { /* skip dupes */ }
  }

  // 5. Store episode
  const episodeId = await graph.addEpisode(agentId, rawMessages, {
    conversationId: convId,
    extractionVersion: 'v3',
    entityIds,
    edgeIds,
    tenantId,
  });

  return { entityIds, edgeIds, episodeId, convId };
}

// --- Main ---
async function main() {
  console.log('🧠 KG Extraction Pipeline v3');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  
  graph.init();

  // Load messages
  let messages;
  if (FILE_PATH) {
    messages = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    console.log(`   Source: ${FILE_PATH} (${messages.length} messages)`);
  } else if (AGENT_NAME) {
    messages = await fetchConversations(AGENT_NAME, DAYS);
    console.log(`   Source: ${AGENT_NAME} conversations, last ${DAYS} days (${messages.length} messages)`);
  } else {
    console.error('Usage: node extract.cjs --agent <name> --days <n> | --file <path>');
    process.exit(1);
  }

  if (messages.length === 0) {
    console.log('   No messages found. Done.');
    return;
  }

  // Get known entities for this tenant (entity resolution)
  let knownEntities = [];
  if (!DRY_RUN) {
    knownEntities = await graph.findEntities({ tenantId: TENANT_ID, limit: 200 });
    console.log(`   Known entities: ${knownEntities.length}`);
  }

  // Batch and extract
  const batches = batchMessages(messages);
  console.log(`   Batches: ${batches.length} (${BATCH_SIZE} msgs each)\n`);

  let totalEntities = 0, totalEdges = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Batch ${i + 1}/${batches.length} (${batch.length} messages)`);
    
    const prompt = buildPrompt(batch, knownEntities);
    
    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would send ${prompt.length} chars to Gemini Flash`);
      continue;
    }

    try {
      const extraction = await callGemini(prompt);
      const entCount = (extraction.entities || []).length;
      const relCount = (extraction.relationships || []).length;
      console.log(`   Extracted: ${entCount} entities, ${relCount} relationships`);

      const result = await ingestResults(extraction, TENANT_ID, AGENT_NAME, batch);
      totalEntities += result.entityIds.length;
      totalEdges += result.edgeIds.length;

      // Update known entities for next batch
      const newEntities = await graph.findEntities({ tenantId: TENANT_ID, limit: 200 });
      knownEntities = newEntities;

      console.log(`   ✅ Ingested: ${result.entityIds.length} entities, ${result.edgeIds.length} edges\n`);
    } catch (err) {
      console.error(`   ❌ Batch ${i + 1} failed: ${err.message}`);
    }

    // Rate limit: 100ms between batches
    if (i < batches.length - 1) await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🏁 Done! Total: ${totalEntities} entities, ${totalEdges} edges ingested.`);
  
  if (!DRY_RUN) {
    const s = await graph.stats(TENANT_ID);
    console.log(`📊 Graph stats: ${s.entities} entities, ${s.edges} edges, ${s.episodes} episodes`);
  }
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
