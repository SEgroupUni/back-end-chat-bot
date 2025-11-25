import { createRequire } from "module";
const require = createRequire(import.meta.url);
const intentsData = require("../../intentData/intents.json");


const classifier = null;
// Load model once into memory
export async function loadFlan() {
    if(!classifier){

        classifier = await pipeline(
            "text2text-generation", 
            "google/flan-t5-base"
        );
        console.log("FLAN-T5 loaded and ready.");
    }
    
}

// Classify using FLAN-T5 locally
export async function flanClassifier(userInput) {
    // Extract user text

    // Extract intent labels from JSON file
    const intentLabels = intentsData.intents.map(item => item.intent);

    // Add fallback category
    intentLabels.push("unknown");

    const prompt = `
    Classify the user message into one intent and also provide a confidence score between 0 and 1.

    Respond in this exact format:

    intent: <label>
    confidence: <number>

    Intents:
    ${intentLabels.join("\n")}

    Message: "${userInput}"
`   ;

    const output = await classifier(prompt, { max_new_tokens: 20 });

    const raw = output[0].generated_text.trim().toLowerCase();

    // ----------- Parse Output -----------
    const lines = raw.split("\n");

    const intentLine = lines.find(l => l.includes("intent"));
    const confidenceLine = lines.find(l => l.includes("confidence"));

    const intent = intentLine?.split(":")[1]?.trim() ?? "unknown";
    const confidence = parseFloat(confidenceLine?.split(":")[1]) || 0;

    return {
        intent: intentLabels.includes(intent) ? intent : "unknown",
        confidence
    };
}


