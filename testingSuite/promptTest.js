import { promptModel } from "../dialogueSystem/dialogueGuide/promptModel.js";

// Helper to print formatted output
function print(label, result) {
  console.log(`\n--- ${label} ---`);
  console.log(result);
}

console.log("\n===== SEMANTIC PROMPT TEST SUITE =====");

// ----------------------------------------------
// TEST 1 — Basic transition suggestion
// ----------------------------------------------
print(
  "Test 1: Suggest next intent from 'lifestyle_habits' (empty history)",
  promptModel("lifestyle_habits", [])
);

// ----------------------------------------------
// TEST 2 — Remove recent intents (recency suppression)
// ----------------------------------------------
const historyRecent = [
  { intent: "typical_wardrobe" },
  { intent: "foods_commonly_eaten" },
  { intent: "daily_routine" }
];

print(
  "Test 2: Recency suppression removes last 3 intents",
  promptModel("lifestyle_habits", historyRecent)
);

// ----------------------------------------------
// TEST 3 — All semantic intents in history → no prompt (should return null)
// ----------------------------------------------
const fullHistory = [
  { intent: "lifestyle_habits" },
  { intent: "typical_wardrobe" },
  { intent: "foods_commonly_eaten" },
  { intent: "daily_routine" },
  { intent: "administrative_duties" },
  { intent: "leisure_activities" }
];

print(
  "Test 3: All intents exhausted (expect null)",
  promptModel("lifestyle_habits", fullHistory)
);

// ----------------------------------------------
// TEST 4 — Check semantic decay reduces deep repetition
// ----------------------------------------------
const deepHistory = [
  { intent: "lifestyle_habits" },
  { intent: "lifestyle_habits" },
  { intent: "lifestyle_habits" }
];

print(
  "Test 4: Semantic decay from repeated same-field history",
  promptModel("lifestyle_habits", deepHistory)
);

// ----------------------------------------------
// TEST 5 — Invalid intent name should return null
// ----------------------------------------------
print(
  "Test 5: Invalid intent name",
  promptModel("unknown_intent", [])
);

console.log("\n===== END TEST SUITE =====\n");
