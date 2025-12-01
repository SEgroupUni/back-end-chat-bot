
import { compositeMatchScore } from "./compositeMatchScore.js";
import checkFullInput from "./checkFullInput.js";
import { createRequire } from "module";
import { detectIntent } from "./detectIntent.js";
const require = createRequire(import.meta.url);
const intentsData = require("../../intentData/intents.json");
const intents = Array.isArray(intentsData.intents) ? intentsData.intents : [];

// ****** Main intent-matching logic ******
export default async function getResponse(messageEnvelope) {

    let bestScore = 0;
    let bestIntent = null;
    let bestResponse = null;
    let componentUsed = null;

    // Ensure input exists (avoids crashing)
    const inputText = messageEnvelope.userInput?.toLowerCase() || "";

    outerLoop:
    for (const intent of intents) {
        for (const pattern of intent.patterns) {

            // 1) Full input similarity check
            const exactScore = checkFullInput(pattern, messageEnvelope);

            // 2) Composite similarity fallback
            const compositeScore = exactScore < 0.75
                ? compositeMatchScore(pattern, inputText)
                : 0;

            const score = Math.max(exactScore, compositeScore);

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent.intent;
                bestResponse = intent.responses[Math.floor(Math.random() * intent.responses.length)];
                componentUsed = exactScore >= 0.63 ? "exact" : "composite";

                if (bestScore === 1.0) break outerLoop;
            }
        }
    }
    // ---- If no pattern-based match, use AI intent detection ----
    if (bestScore === 0) {
        const detected = await detectIntent(messageEnvelope);

    if (detected.intent) {
        bestIntent = detected.intent;
        
        const matched = intents.find(i => i.intent === bestIntent);
        bestResponse = matched
            ? matched.responses[Math.floor(Math.random() * matched.responses.length)]
            : null;

        bestScore = detected.score;
        componentUsed = "semantic-embedding";
    }
}


    // ---- Build final output ----
    messageEnvelope.intent = bestIntent;
    messageEnvelope.response = bestResponse || "Curious, let me consult the priests.";
    messageEnvelope.componentUsed = componentUsed;
    messageEnvelope.score = bestScore;

    return messageEnvelope;
}
