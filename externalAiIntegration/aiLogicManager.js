import pkg from "synonyms/dictionary.js";
const { mess } = pkg;
import { sendToExternalAI } from "./externalApiGateway.js";

export async function processAiLogic(messageEnvelope, sessionPrompt) {
    
    let cleanPrompt = "You are a chatbot.";

    if (typeof sessionPrompt === 'object') {
        cleanPrompt = `
        SYSTEM INSTRUCTIONS:
        1. Role: ${sessionPrompt.rolePlay || "Chatbot"}
        2. Audience: ${sessionPrompt.generalAudience || "General Public"}
        3. Constraints: ${sessionPrompt.expected || "None"}
        
        STRICT FORMATTING RULES:
        - ${sessionPrompt.lengthConstraint || "Max 40 words."}
        - ABSOLUTE LIMIT: Do not exceed 40 words.
        - Stop immediately after 2 or 3 sentences.
        - Never write long paragraphs.
        - Greetings and farewells must be no longer than 2 short sentences (maximum 2 lines).
        - When asked a simple question, DO NOT add unnecessary details
        `;
    }
    else if (typeof sessionPrompt === 'string') {
            cleanPrompt = sessionPrompt;
    }

    // --- CLEAN HISTORY ---
let cleanHistory = [];

try {
    let rawHistory = messageEnvelope.history;

    // Parse if stored as JSON string
    if (typeof rawHistory === 'string') {
        rawHistory = JSON.parse(rawHistory);
    }

    // Convert stored history into LLM-friendly structure
    if (Array.isArray(rawHistory)) {
        for (const entry of rawHistory) {
            if (entry.userInput?.trim()) {
                cleanHistory.push({
                    role: "user",
                    content: entry.userInput.trim()
                });
            }

            if (entry.response?.trim()) {
                cleanHistory.push({
                    role: "assistant",
                    content: entry.response.trim()
                });
            }
        }
    }

} catch (err) {
    console.warn("[AI Logic] Could not parse history. Ignoring context.", err);
}

// --- FINAL MESSAGE PAYLOAD SENT TO MODEL ---
const messages = [
    { role: "system", content: cleanPrompt },
    ...cleanHistory,
    { role: "user", content: String(messageEnvelope.userInput) }
];

    console.log("[AI Logic] Sending request to API...");

    // Call External API
    const rawResponse = await sendToExternalAI(messages);

    // PARSE RESPONSE 
    let finalReply = rawResponse.replace(/^"|"$/g, '').trim();

if (finalReply.includes("```json")) {
        try {
            const cleanJson = finalReply.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            finalReply = parsed.reply || parsed.message || finalReply;
        } catch (e) {
            // Ignore parse error, use text
        }
    }

    // Always update envelope no matter what
    messageEnvelope.response = finalReply;
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.error = false;
    messageEnvelope.componentUsed = 'External LLM';

    console.log ("Envolope Updated. Flag set to frontFlow");
    return messageEnvelope;
}