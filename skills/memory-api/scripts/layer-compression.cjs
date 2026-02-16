#!/usr/bin/env node
/**
 * Layer 4: Semantic Compression — LLM squeezes raw memory into char budget
 * Takes the combined output of layers 1-3 and compresses to fit
 * Uses Sonnet for speed + cost efficiency
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const MAX_OUTPUT_CHARS = parseInt(process.env.MEMORY_BUDGET) || 4000;

function loadEnv() {
  const envPaths = [
    path.join(WORKSPACE, 'rag', '.env'),
    path.join(WORKSPACE, '.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const m = line.match(/^([^#=]+)=(.+)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
    }
  }
}

const COMPRESSION_PROMPT = `You are a memory compression engine for an AI agent. Your job is to take raw memory context and compress it into the most information-dense boot memory possible.

RULES:
1. Output MUST be under {budget} characters — this is a HARD LIMIT
2. Use markdown format (headers, bullets, bold) — 15% more token-efficient than JSON
3. Structure: Identity → Principles → Active Context → Recent → Status
4. Preserve: names, IDs, dates, decisions, action items, relationships
5. Drop: verbose explanations, redundant info, completed tasks, old status
6. Merge: combine related items into single dense lines
7. Every line must earn its place — if removing it wouldn't hurt the agent, remove it
8. Prefer specific facts over general descriptions
9. Keep the agent's voice/personality markers if present

CONTEXT ABOUT THIS AGENT:
- Name: {agentName}
- Talking to: {talkingTo}
- Channel: {channel}
- Time: {time}

RAW MEMORY (compress this):
---
{rawMemory}
---

Output ONLY the compressed memory. No explanations, no meta-commentary. Start with a # header.`;

async function compress({ rawMemory, agentName, talkingTo, channel, time, budget }) {
  loadEnv();
  
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!anthropicKey && !geminiKey) {
    process.stderr.write('[layer-compression] No API key available, using smart truncation fallback\n');
    return smartTruncate(rawMemory, budget || MAX_OUTPUT_CHARS);
  }
  
  const prompt = COMPRESSION_PROMPT
    .replace('{budget}', String(budget || MAX_OUTPUT_CHARS))
    .replace('{agentName}', agentName || 'Unknown')
    .replace('{talkingTo}', talkingTo || 'Unknown')
    .replace('{channel}', channel || 'Unknown')
    .replace('{time}', time || new Date().toISOString())
    .replace('{rawMemory}', rawMemory);
  
  let resp;
  let compressed;
  
  if (geminiKey) {
    // Use Gemini Flash — fast and cheap for compression
    process.stderr.write('[layer-compression] Using Gemini Flash for compression\n');
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000 }
        })
      }
    );
    
    if (!resp.ok) {
      const err = await resp.text();
      process.stderr.write(`[layer-compression] Gemini error: ${resp.status} ${err.substring(0, 200)}\n`);
      if (anthropicKey) {
        process.stderr.write('[layer-compression] Falling back to Anthropic...\n');
      } else {
        return smartTruncate(rawMemory, budget || MAX_OUTPUT_CHARS);
      }
    } else {
      const data = await resp.json();
      compressed = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  }
  
  // Anthropic fallback (or primary if no Gemini key)
  if (!compressed && anthropicKey) {
    process.stderr.write('[layer-compression] Using Anthropic Sonnet for compression\n');
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!resp.ok) {
      const err = await resp.text();
      process.stderr.write(`[layer-compression] Anthropic error: ${resp.status} ${err.substring(0, 200)}\n`);
      return smartTruncate(rawMemory, budget || MAX_OUTPUT_CHARS);
    }
    
    const data = await resp.json();
    compressed = data.content?.[0]?.text || '';
  }
  
  if (!compressed) {
    return smartTruncate(rawMemory, budget || MAX_OUTPUT_CHARS);
  }
  
  // Hard enforcement of char limit
  if (compressed.length > (budget || MAX_OUTPUT_CHARS)) {
    process.stderr.write(`[layer-compression] WARNING: LLM output ${compressed.length} chars, truncating to ${budget || MAX_OUTPUT_CHARS}\n`);
    compressed = smartTruncate(compressed, budget || MAX_OUTPUT_CHARS);
  }
  
  return compressed;
}

/**
 * Smart truncation fallback — preserves structure
 * Keeps headers and first line of each section
 */
function smartTruncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  
  const lines = text.split('\n');
  const result = [];
  let chars = 0;
  
  for (const line of lines) {
    // Always keep headers
    if (line.startsWith('#')) {
      if (chars + line.length + 1 < maxChars) {
        result.push(line);
        chars += line.length + 1;
      }
      continue;
    }
    
    // Keep bullets and content until budget
    if (chars + line.length + 1 < maxChars - 50) { // 50 char buffer
      result.push(line);
      chars += line.length + 1;
    }
  }
  
  return result.join('\n');
}

if (require.main === module) {
  const rawFile = process.argv[2];
  const budget = parseInt(process.argv[3]) || MAX_OUTPUT_CHARS;
  
  let rawMemory;
  if (rawFile && fs.existsSync(rawFile)) {
    rawMemory = fs.readFileSync(rawFile, 'utf-8');
  } else if (rawFile) {
    rawMemory = rawFile;
  } else {
    // Read from stdin
    rawMemory = fs.readFileSync(0, 'utf-8');
  }
  
  compress({
    rawMemory,
    budget,
    agentName: process.env.AGENT_NAME || 'Sybil',
    talkingTo: process.env.TALKING_TO || 'Unknown',
    channel: process.env.CHANNEL || 'Unknown',
    time: new Date().toISOString()
  }).then(result => {
    console.log(result);
    process.stderr.write(`[layer-compression] Input: ${rawMemory.length} → Output: ${result.length} chars (${Math.round(result.length/rawMemory.length*100)}% of original)\n`);
  });
}

module.exports = { compress, smartTruncate };
