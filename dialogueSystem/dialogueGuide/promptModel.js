import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/**
 * promptModel.js
 * ----------------
 * This module determines the next best intent suggestion (prompt) based on:
 *  - semantic grouping,
 *  - transition scores (forming a transition matrix),
 *  - semantic decay (penalises repeated fields),
 *  - recent intent repetition blocking,
 *  - thresholding for relevance.
 *
 * It loads the intents.json dataset, extracts semantic groups,
 * builds a local transition matrix, scores candidate intents,
 * and returns the highest-scoring valid suggestion with its prompt message.
 *
 * All major functions include verification to prevent undefined values
 * from propagating and causing TypeErrors at runtime.
 */


// Resolve file path to intents.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "../../intentData/intents.json");

// Load JSON safely
let intentsData;
try {
  intentsData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(intentsData.intents)) {
    throw new Error(`intents.json is missing an "intents" array.`);
  }
} catch (err) {
  console.error("❌ Failed to load intents.json:", err);
  intentsData = { intents: [] }; // fail-safe fallback
}


/**
 * getSemanticGroupIntents()
 * Returns all intents belonging to the same semantic field.
 * Includes validation to ensure the target intent exists.
 */
function getSemanticGroupIntents(intentName) {
  const target = intentsData.intents.find(i => i.intent === intentName);

  if (!target) {
    console.warn(`⚠ Intent "${intentName}" not found in intents.json`);
    return [];
  }

  return intentsData.intents
    .filter(i => i.semantic_field === target.semantic_field)
    .map(i => i.intent);
}


/**
 * buildModel()
 * Constructs a transition matrix from all intents in a semantic group.
 * Includes validation to ensure all rows have consistent lengths.
 */
function buildModel(semanticIntents) {
  const subset = intentsData.intents.filter(i => semanticIntents.includes(i.intent));

  // Validation — ensure transition_scores exist and match required length
  const expectedLength = semanticIntents.length;

  subset.forEach(i => {
    if (!Array.isArray(i.transition_scores)) {
      console.warn(`⚠ Intent "${i.intent}" missing transition_scores array.`);
      i.transition_scores = new Array(expectedLength).fill(0);
      return;
    }

    if (i.transition_scores.length !== expectedLength) {
      console.warn(
        `⚠ transition_scores length mismatch for "${i.intent}". ` +
        `Expected ${expectedLength}, got ${i.transition_scores.length}. Auto-correcting.`
      );
      // Auto-fix: pad or trim
      i.transition_scores = [
        ...i.transition_scores.slice(0, expectedLength),
        ...new Array(Math.max(0, expectedLength - i.transition_scores.length)).fill(0)
      ];
    }
  });

  return {
    intents: semanticIntents,
    transitionMatrix: subset.map(i => i.transition_scores)
  };
}


/**
 * semanticFieldHistory()
 * Returns a filtered history of intents belonging to the same semantic field.
 * Used to compute semantic decay.
 */
function semanticFieldHistory(intentName, history) {
  if (!Array.isArray(history)) return [];

  const targetIntent = intentsData.intents.find(i => i.intent === intentName);
  if (!targetIntent) {
    console.warn(`⚠ semanticFieldHistory(): Intent "${intentName}" not found.`);
    return [];
  }

  const field = targetIntent.semantic_field;

  return history
    .filter(entry => entry && entry.intent)
    .filter(entry => {
      const match = intentsData.intents.find(i => i.intent === entry.intent);
      return match && match.semantic_field === field;
    })
    .map(entry => entry.intent);
}


/**
 * promptModel()
 * Main scoring and suggestion engine.
 * Steps:
 *  1. Identify semantic group of current intent
 *  2. Build transition matrix
 *  3. Apply semantic decay
 *  4. Score each possible next intent
 *  5. Exclude recently used intents
 *  6. Return best-scoring suggestion above threshold
 */
export function promptModel(intentName, history = []) {

  // Validate inputs
  if (typeof intentName !== "string") {
    console.warn(`⚠ promptModel() received invalid intentName:`, intentName);
    return null;
  }

  const semFieldHistory = semanticFieldHistory(intentName, history);
  const semFieldIntents = getSemanticGroupIntents(intentName);

  if (semFieldIntents.length === 0) return null;

  const intentModel = buildModel(semFieldIntents);
  const currentIndex = intentModel.intents.indexOf(intentName);

  if (currentIndex === -1) {
    console.warn(`⚠ "${intentName}" not found inside its own semantic field list!`);
    return null;
  }

  const intentVector = [...intentModel.transitionMatrix[currentIndex]];

  // Compute decay factor
  const semanticDecay = 1 - (semFieldHistory.length / intentModel.intents.length);
  const squareDecay = semanticDecay *semanticDecay

  // Extract recent intents (all history, but could shorten to last N)
  const recentIntents = history.map(h => h.intent);

  // Score all intents
  const scoredIntents = intentVector
    .map((value, index) => {
      const name = intentModel.intents[index];
      const full = intentsData.intents.find(i => i.intent === name);

      if (!full) {
        console.warn(`⚠ Missing full intent data for "${name}"`);
        return null;
      }

      return {
        intent: name,
        score: value * squareDecay,
        promptMsg: full.msgPrompt ?? null
      };
    })
    .filter(Boolean) // remove nulls

    .filter(item => item.intent !== intentName)

    // Prevent recent repetitive prompts
    .filter(item => !recentIntents.includes(item.intent))

    .sort((a, b) => b.score - a.score);


  // Threshold check
  const best = scoredIntents[0];
  if (!best || best.score <= 0.5) {
    return null;
  }

  return best;
}









