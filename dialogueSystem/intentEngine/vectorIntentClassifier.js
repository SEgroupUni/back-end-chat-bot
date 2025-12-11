import { createRequire } from "module";
import { pipeline } from "@xenova/transformers";

/**
 * vectorIntentClassifier.js
 * ------------------------------------------------------------
 * Performs semantic intent detection using sentence embeddings.
 *
 * Pipeline:
 *   1. Load precomputed intent vectors from intent_vectors.json
 *   2. Embed the user input using MiniLM sentence transformer
 *   3. Compute cosine similarity between user vector and each intent vector
 *   4. Return the highest-scoring intent if above threshold (0.8)
 *
 * Used as a fallback when exact pattern matching fails.
 */


const require = createRequire(import.meta.url);
const intents = require("../../intentData/intent_vectors.json");

// ------------------------------------------------------------
// Load the MiniLM embedding model ONCE at module load time.
// This avoids loading the model for every user request.
// ------------------------------------------------------------
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");


// ------------------------------------------------------------
// Utility — cosine similarity
// ------------------------------------------------------------
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}


// ------------------------------------------------------------
// Embed a sentence into a fixed-size dense vector
// The model returns token-level embeddings, so we average pool
// ------------------------------------------------------------
async function embedSentence(text) {
  const out = await embedder(text);
  const values = out.data;
  const dims = out.dims; // [batch, seq_len, embedding_dim]

  const pooled = [];

  // Mean-pool across sequence dimension
  for (let i = 0; i < dims[2]; i++) {
    let sum = 0;
    for (let j = 0; j < dims[1]; j++) {
      sum += values[j * dims[2] + i];
    }
    pooled.push(sum / dims[1]);
  }

  return pooled;
}


// ------------------------------------------------------------
// Main Semantic Intent Detector
// Called when pattern-matching produces no strong result
// ------------------------------------------------------------
export async function detectIntent(sessionObj) {
  const text = sessionObj.userInput;

  console.log("embed");

  // Create embedding for user message
  const userVector = await embedSentence(text);

  let best = { intent: "unknown", score: -Infinity };

  // Compare against every stored intent embedding
  for (const [name, intent] of Object.entries(intents)) {

    const score = cosine(userVector, intent.vector);

    if (score > best.score) {
      best = { intent: name, score };
    }
  }

  // Reject low-confidence matches
  if (best.score < 0.8) best.intent = null;

  return {
    intent: best.intent,
    score: Number(best.score.toFixed(2)),
  };
}
