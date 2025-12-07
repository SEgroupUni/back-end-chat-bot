import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

export async function sendToExternalAI(messages) {

    // ------------------------------
    // ENVIRONMENT TOKEN CHECK
    // ------------------------------
    if (!HF_TOKEN) {
        console.error("[SEND_TO_AI][FATAL] Missing HUGGINGFACE_TOKEN in .env");
        return {
            ok: false,
            error: "Missing HUGGINGFACE_TOKEN"  // KEEP UNIQUE
        };
    }

    try {
        console.time("AI_Speed_Test");

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
        // NON-200 HTTP STATUS
        // ------------------------------
        if (!resp.ok) {
            const err = await resp.text();
            console.error("[SEND_TO_AI][HTTP_ERROR]", resp.status, err);
            return {
                ok: false,
                error: "HF_HTTP_ERROR"  // STANDARDISED
            };
        }

        // ------------------------------
        // PARSE JSON RESPONSE
        // ------------------------------
        const data = await resp.json();
        console.timeEnd("AI_Speed_Test");

        if (!data.choices?.[0]?.message?.content) {
            console.error("[SEND_TO_AI][NO_CONTENT]", data);
            return {
                ok: false,
                error: "HF_NO_CONTENT"  // STANDARDISED
            };
        }

        let reply = data.choices[0].message.content;

        // Clean <think> blocks
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        // ------------------------------
        // TRY PARSING JSON
        // ------------------------------
        let json = null;
        try {
            json = JSON.parse(reply);
        } catch {
            console.warn("[SEND_TO_AI][JSON_PARSE_FAIL] Raw reply:", reply);

            // Remove code fences
            reply = reply.replace(/```json|```/g, "").trim();

            try {
                json = JSON.parse(reply);
            } catch {
                console.error("[SEND_TO_AI][INVALID_JSON]", reply);
                return {
                    ok: false,
                    error: "HF_INVALID_JSON"  // STANDARDISED
                };
            }
        }

        // ------------------------------
        // SUCCESS
        // ------------------------------
        return {
            ok: true,
            json,
            raw: reply
        };

    } catch (error) {

        // ------------------------------
        // NETWORK ERRORS
        // ------------------------------
        console.error("[SEND_TO_AI][EXCEPTION_CAUGHT]", error);
        return {
            ok: false,
            error: "HF_NETWORK_ERROR"  // STANDARDISED
        };
    }
}
