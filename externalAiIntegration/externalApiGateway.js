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
            error: "Missing HUGGINGFACE_TOKEN in .env"
        };
    }

    try {
        console.time("AI_Speed_Test");

        // ------------------------------
        // SEND REQUEST TO HUGGINGFACE
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
        // NON-200 HTTP STATUS
        // ------------------------------
        if (!resp.ok) {
            const err = await resp.text();
            console.error("[SEND_TO_AI][HTTP_ERROR]", resp.status, err);
            return {
                ok: false,
                error: `HTTP Error: ${resp.status} - ${err}`
            };
        }

        // ------------------------------
        // PARSE JSON RESPONSE
        // ------------------------------
        const data = await resp.json();
        console.timeEnd("AI_Speed_Test");

        // ------------------------------
        // LLM RETURNED NO OUTPUT
        // ------------------------------
        if (!data.choices?.[0]?.message?.content) {
            console.error("[SEND_TO_AI][NO_CONTENT] Model returned no content.", data);
            return {
                ok: false,
                error: "No AI content returned."
            };
        }

        let reply = data.choices[0].message.content;

        // Clean <think> blocks
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();


        // ------------------------------
        // TRY PARSING JSON NORMALLY
        // ------------------------------
        let json = null;
        try {
            json = JSON.parse(reply);
        } catch (e1) {
            console.warn("[SEND_TO_AI][JSON_PARSE_FAIL] Raw reply:", reply);

            // Try removing ```json fences
            reply = reply.replace(/```json|```/g, "").trim();

            try {
                json = JSON.parse(reply);
            } catch (e2) {
                console.error("[SEND_TO_AI][INVALID_JSON]", reply, e2);
                return {
                    ok: false,
                    raw: reply,
                    error: "Invalid JSON returned by LLM"
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
        // NETWORK / FETCH / ROUTER ERRORS
        // ------------------------------
        console.error("[SEND_TO_AI][EXCEPTION_CAUGHT]", error);
        return {
            ok: false,
            error: String(error)
        };
    }
}
