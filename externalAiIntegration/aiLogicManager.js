import pkg from "synonyms/dictionary.js";
const { mess } = pkg;
import { sendToExternalAI } from "./externalApiGateway.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only museum info now
const museumInfoPath = path.join(__dirname, "../intentData/museumInfo.json");

const museumInfo = JSON.parse(
  fs.readFileSync(museumInfoPath, "utf8")
);

export async function processAiLogic(messageEnvelope, sessionPrompt) {
    
    // --- BUILD SYSTEM PROMPT ---
    let cleanPrompt = "You are a chatbot.";

    if (typeof sessionPrompt === "object") {
        cleanPrompt = `
        SYSTEM INSTRUCTIONS:
            1. Role: ${sessionPrompt.rolePlay || "Chatbot"}
            2. Audience: ${sessionPrompt.generalAudience || "General Public"}
            3. Constraints: ${sessionPrompt.expected || "None"}

        STRICT FORMATTING RULES:
            - ${sessionPrompt.lengthConstraint || "Max 50 words."}
            - ABSOLUTE LIMIT: Do not exceed 50 words.
            - Stop after 2 or 3 sentences.
            - Never write long paragraphs.
            - Greetings must be short.
            - Simple answers must stay simple.

        ROUTING LOGIC (MANDATORY):
            1. Check the MUSEUM_INFO list.
               If the user message matches anything in the list:
               Return ONLY:
               {
                 "response": "<museum_response>",
                 "source": "museum"
               }

            2. If no match:
               Generate a persona-correct reply and return ONLY:
               {
                 "response": "<generated_reply>",
                 "source": "generated"
               }

        CRITICAL JSON OUTPUT RULES:
        - You MUST output ONLY valid JSON.
        - You MUST NOT write natural language outside JSON.
        - If you want to output text, it must be inside the "response" field.
        - Never wrap JSON in code fences.
        - Never return multiple JSON objects.
        - If you cannot determine a match, return:
        {
        "response": null,
        "source": "generated"
        }
        IF YOUR OUTPUT IS NOT VALID JSON, YOU ARE IN ERROR.
        `;
    } else if (typeof sessionPrompt === "string") {
        cleanPrompt = sessionPrompt;
    }


    // --- CLEAN HISTORY ---
    let cleanHistory = [];

    try {
        let rawHistory = messageEnvelope.history;

        if (typeof rawHistory === "string") {
            rawHistory = JSON.parse(rawHistory);
        }

        if (Array.isArray(rawHistory)) {
            for (const entry of rawHistory) {
                if (!entry || typeof entry !== "object") continue;

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
        console.warn("[AI Logic] Failed to parse history:", err);

        messageEnvelope.error = true;
        messageEnvelope.errorMsg = "History parsing failed.";
        messageEnvelope.flagState = "error";
        return messageEnvelope;
    }


    // --- LLM MESSAGE PAYLOAD ---
    const messages = [
        { role: "system", content: cleanPrompt },
        {
            role: "system",
            content: `MUSEUM_INFO:\n${JSON.stringify(museumInfo)}`
        },
        ...cleanHistory,
        { role: "user", content: String(messageEnvelope.userInput) }
    ];

    console.log("[AI Logic] Sending request to LLM...");


    // --- SEND TO LLM (ONLY ONCE) ---
    const result = await sendToExternalAI(messages);


    // --- HANDLE FAILURE ---
    if (!result.ok) {
        messageEnvelope.response = null;
        messageEnvelope.source = null;
        messageEnvelope.error = true;
        messageEnvelope.errorMsg = result.error;
        messageEnvelope.rawAIResponse = result.raw || null;
        messageEnvelope.flagState = "error";
        messageEnvelope.componentUsed = "External LLM";
        return messageEnvelope;
    }


    // --- HANDLE SUCCESS ---
    messageEnvelope.response = result.json.response;
    messageEnvelope.source = result.json.source;
    messageEnvelope.error = false;
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.componentUsed = "External LLM";

    return messageEnvelope;
}
