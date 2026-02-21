/**
 * gemini-embed.cjs — Shared Gemini embedding helper
 * 
 * All RAG scripts MUST use this for embeddings.
 * Model: gemini-embedding-001 (768 dimensions)
 * 
 * Usage:
 *   const { getEmbedding, getEmbeddings, EMBEDDING_DIMS } = require('./gemini-embed.cjs');
 *   const vec = await getEmbedding("some text");
 *   const vecs = await getEmbeddings(["text1", "text2"]);
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const EMBEDDING_DIMS = 768;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const MAX_CHARS = 8000;
const BATCH_SIZE = 100;

if (!GEMINI_KEY) {
  console.error('ERROR: GEMINI_API_KEY or GOOGLE_API_KEY required for embeddings');
  process.exit(1);
}

/**
 * Single text → 768-dim vector
 */
async function getEmbedding(text) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, MAX_CHARS) }] },
        outputDimensionality: EMBEDDING_DIMS
      })
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini embedding failed: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.embedding.values;
}

/**
 * Batch texts → array of 768-dim vectors
 */
async function getEmbeddings(texts) {
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(text => ({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: text.slice(0, MAX_CHARS) }] },
            outputDimensionality: EMBEDDING_DIMS
          }))
        })
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Gemini batch embedding failed: ${resp.status} ${err}`);
    }

    const data = await resp.json();
    allEmbeddings.push(...data.embeddings.map(e => e.values));

    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return allEmbeddings;
}

module.exports = { getEmbedding, getEmbeddings, EMBEDDING_DIMS, EMBEDDING_MODEL };
