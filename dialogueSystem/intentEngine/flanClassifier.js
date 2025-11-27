import { pipeline } from "@huggingface/transformers";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const intentsData = require("../../intentData/intents.json");

let classifier = null;  // <-- must be let, not const

// Load model once into memory
export async function loadFlan() {
    if (!classifier) {
       classifier = await pipeline(
        "text2text-generation",
        "Xenova/flan-t5-small",
        { dtype: "fp32" }  // explicitly set to remove warnings
    );
        console.log("FLAN-T5 loaded and ready.");
    }
}

// Classify using FLAN-T5 locally
export async function flanClassifier(userInput) {

    await loadFlan(); // <-- ensure model is loaded before use

    const intentLabels = intentsData.intents.map(item => item.intent);
    intentLabels.push("unknown");

    const prompt = `
Classify the user message into one intent and also provide a confidence score between 0 and 1.

Respond in this exact format:

intent: <label>
confidence: <number>

Intents:
${intentLabels.join("\n")}

Message: "${userInput}"
`;

    const output = await classifier(prompt, { max_new_tokens: 20 });

    const raw = output[0].generated_text.trim().toLowerCase();
    const lines = raw.split("\n");

    const intent = lines.find(l => l.includes("intent"))?.split(":")[1]?.trim() ?? "unknown";
    const confidence = parseFloat(lines.find(l => l.includes("confidence"))?.split(":")[1]) || 0;

    return {
        intent: intentLabels.includes(intent) ? intent : "unknown",
        confidence
    };
}
