// semanticGroupIntents.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "../../intentData/testIntents.json");

// Load JSON
const intentsData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));


// Get intents from same semantic group ----
function getSemanticGroupIntents(intentName) {

  const target = intentsData.intents.find(i => i.intent === intentName);

  if (!target) {
    console.warn(`Intent "${intentName}" not found.`);
    return [];
  }

  return intentsData.intents
    .filter(i => i.semantic_field === target.semantic_field)
    .map(i => i.intent);
}



// Build transistion matrix of relvent semantic field
function buildModel(semanticIntents) {

  // Filter to only full intent objects matching the list
  const subset = intentsData.intents.filter(i => semanticIntents.includes(i.intent));

  // Build matrix based on stored scores
  const matrix = subset.map(i => i.score);

  return {
    intents: semanticIntents,
    transitionMatrix: matrix
  };
}


// returns semantic history array for decay calculation
function semanticFieldHistory(intentName, history) {

  // Ensure history exists and is an array
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Find semantic field for the current intent
  const targetIntent = intentsData.intents.find(i => i.intent === intentName);

  if (!targetIntent) {
    console.warn(`Intent "${intentName}" not found in intent model.`);
    return [];
  }

  const targetField = targetIntent.semantic_field;

  // Filter: keep only entries matching semantic field
  const matchingHistory = history
    .filter(entry => entry.intent) // ensure valid structure
    .filter(entry => {
      const record = intentsData.intents.find(i => i.intent === entry.intent);
      return record && record.semantic_field === targetField;
    })
    .map(entry => entry.intent);

  return matchingHistory;
}



export function semInnerModel(intentName, history) {
  const topN = 1;

  const semFieldHistory = semanticFieldHistory(intentName, history);
  const semFieldIntents = getSemanticGroupIntents(intentName);

  if (semFieldIntents.length === 0) return null;

  const intentModel = buildModel(semFieldIntents);
  const currentIndex = intentModel.intents.indexOf(intentName);
  if (currentIndex === -1) return null;

  const intentVector = [...intentModel.transitionMatrix[currentIndex]];

  const semanticDecay = 1 - (semFieldHistory.length / intentModel.intents.length);

  const scoredIntents = intentVector
    .map((value, index) => {
      const name = intentModel.intents[index];
      const full = intentsData.intents.find(i => i.intent === name);

      return {
        intent: name,
        score: value * semanticDecay,
        promptMsg: full?.promptMsg || null
      };
    })
    .filter(item => item.intent !== intentName)
    .sort((a, b) => b.score - a.score);

  if (!scoredIntents.length || scoredIntents[0].score <= 0.2) {
    return null;
  }

  return scoredIntents[0] || null; // <-- single object or null
}

// ---- TEST SUITE: STARTING INTENT = "greeting" ----

// helper for readable output
// function print(label, result) {
//   console.log(`\n--- ${label} ---`);
//   console.log(result);
// }

// const startIntent = "greeting";

// const history1 = [
//   { intent: "intent_2" },   // same semantic group
//   { intent: "intent_4" },   // same semantic group
//   { intent: "intent_6" },   // same semantic group
//   { intent: "intent_12" },  // different semantic group
//   { intent: "intent_1" }    // same semantic group
// ];

// const history2 = [
//   { intent: "intent_12" },
//   { intent: "intent_8" },
//   { intent: "intent_9" }
// ]; // no matching category for greeting

// const history3 = [
//   { intent: "greeting" },
//   { intent: "greeting" },
//   { intent: "intent_1" },
//   { intent: "greeting" },
//   { intent: "intent_5" }
// ]; // high repetition decay case

// const history4 = []; // empty conversation history

// console.log("\n===== SEMANTIC MODEL TESTS (intent: greeting) =====");

// print(
//   "Case 1: Normal matching semantic history",
//   semInnerModel(startIntent, history1)
// );

// print(
//   "Case 2: No matching semantic field",
//   semInnerModel(startIntent, history2)
// );

// print(
//   "Case 3: Heavy repetition (decay may remove prediction)",
//   semInnerModel(startIntent, history3)
// );

// print(
//   "Case 4: No prior conversation",
//   semInnerModel(startIntent, history4)
// );

// print(
//   "Case 5: Invalid starting intent",
//   semInnerModel("not_an_intent", history1)
// );

// console.log("\n===== END TESTS =====\n");




