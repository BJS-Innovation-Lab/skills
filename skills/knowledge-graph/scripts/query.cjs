#!/usr/bin/env node
/**
 * KG Query CLI
 * 
 * Usage:
 *   node query.cjs --entity "Javier Mitrani"              # Find entity + neighbors
 *   node query.cjs --type Person --tenant UUID             # List entities by type
 *   node query.cjs --traverse UUID --depth 3               # Walk graph from entity
 *   node query.cjs --stats [--tenant UUID]                 # Graph statistics
 *   node query.cjs --gaps [--tenant UUID]                  # Capability gaps
 *   node query.cjs --engagement [--tenant UUID]            # Engagement scores
 */

const graph = require('../lib/graph.cjs');

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const hasFlag = (name) => args.includes(`--${name}`);

async function main() {
  graph.init();
  const tenantId = getArg('tenant');

  if (hasFlag('stats')) {
    const s = await graph.stats(tenantId);
    console.log('📊 Graph Statistics');
    console.log(`   Entities: ${s.entities}`);
    console.log(`   Edges:    ${s.edges}`);
    console.log(`   Episodes: ${s.episodes}`);
    return;
  }

  if (getArg('entity')) {
    const name = getArg('entity');
    const entities = await graph.findEntities({ name, tenantId, limit: 5 });
    if (entities.length === 0) { console.log('No entities found.'); return; }
    
    for (const e of entities) {
      console.log(`\n🔵 ${e.entity_type}: ${e.name} [${e.id}]`);
      console.log(`   Properties: ${JSON.stringify(e.properties)}`);
      
      const neighbors = await graph.traverse(e.id, { maxDepth: 1, tenantId, direction: 'both' });
      if (neighbors.length > 0) {
        console.log(`   Connections (${neighbors.length}):`);
        for (const n of neighbors) {
          console.log(`     -[${n.edge.relationship}]-> ${n.node.entity_type}: ${n.node.name} (conf: ${n.edge.confidence})`);
        }
      }
    }
    return;
  }

  if (getArg('type')) {
    const entities = await graph.findEntities({ entityType: getArg('type'), tenantId, limit: 50 });
    console.log(`\n${getArg('type')} entities (${entities.length}):`);
    for (const e of entities) {
      console.log(`  • ${e.name} — ${JSON.stringify(e.properties)}`);
    }
    return;
  }

  if (getArg('traverse')) {
    const startId = getArg('traverse');
    const depth = parseInt(getArg('depth') || '3');
    const results = await graph.traverse(startId, { maxDepth: depth, tenantId, direction: 'both' });
    
    console.log(`\n🌐 Traversal from ${startId} (depth ${depth}): ${results.length} connections`);
    for (const r of results) {
      const indent = '  '.repeat(r.depth);
      console.log(`${indent}${r.depth}. -[${r.edge.relationship}]-> ${r.node.entity_type}: ${r.node.name}`);
    }
    return;
  }

  if (hasFlag('gaps')) {
    const topics = await graph.findEntities({ entityType: 'Topic', tenantId, limit: 100 });
    const gaps = topics.filter(t => t.properties?.topic_type === 'gap');
    console.log(`\n⚠️ Capability Gaps (${gaps.length}):`);
    for (const g of gaps) {
      console.log(`  • ${g.name} — ${g.properties.description || ''}`);
    }
    return;
  }

  if (hasFlag('engagement')) {
    const convs = await graph.findEntities({ entityType: 'Conversation', tenantId, limit: 50 });
    const sorted = convs
      .filter(c => c.properties?.engagement_score != null)
      .sort((a, b) => (b.properties.engagement_score || 0) - (a.properties.engagement_score || 0));
    
    console.log(`\n📈 Engagement Scores (${sorted.length} conversations):`);
    for (const c of sorted.slice(0, 20)) {
      const p = c.properties;
      console.log(`  ${p.engagement_score}/10 | sentiment: ${p.sentiment} | ${c.name}`);
    }
    return;
  }

  console.log('Usage: node query.cjs --entity <name> | --type <type> | --traverse <id> | --stats | --gaps | --engagement');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
