import { compositeMatchScore } from "./compositeMatchScore.js";
import checkFullInput from "./checkFullInput.js";
import { createRequire } from "module";
import { detectIntent } from "./detectIntent.js";

const require = createRequire(import.meta.url);
const intentsData = require("../../intentData/intents.json");
const intents = Array.isArray(intentsData.intents) ? intentsData.intents : [];

// ------------------------------------------------------------
// MAIN INTENT-MATCH FUNCTION
// ------------------------------------------------------------
export default async function getResponse(messageEnvelope) {
    let bestScore = 0;
    let bestIntent = null;
    let bestResponse = null;
    let componentUsed = null;

    const inputText = messageEnvelope.userInput?.toLowerCase() || "";

    // --------------------------------------------------------
    // 1) PATTERN-MATCH SEARCH (exact + composite similarity)
    // --------------------------------------------------------
    outerLoop:
    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            const exactScore = checkFullInput(pattern, messageEnvelope);
            const compositeScore =
                exactScore < 0.75 ? compositeMatchScore(pattern, inputText) : 0;

            const score = Math.max(exactScore, compositeScore);

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent.intent;
                bestResponse =
                    intent.responses[Math.floor(Math.random() * intent.responses.length)];
                componentUsed = exactScore >= 0.63 ? "exact" : "composite";

                if (bestScore === 1.0) break outerLoop;
            }
        }
    }

    // --------------------------------------------------------
    // 2) SEMANTIC EMBEDDING BACKUP
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // 3) SPECIAL CASE: USER SAID “YES”
    // --------------------------------------------------------
    if (bestIntent === "yes") {
        const last = messageEnvelope.history?.length
            ? messageEnvelope.history[messageEnvelope.history.length - 1]
            : null;

    if (last?.promptIntent) {
        const continuedIntentName = last.promptIntent;
        const continuedIntent = intents.find(i => i.intent === continuedIntentName);

        if (continuedIntent) {
            const firstPattern = continuedIntent.patterns[0];

            if (firstPattern) {
                messageEnvelope.userInput = firstPattern;
            }

            bestIntent = continuedIntent.intent;
            bestResponse =
                continuedIntent.responses[
                    Math.floor(Math.random() * continuedIntent.responses.length)
                ];

            componentUsed = "yes-followup";
        }
    }
}

    // --------------------------------------------------------
    // FINAL ASSEMBLY
    // --------------------------------------------------------
    messageEnvelope.intent = bestIntent;
    messageEnvelope.response = bestResponse || "Curious, let me consult the priests.";
    messageEnvelope.componentUsed = componentUsed;
    messageEnvelope.score = bestScore;

    return messageEnvelope;
}
