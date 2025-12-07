// semanticGroupIntents.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "../../intentData/intents.json");

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
  const matrix = subset.map(i => i.transition_scores);

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

  // ---- NEW: extract last 5 intents ----
  const recentIntents = history.map(h => h.intent);

  const scoredIntents = intentVector
    .map((value, index) => {
      const name = intentModel.intents[index];
      const full = intentsData.intents.find(i => i.intent === name);

      return {
        intent: name,
        score: value * semanticDecay,
        promptMsg: full.msgPrompt ?? null
      };
    })
    // exclude the starting intent
    .filter(item => item.intent !== intentName)

    //  remove any intent that appears in the last 5 turns ----
    .filter(item => !recentIntents.includes(item.intent))

    .sort((a, b) => b.score - a.score);

  if (!scoredIntents.length || scoredIntents[0].score <= 0.2) {
    return null;
  }

  return scoredIntents[0] || null;
}

// // ------------------------------------------------------------
// // LIMITED TEST SUITE — daily_life ONLY
// // ------------------------------------------------------------

// // Simple output helper
// function print(label, result) {
//   console.log(`\n--- ${label} ---`);
//   console.log(result);
// }

// const dailyLifeIntents = [
//   "lifestyle_habits",
//   "typical_wardrobe",
//   "foods_commonly_eaten",
//   "daily_routine",
//   "administrative_duties",
//   "leisure_activities"
// ];

// // console.log("\n===== LIMITED SEMANTIC MODEL TEST SUITE (daily_life only) =====");

// // // ------------------------------------------------------------
// // // TEST 1 — Starting from lifestyle_habits, propose next intent
// // // ------------------------------------------------------------
// // print(
// //   "Test 1: daily_life transition",
// //   semInnerModel("lifestyle_habits", [])
// // );

// // // ------------------------------------------------------------
// // // TEST 2 — Ensure last 5 daily_life intents are removed from scoring
// // // ------------------------------------------------------------
// // const lastFive = dailyLifeIntents.slice(0, 5).map(intent => ({ intent }));

// // print(
// //   "Test 2: remove last 5 daily_life intents",
// //   semInnerModel("lifestyle_habits", lastFive)
// // );

// // // ------------------------------------------------------------
// // // TEST 3 — All candidates removed → should return null
// // // ------------------------------------------------------------
// // const heavyHistory = dailyLifeIntents.map(intent => ({ intent }));

// // print(
// //   "Test 3: all daily_life intents in history (expect null)",
// //   semInnerModel("lifestyle_habits", heavyHistory)
// // );

// // console.log("\n===== END LIMITED TESTS =====\n");







