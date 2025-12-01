import { createRequire } from "module";
import { pipeline } from "@xenova/transformers";

const require = createRequire(import.meta.url);
const intents = require("../../intentData/intent_vectors.json");

const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedSentence(text) {
  const out = await embedder(text);
  const values = out.data;
  const dims = out.dims;

  const pooled = [];
  for (let i = 0; i < dims[2]; i++) {
    let sum = 0;
    for (let j = 0; j < dims[1]; j++) {
      sum += values[j * dims[2] + i];
    }
    pooled.push(sum / dims[1]);
  }

  return pooled;
}

export async function detectIntent(sessionObj) {
  const text = sessionObj.userInput;
  console.log("embed")
  const userVector = await embedSentence(text);

  let best = { intent: "unknown", score: -Infinity };

  for (const [name, intent] of Object.entries(intents)) {
    const score = cosine(userVector, intent.vector);
    if (score > best.score) {
      best = { intent: name, score };
    }
  }

  if (best.score < 0.6) best.intent = null;

  return {
    intent: best.intent,
    score: Number(best.score.toFixed(2)),
  };
}