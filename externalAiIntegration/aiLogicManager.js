import { sendToExternalAI } from "./externalApiGateway.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * processAiLogic(messageEnvelope, sessionPrompt)
 *
 * This module sends user + history context to the external LLM
 * and returns a validated JSON response. It supports:
 *
 *  - Persona-based system instructions (role, constraints, etc.)
 *  - Strict JSON-only responses
 *  - Museum dataset routing
 *  - History-aware interpretation of vague messages
 
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load museum pattern/response dataset
const museumInfoPath = path.join(__dirname, "../intentData/museumInfo.json");
const museumInfo = JSON.parse(fs.readFileSync(museumInfoPath, "utf8"));


// ---------------------------------------------------------------------------
// MAIN LOGIC
// ---------------------------------------------------------------------------
export async function processAiLogic(messageEnvelope, sessionPrompt) {

    // -----------------------------------------------------------------------
    // BUILD SYSTEM PROMPT (Persona + Formatting Rules + Routing + JSON Rules)
    // -----------------------------------------------------------------------
    let cleanPrompt = "You are a chatbot.";

    if (typeof sessionPrompt === "object") {

        cleanPrompt = `
        SYSTEM INSTRUCTIONS:
            1. Role: ${sessionPrompt.rolePlay || "Chatbot"}
            2. Audience: ${sessionPrompt.generalAudience || "General Public"}
            3. Constraints: ${sessionPrompt.expected || "None"}
            4. Response : ${sessionPrompt.outDateRespond}

        STRICT FORMATTING RULES:
            - ${sessionPrompt.lengthConstraint || "Max 50 words."}
            - ABSOLUTE LIMIT: Do not exceed 50 words.
            - Stop after 2 or 3 sentences.
            - Never write long paragraphs.
            - Greetings must be short.
            - Simple answers must stay simple.

        CONTEXT RULES (MANDATORY):
            - You MUST always use the conversation history to determine user intent.
            - If the user's message is vague (e.g., "yah", "yes", "ok", "right", "hm", "lol"),
              treat it as a continuation or confirmation of the previous topic.
            - Do NOT ask for clarification unless the history genuinely provides no clues.

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
        cleanPrompt = sessionPrompt; // Allow raw custom prompt text
    }


    // -----------------------------------------------------------------------
    // CLEAN HISTORY FOR LLM INPUT (convert to message objects)
    // -----------------------------------------------------------------------
    let cleanHistory = [];

    try {
        let rawHistory = messageEnvelope.history;

        // If stored as string, parse it
        if (typeof rawHistory === "string") {
            rawHistory = JSON.parse(rawHistory);
        }

        // Convert internal history entries → LLM conversation format
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
        messageEnvelope.errMsg = "History parsing failed.";
        messageEnvelope.flagState = "error";
        return messageEnvelope;
    }


    // -----------------------------------------------------------------------
    // BUILD MESSAGE PAYLOAD FOR LLM
    // -----------------------------------------------------------------------
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


    // -----------------------------------------------------------------------
    // SEND REQUEST TO EXTERNAL API
    // -----------------------------------------------------------------------
    const result = await sendToExternalAI(messages);


    // -----------------------------------------------------------------------
    // HANDLE FAILURE FROM API GATEWAY
    // -----------------------------------------------------------------------
    if (!result.ok) {
        messageEnvelope.error = true;
        messageEnvelope.errMsg = result.error;
        messageEnvelope.flagState = "error";
        messageEnvelope.componentUsed = "External LLM";
        return messageEnvelope;
    }


    // -----------------------------------------------------------------------
    // SUCCESS — APPLY AI RESPONSE BACK INTO ENVELOPE
    // -----------------------------------------------------------------------
    messageEnvelope.response = result.json.response;
    messageEnvelope.error = false;
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.componentUsed = "External LLM";

    return messageEnvelope;
}
