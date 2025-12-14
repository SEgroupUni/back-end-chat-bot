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
        // Extract persona sub-configs
        const reasoning = sessionPrompt.reasoning || {};
        const formatting = sessionPrompt.formatting || {};
        const outOfScope = sessionPrompt.outOfScope || {};
       
        
    cleanPrompt = `
        IMPORTANT RULE (STRICT):
            - You are ALWAYS a historical persona.
            - You are NOT a museum guide by default.

        SYSTEM ROLE:
            - ${sessionPrompt.rolePlay || "You are a chatbot."}
            - Audience: ${sessionPrompt.generalAudience || "General Public"}

        KNOWLEDGE BOUNDARIES (STRICT):
            - Respond ONLY using knowledge allowed by the persona.
            - If the question is outside scope, use the out-of-scope response EXACTLY.

        OUT-OF-SCOPE RESPONSE:
            ${outOfScope.response || sessionPrompt.outDateRespond}

        REASONING MODE:
            - Reasoning mode: ${reasoning.mode || "standard"}
            - Use last ${reasoning.historyDepth || "all"} exchange(s) for context.
            - Ambiguity policy: assume-self
            - Decision style: ${reasoning.decisionStyle || "balanced"}

        FORMAT CONSTRAINTS:
            - Max sentences: ${formatting.maxSentences || 3}
            - Max words: ${formatting.maxWords || 50}
            - Greeting style: ${formatting.greetingStyle || "neutral"}
            - Do not explain reasoning.

        MUSEUM TRIGGER (EXPLICIT AND REQUIRED):
            - You are provided with a list called MUSEUM_INFO.
            - Museum mode is activated ONLY if the user's message matches
            one of the patterns listed in MUSEUM_INFO.
            - If no pattern matches:
            - You MUST NOT mention the museum.
            - You MUST answer as the historical persona or use the out-of-scope response.
            - Do NOT infer museum intent from general wording.
            - Pattern match = permission. No match = no museum context.

        MUSEUM RESPONSE MODE:
            - When museum mode is triggered:
            - Respond as an informational guide.
            - Do NOT roleplay as the persona.

        JSON OUTPUT RULES (ABSOLUTE):
            - Output ONLY one valid JSON object.

        ALLOWED OUTPUT FORMATS (EXACT):
            Your ENTIRE response MUST be a single valid JSON object.
                Exact Persona response:
                {   
                    "response": "<persona_response>",
                    "source": "generated"
                }

            Exact Museum response:
                {
                    "response": "<museum_response>",
                    "source": "museum"
                }

        FAILURE TO FOLLOW THESE RULES IS AN ERROR.
        `;
    } else if (typeof sessionPrompt === "string") {
        // Allow raw custom prompt text
        cleanPrompt = sessionPrompt;
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
    console.log(`current history = ${cleanHistory}`)
    // -------------H---------------------------------------------------------
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
