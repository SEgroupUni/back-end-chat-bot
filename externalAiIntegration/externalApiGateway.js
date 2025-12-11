import fetch from "node-fetch";
import dotenv from "dotenv";

/**
 * sendToExternalAI(messages)
 * ------------------------------------------------------------
 * This module sends chat-style messages to the HuggingFace
 * inference router and enforces strict JSON response handling.
 *
 * Responsibilities:
 *  - Perform authenticated POST request to HF router.
 *  - Handle non-200 HTTP errors safely.
 *  - Strip <think> blocks from DeepSeek / R1 style models.
 *  - Parse returned JSON safely with fallback sanitisation.
 *  - Return standardized "ok / error" objects so the rest of
 *    the pipeline never crashes due to malformed LLM output.
 *
 
 *
 * The API wrapper NEVER throws an exception. Errors always
 * return a standardized object for error handler.
 * 
 * ------------------------------------------------------------
 */


dotenv.config();

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

export async function sendToExternalAI(messages) {

    // ------------------------------
    // Ensure API key exists in environment
    // ------------------------------
    if (!HF_TOKEN) {
        console.error("[SEND_TO_AI][FATAL] Missing HUGGINGFACE_TOKEN in .env");
        return {
            ok: false,
            error: "Missing_HUGGINGFACE_TOKEN"
        };
    }

    try {
        console.time("AI_Speed_Test");

        // ------------------------------
        // Perform the actual POST request
        // ------------------------------
        const resp = await fetch(HF_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
                "x-wait-for-model": "true"
            },
            body: JSON.stringify({
                model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
                messages,
                max_tokens: 2000,
            }),
        });

        // ------------------------------
        // Handle HTTP Failure (400–599)
        // ------------------------------
        if (!resp.ok) {
            const err = await resp.text();
            console.error("[SEND_TO_AI][HTTP_ERROR]", resp.status, err);
            return {
                ok: false,
                error: "HF_HTTP_ERROR"
            };
        }

        // ------------------------------
        // Parse JSON Body
        // ------------------------------
        const data = await resp.json();
        console.timeEnd("AI_Speed_Test");

        if (!data.choices?.[0]?.message?.content) {
            console.error("[SEND_TO_AI][NO_CONTENT]", data);
            return {
                ok: false,
                error: "HF_NO_CONTENT"
            };
        }

        let reply = data.choices[0].message.content;

        // ------------------------------
        // Remove <think> blocks (DeepSeek / R1)
        // ------------------------------
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        // ------------------------------
        // Try parsing JSON directly
        // ------------------------------
        let json = null;
        try {
            json = JSON.parse(reply);
        } catch {
            console.warn("[SEND_TO_AI][JSON_PARSE_FAIL] Raw reply:", reply);

            // Remove common code fences the model may output
            reply = reply.replace(/```json|```/g, "").trim();

            try {
                json = JSON.parse(reply);
            } catch {
                console.error("[SEND_TO_AI][INVALID_JSON]", reply);
                return {
                    ok: false,
                    error: "HF_INVALID_JSON"
                };
            }
        }

        // ------------------------------
        // Successful, well-formed JSON
        // ------------------------------
        return {
            ok: true,
            json,
            raw: reply
        };

    } catch (error) {

        // ------------------------------
        // Network/Fetch Failure
        // ------------------------------
        console.error("[SEND_TO_AI][EXCEPTION_CAUGHT]", error);
        return {
            ok: false,
            error: "HF_NETWORK_ERROR"
        };
    }
}
