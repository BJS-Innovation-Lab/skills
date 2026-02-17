#!/usr/bin/env node
/**
 * KG Extraction — Conversations → Knowledge Graph
 * 
 * Reads conversation logs and extracts entities + relationships
 * using Gemini Flash (cheap, fast). Writes to kg_nodes/kg_edges via graph.cjs.
 * 
 * Usage:
 *   node extract-from-conversations.cjs --agent sam --days 1
 *   node extract-from-conversations.cjs --file path/to/transcript.jsonl --client clickseguros
 *   node extract-from-conversations.cjs --dry-run --agent sam --days 2
 * 
 * What it extracts:
 *   - People mentioned (with roles, contact info)
 *   - Features requested/implemented
 *   - Bugs reported/fixed
 *   - Decisions made (with reasoning)
 *   - Patterns observed
 */

const fs = require('fs');
const path = require('path');
const { Graph, SCOPES } = require('../lib/graph.cjs');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

// ── Load env ────────────────────────────────────────────────────────
const envPath = path.join(WORKSPACE, 'rag/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// ── Gemini Flash for cheap extraction ───────────────────────────────
async function extractWithGemini(conversationChunk, context) {
  if (!GEMINI_KEY) throw new Error('Missing GEMINI_API_KEY');
  
  const prompt = `You are an entity extraction system for a knowledge graph. 
Extract entities and relationships from this conversation between an AI agent and clients.

Context:
- Agent: ${context.agent || 'unknown'}
- Client company: ${context.client || 'unknown'}
- Date: ${context.date || 'unknown'}

Conversation:
${conversationChunk}

Extract ONLY what's clearly stated. Don't infer or guess. Return JSON:
{
  "entities": [
    {"id": "unique_slug", "type": "person|feature|bug|decision|document|pattern", "name": "...", "properties": {...}}
  ],
  "relationships": [
    {"from": "entity_id", "to": "entity_id", "type": "REQUESTED|IMPLEMENTED|REPORTED|RESOLVED|SHARED|WORKS_FOR|DECIDED|LED_TO", "properties": {...}}
  ]
}

Entity types:
- person: People mentioned (name, role, contact info if shared)
- feature: Feature requests or implementations (name, status, description)
- bug: Bugs or issues (title, severity, status)
- decision: Decisions made (what, reasoning, who decided)
- document: Files/docs shared (type, name)
- pattern: Behavioral patterns observed (description)

Relationship types:
- REQUESTED: person requested a feature
- IMPLEMENTED: agent implemented a feature  
- REPORTED: person reported a bug
- RESOLVED: agent resolved a bug
- SHARED: person shared a document/credential/contact
- WORKS_FOR: person works for the client company
- DECIDED: person/agent made a decision
- LED_TO: one thing caused/led to another

Keep entity IDs as lowercase slugs (e.g., "suzanne-rubinstein", "admin-button-fix").
Only extract entities with clear evidence in the text. Skip greetings, small talk, and routine confirmations.
Return ONLY valid JSON, no markdown or explanation.`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { entities: [], relationships: [] };

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    console.warn('Failed to parse Gemini response:', text.slice(0, 200));
    return { entities: [], relationships: [] };
  }
}

// ── Read conversation sources ───────────────────────────────────────

