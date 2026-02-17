#!/usr/bin/env node
/**
 * KG Query — Ask the knowledge graph questions
 * 
 * Usage:
 *   node query.cjs stats                          # Graph overview
 *   node query.cjs people                         # List all people
 *   node query.cjs features                       # List all features
 *   node query.cjs bugs                           # List all bugs
 *   node query.cjs patterns                       # List all patterns
 *   node query.cjs about "suzanne"                # Everything connected to a person/entity
 *   node query.cjs client "clickseguros"          # Everything for a client
 *   node query.cjs path "sam" "admin-button"      # Find path between two entities
 *   node query.cjs shared-patterns                # Cross-client patterns
 *   node query.cjs decisions                      # All decisions and their outcomes
 *   node query.cjs who-requested                  # Features by who requested them
 */

const { Graph, SCOPES } = require('../lib/graph.cjs');

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const g = new Graph(); // founder-level: see everything

  if (!cmd || cmd === 'help') {
    console.log(`
🕸️  VULKN Knowledge Graph — Query Tool

Commands:
  stats                    Graph overview (node/edge counts by type)
  people                   List all people with their connections
  features [--status X]    List features (optionally filter by status)
  bugs                     List bugs with severity
  patterns                 Discovered patterns
  decisions                Decisions and what they led to
  about <name>             Everything connected to an entity (fuzzy match)
  client <name>            All data for a client
  who-requested            Features grouped by who requested them
  shared-patterns          Patterns appearing across multiple clients
  recent [days]            Entities extracted in last N days
`);
    return;
  }

  if (cmd === 'stats') {
    const stats = await g.stats();
    console.log('📊 Knowledge Graph Stats\n');
    console.log(`Total nodes: ${stats.totalNodes}`);
    console.log(`Total edges: ${stats.totalEdges}\n`);
    console.log('Nodes by type:');
    for (const [type, count] of Object.entries(stats.nodesByType).sort((a,b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\nEdges by type:');
    for (const [type, count] of Object.entries(stats.edgesByType).sort((a,b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
    return;
  }

  if (cmd === 'people') {
    const people = await g.findNodes('person');
    console.log(`👥 People (${people.length})\n`);
    for (const p of people) {
      const name = p.properties.name || p.id;
      const role = p.properties.role ? ` — ${p.properties.role}` : '';
      console.log(`  ${name}${role}`);
      
      const edgesOut = await g.getEdgesFrom(p.id);
      const edgesIn = await g.getEdgesTo(p.id);
      for (const e of edgesOut) {
        const target = await g.getNode(e.to_node);
        const tName = target?.properties?.name || target?.node_type || e.to_node;
        console.log(`    → ${e.edge_type} → ${tName}`);
      }
      for (const e of edgesIn) {
        const source = await g.getNode(e.from_node);
        const sName = source?.properties?.name || source?.node_type || e.from_node;
        console.log(`    ← ${e.edge_type} ← ${sName}`);
      }
      console.log();
    }
    return;
  }

  if (cmd === 'features') {
    const features = await g.findNodes('feature');
    console.log(`🛠️ Features (${features.length})\n`);
    for (const f of features) {
      const status = f.properties.status ? ` [${f.properties.status}]` : '';
      console.log(`  ${f.properties.name || f.id}${status}`);
    }
    return;
  }

  if (cmd === 'bugs') {
    const bugs = await g.findNodes('bug');
    console.log(`🐛 Bugs (${bugs.length})\n`);
    for (const b of bugs) {
      const sev = b.properties.severity ? ` [${b.properties.severity}]` : '';
      const status = b.properties.status ? ` (${b.properties.status})` : '';
      console.log(`  ${b.properties.name || b.id}${sev}${status}`);
    }
    return;
  }

  if (cmd === 'patterns') {
    const patterns = await g.findNodes('pattern');
    console.log(`🔍 Patterns (${patterns.length})\n`);
    for (const p of patterns) {
      const desc = p.properties.description ? ` — ${p.properties.description}` : '';
      console.log(`  ${p.properties.name || p.id}${desc}`);
    }
    return;
  }

  if (cmd === 'decisions') {
    const decisions = await g.findNodes('decision');
    console.log(`⚖️ Decisions (${decisions.length})\n`);
    for (const d of decisions) {
      console.log(`  ${d.properties.name || d.id}`);
      if (d.properties.reasoning) console.log(`    Reasoning: ${d.properties.reasoning}`);
      
      const edges = await g.getEdgesFrom(d.id);
      for (const e of edges) {
        const target = await g.getNode(e.to_node);
        const tName = target?.properties?.name || e.to_node;
        console.log(`    → ${e.edge_type} → ${tName}`);
      }
      console.log();
    }
    return;
  }

  if (cmd === 'about') {
    const search = (args[1] || '').toLowerCase();
    if (!search) { console.log('Usage: query.cjs about <name>'); return; }
    
    // Search all nodes for fuzzy match
    const allNodes = await g.findNodes('person');
    const allFeatures = await g.findNodes('feature');
    const allBugs = await g.findNodes('bug');
    const allPatterns = await g.findNodes('pattern');
    const allDecisions = await g.findNodes('decision');
    const allDocs = await g.findNodes('document');
    const allAgents = await g.findNodes('agent');
    const all = [...allNodes, ...allFeatures, ...allBugs, ...allPatterns, ...allDecisions, ...allDocs, ...allAgents];
    
    const matches = all.filter(n => {
      const name = (n.properties.name || n.id || '').toLowerCase();
      return name.includes(search) || n.id.toLowerCase().includes(search);
    });

    if (matches.length === 0) {
      console.log(`No entities matching "${search}"`);
      return;
    }

    console.log(`🔎 Results for "${search}" (${matches.length} matches)\n`);
    
    for (const node of matches.slice(0, 10)) {
      console.log(`📌 ${node.properties.name || node.id} (${node.node_type})`);
      if (node.properties._scope) console.log(`   Scope: ${node.properties._scope}`);
      
      // Show properties (skip internal ones)
      for (const [k, v] of Object.entries(node.properties)) {
        if (!k.startsWith('_') && k !== 'name') {
          console.log(`   ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
        }
      }
      
      // Show connections
      const edgesOut = await g.getEdgesFrom(node.id);
      const edgesIn = await g.getEdgesTo(node.id);
      
      if (edgesOut.length + edgesIn.length > 0) {
        console.log('   Connections:');
        for (const e of edgesOut) {
          const target = await g.getNode(e.to_node);
          const tName = target?.properties?.name || target?.node_type || e.to_node;
          console.log(`     → ${e.edge_type} → ${tName} (${target?.node_type || '?'})`);
        }
        for (const e of edgesIn) {
          const source = await g.getNode(e.from_node);
          const sName = source?.properties?.name || source?.node_type || e.from_node;
          console.log(`     ← ${e.edge_type} ← ${sName} (${source?.node_type || '?'})`);
        }
      }
      console.log();
    }
    return;
  }

  if (cmd === 'client') {
    const clientName = (args[1] || '').toLowerCase();
    if (!clientName) { console.log('Usage: query.cjs client <name>'); return; }
    
    const scope = SCOPES.client(clientName);
    
    // Get all nodes with this client scope
    const allTypes = ['person', 'feature', 'bug', 'decision', 'pattern', 'document'];
    console.log(`🏢 Client: ${clientName}\n`);
    
    for (const type of allTypes) {
      const nodes = await g.findNodes(type);
      const scoped = nodes.filter(n => n.properties._scope === scope || n.properties._scope === 'global');
      if (scoped.length > 0) {
        const emoji = { person: '👤', feature: '🛠️', bug: '🐛', decision: '⚖️', pattern: '🔍', document: '📄' }[type] || '•';
        console.log(`${emoji} ${type} (${scoped.length}):`);
        for (const n of scoped.slice(0, 15)) {
          console.log(`  ${n.properties.name || n.id}`);
        }
        if (scoped.length > 15) console.log(`  ... and ${scoped.length - 15} more`);
        console.log();
      }
    }
    return;
  }

  if (cmd === 'who-requested') {
    const people = await g.findNodes('person');
    console.log('📋 Features by Requester\n');
    
    for (const p of people) {
      const edges = await g.getEdgesFrom(p.id, 'REQUESTED');
      if (edges.length > 0) {
        console.log(`  ${p.properties.name || p.id} (${edges.length} requests):`);
        for (const e of edges) {
          const feature = await g.getNode(e.to_node);
          console.log(`    • ${feature?.properties?.name || e.to_node}`);
        }
        console.log();
      }
    }
    return;
  }

  if (cmd === 'shared-patterns') {
    const shared = await g.findSharedPatterns('client', 'EXHIBITS', 2);
    if (shared.length === 0) {
      console.log('No cross-client patterns found yet (need more client data).');
      return;
    }
    console.log(`🔗 Shared Patterns (${shared.length})\n`);
    for (const s of shared) {
      console.log(`  ${s.sharedNode?.properties?.name || '?'} — shared by ${s.count} clients:`);
      for (const c of s.connectedNodes) {
        console.log(`    • ${c.properties.name || c.id}`);
      }
    }
    return;
  }

  console.log(`Unknown command: ${cmd}. Run with 'help' for usage.`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
