const messageEnvelope = { intent: "intent_12" };

const semanticIntents = getSemanticGroupIntents(messageEnvelope.intent);


const model = buildModel(semanticIntents);
console.log("Generated model:", model);
// ---- TEST DATA ----
const testHistory = [
  { intent: "intent_3", userInput: "hi" },    // group_1
  { intent: "intent_9", userInput: "reset" }, // group_2 ✔
  { intent: "intent_6", userInput: "help" },  // group_1
  { intent: "intent_12", userInput: "more" }, // group_2 ✔
  { intent: "intent_10", userInput: "yeah" }  // group_2 ✔
];

// ---- RUN ----

console.log("\n--- Running Test ---");

console.log("Current intent:", messageEnvelope.intent);

console.log("\nSemantic intents in same field:");
console.log(semanticIntents);

const relevantHistory = semanticFieldHistory(messageEnvelope.intent, testHistory);

console.log("\nHistory filtered by same semantic field:");
console.log(relevantHistory);

console.log("\nGenerated model for that field:");
console.log(model);

console.log("\n--- END TEST ---");