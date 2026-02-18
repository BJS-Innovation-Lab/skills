#!/usr/bin/env node
/**
 * Unified Task Tracker Sync (Supabase Client Version)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Config
const WORKSPACE = process.env.WORKSPACE || require('path').resolve(__dirname, '..');
const AGENT_ID = 'sybil';

// Use the URL and Service Key from existing RAG setup if possible, 
// otherwise fall back to environment variables.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

function parseTasks() {
  const filePath = path.join(WORKSPACE, 'MVP-TRACKER.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  const tasks = [];
  const lines = content.split('\n');
  const rowRegex = /^\|\s*(SYB-\d+|SAG-\d+|SAM-\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|/;
  
  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      const [_, id, owner, statusRaw, title, priority, due] = match.map(s => s.trim());
      if (owner.toLowerCase() !== 'sybil' && !id.startsWith('SYB')) continue;

      let status = statusRaw.toLowerCase();
      if (status.includes('✅')) status = 'done';
      else if (status.includes('🔄')) status = 'in-progress';
      else if (status.includes('⏳')) status = 'pending';
      else if (status.includes('done')) status = 'done';
      else if (status.includes('progress')) status = 'in-progress';
      else status = 'pending';

      tasks.push({
        id,
        agent_id: AGENT_ID,
        title,
        description: `Due: ${due}`,
        status,
        priority: priority.toLowerCase(),
        metadata: { owner, due }
      });
    }
  }
  return tasks;
}

async function sync() {
  console.log('🔄 Starting Task Sync (Supabase Client)...');
  const tasks = parseTasks();
  console.log(`🔍 Found ${tasks.length} tasks for SYB`);
  
  for (const task of tasks) {
    console.log(`📤 Syncing ${task.id}: ${task.title}...`);
    const embedding = await generateEmbedding(`${task.title} ${task.description}`);
    
    const { error } = await supabase
      .from('global_tasks')
      .upsert({
        ...task,
        embedding,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
      
    if (error) console.error(`❌ Error syncing ${task.id}: ${error.message}`);
    else console.log(`✅ Synced ${task.id}`);
  }
  console.log('📊 Sync Complete.');
}

sync().catch(console.error);
