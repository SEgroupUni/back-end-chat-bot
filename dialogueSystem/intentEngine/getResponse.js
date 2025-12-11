import { compositeMatchScore } from "./compositeMatchScore.js";
import checkFullInput from "./checkFullInput.js";
import { createRequire } from "module";
import { detectIntent } from "./vectorIntentClassifier.js";
/**
 * getResponse()
 * ------------------------------------------------------------
 * Main intent-matching engine.
 *
 * Responsibilities:
 * 1. Perform layered intent classification:
 *      - Exact pattern match
 *      - Composite fuzzy similarity
 *      - Semantic embedding fallback
 *
 * 2. Select the most appropriate intent + response.
 *
 * 3. Handle special conversational logic (e.g., “yes” follow-up).
 *
 * 4. Inject result fields back into the messageEnvelope:
 *      - intent
 *      - response
 *      - score
 *      - componentUsed
 *
 * It is purely deterministic intent matching.
 */



const require = createRequire(import.meta.url);
const intentsData = require("../../intentData/intents.json");

// Safeguard: ensure we have an array
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
    // 1) PATTERN-MATCH LAYER  
    //    - exact matching (preferred)
    //    - composite similarity (fallback for partial matches)
    // --------------------------------------------------------
    outerLoop:
    for (const intent of intents) {
        for (const pattern of intent.patterns) {

            // Attempt strict equality / strong similarity
            const exactScore = checkFullInput(pattern, messageEnvelope);

            // If not a strong exact match, try fuzzy similarity
            const compositeScore =
                exactScore < 0.75 ? compositeMatchScore(pattern, inputText) : 0;

            const score = Math.max(exactScore, compositeScore);

            // Track best-scoring match
            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent.intent;

                // Random response for variety
                bestResponse =
                    intent.responses[Math.floor(Math.random() * intent.responses.length)];

                componentUsed = exactScore >= 0.63 ? "exact" : "composite";

                // Perfect match — early exit
                if (bestScore === 1.0) break outerLoop;
            }
        }
    }


    // --------------------------------------------------------
    // 2) SEMANTIC EMBEDDING BACKUP  
    //    Only used if literal pattern matching fails entirely
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
    //    This triggers continuation of the last prompted intent.
    // --------------------------------------------------------
    if (bestIntent === "yes") {
        const last = messageEnvelope.history?.length
            ? messageEnvelope.history[messageEnvelope.history.length - 1]
            : null;

        // If the last turn included a recommended follow-up intent
        if (last?.promptIntent) {

            const continuedIntentName = last.promptIntent;
            const continuedIntent = intents.find(i => i.intent === continuedIntentName);

            if (continuedIntent) {

                // Replace user input with the intent's first pattern
                const firstPattern = continuedIntent.patterns[0];
                if (firstPattern) {
                    messageEnvelope.userInput = firstPattern;
                }

                // Continue the narrative thread
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
    // 4) FINALIZE RESULT
    // --------------------------------------------------------
    messageEnvelope.intent = bestIntent;
    messageEnvelope.response = bestResponse || "Curious, let me consult the priests.";
    messageEnvelope.componentUsed = componentUsed;
    messageEnvelope.score = bestScore;

    return messageEnvelope;
}