function readDailyFile(agentWorkspace, date) {
  const filePath = path.join(agentWorkspace, 'memory', `${date}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function readTranscript(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const messages = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'message' && entry.message?.role) {
        const content = typeof entry.message.content === 'string' 
          ? entry.message.content 
          : entry.message.content?.map(c => c.text || '').join(' ') || '';
        if (content.length > 10) {
          messages.push({
            role: entry.message.role,
            content: content.slice(0, 500), // truncate long messages
            timestamp: entry.timestamp,
          });
        }
      }
    } catch { /* skip malformed lines */ }
  }
  return messages;
}

// Chunk messages into batches of ~20 for extraction
function chunkMessages(messages, batchSize = 20) {
  const chunks = [];
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const text = batch.map(m => {
      const role = m.role === 'user' ? 'Client' : 'Agent';
      return `[${role}] ${m.content}`;
    }).join('\n\n');
    chunks.push(text);
  }
  return chunks;
}

// ── Write to graph ──────────────────────────────────────────────────

async function writeToGraph(graph, extraction, context, dryRun = false) {
  const stats = { nodesCreated: 0, edgesCreated: 0, errors: 0 };
  const nodeIdMap = {}; // slug → graph ID

  // Ensure client and agent nodes exist
  if (context.client) {
    const clientId = `client-${context.client}`;
    if (!dryRun) {
      await graph.addNode('client', { name: context.client }, clientId);
    }
    nodeIdMap[context.client] = clientId;
  }
  if (context.agent) {
    const agentId = `agent-${context.agent}`;
    if (!dryRun) {
      await graph.addNode('agent', { name: context.agent }, agentId);
    }
    nodeIdMap[context.agent] = agentId;
  }

  // Create entity nodes
  for (const entity of extraction.entities || []) {
    try {
      const nodeId = `${entity.type}-${entity.id}`;
      // Scope: people and agents are global, everything else is client-scoped
      const isGlobal = ['person', 'agent', 'founder'].includes(entity.type);
      const scope = isGlobal ? SCOPES.GLOBAL : (context.client ? SCOPES.client(context.client) : SCOPES.GLOBAL);
      if (!dryRun) {
        await graph.addNode(entity.type, {
          name: entity.name,
          ...entity.properties,
          _scope: scope,
          _extracted_from: context.source || 'unknown',
          _extracted_date: context.date || new Date().toISOString(),
        }, nodeId);
      }
      nodeIdMap[entity.id] = nodeId;
      stats.nodesCreated++;
    } catch (e) {
      console.warn(`  Failed to create node ${entity.id}: ${e.message}`);
      stats.errors++;
    }
  }

  // Create relationship edges
  for (const rel of extraction.relationships || []) {
    try {
      const fromId = nodeIdMap[rel.from] || `unknown-${rel.from}`;
      const toId = nodeIdMap[rel.to] || `unknown-${rel.to}`;
      
      // Skip if we don't have both nodes
      if (fromId.startsWith('unknown-') || toId.startsWith('unknown-')) {
        // Try to find the node by slug
        const resolvedFrom = nodeIdMap[rel.from];
        const resolvedTo = nodeIdMap[rel.to];
        if (!resolvedFrom || !resolvedTo) {
          console.warn(`  Skipping edge ${rel.from} → ${rel.to}: node not found`);
          continue;
        }
      }
      
      if (!dryRun) {
        await graph.addEdge(nodeIdMap[rel.from], nodeIdMap[rel.to], rel.type, {
          ...rel.properties,
          _extracted_date: context.date,
        });
      }
      stats.edgesCreated++;
    } catch (e) {
      console.warn(`  Failed to create edge ${rel.from}→${rel.to}: ${e.message}`);
      stats.errors++;
    }
  }

  return stats;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const agentIdx = args.indexOf('--agent');
  const daysIdx = args.indexOf('--days');
  const fileIdx = args.indexOf('--file');
  const clientIdx = args.indexOf('--client');
  const jsonMode = args.includes('--json');

  const agent = agentIdx >= 0 ? args[agentIdx + 1] : 'sam';
  const days = daysIdx >= 0 ? parseInt(args[daysIdx + 1]) : 1;
  const client = clientIdx >= 0 ? args[clientIdx + 1] : null;
  const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;

  console.log(`🕸️  KG Extraction${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`   Agent: ${agent} | Days: ${days}`);

  const graph = dryRun ? null : new Graph();
  let totalStats = { nodesCreated: 0, edgesCreated: 0, errors: 0, chunks: 0 };

  // Source: daily memory files
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  for (const date of dates) {
    // Try to read from the agent's workspace
    const agentWorkspaces = {
      sam: path.join(process.env.HOME, '..', 'sam', '.openclaw/workspace'),
      sybil: WORKSPACE,
    };
    
    // Also try local daily files
    const dailyContent = readDailyFile(WORKSPACE, date);
    if (!dailyContent) {
      console.log(`   No daily file for ${date}, skipping...`);
      continue;
    }

    console.log(`\n📅 Processing ${date}...`);
    
    // Chunk the daily file into sections
    const sections = dailyContent.split(/(?=^## )/m).filter(s => s.length > 50);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].slice(0, 3000); // limit per chunk
      console.log(`   Chunk ${i + 1}/${sections.length}: ${section.slice(0, 60).replace(/\n/g, ' ')}...`);
      
      try {
        const extraction = await extractWithGemini(section, {
          agent,
          client: client || 'unknown',
          date,
          source: `daily-${date}`,
        });

        if (jsonMode) {
          console.log(JSON.stringify(extraction, null, 2));
        }

        const entityCount = extraction.entities?.length || 0;
        const relCount = extraction.relationships?.length || 0;
        console.log(`   → ${entityCount} entities, ${relCount} relationships`);

        if (entityCount > 0 || relCount > 0) {
          const stats = await writeToGraph(graph, extraction, {
            agent,
            client: client || 'unknown',
            date,
            source: `daily-${date}`,
          }, dryRun);

          totalStats.nodesCreated += stats.nodesCreated;
          totalStats.edgesCreated += stats.edgesCreated;
          totalStats.errors += stats.errors;
        }
        
        totalStats.chunks++;

        // Rate limit: 100ms between chunks
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.warn(`   ❌ Extraction failed: ${e.message}`);
        totalStats.errors++;
      }
    }
  }

  console.log(`\n✅ Extraction complete`);
  console.log(`   Chunks processed: ${totalStats.chunks}`);
  console.log(`   Nodes created: ${totalStats.nodesCreated}`);
  console.log(`   Edges created: ${totalStats.edgesCreated}`);
  console.log(`   Errors: ${totalStats.errors}`);

  if (!dryRun && graph) {
    const stats = await graph.stats();
    console.log(`\n📊 Graph totals: ${stats.totalNodes} nodes, ${stats.totalEdges} edges`);
    if (Object.keys(stats.nodesByType).length) {
      console.log('   Nodes:', JSON.stringify(stats.nodesByType));
      console.log('   Edges:', JSON.stringify(stats.edgesByType));
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
