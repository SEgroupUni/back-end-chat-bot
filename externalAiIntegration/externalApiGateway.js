import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

export async function sendToExternalAI(messages) {
    if (!HF_TOKEN) throw new Error("Missing HUGGINGFACE_TOKEN in .env");

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
                messages: messages,
                max_tokens: 2000,
                //temperature: 0.6   Only use this if it starts waffling or saying gibberish
            }),
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`DeepSeek Error: ${resp.status} - ${err}`);
        }

        const data = await resp.json();
        
        console.timeEnd("AI_Speed_Test");

        // Safety check
        if (!data.choices || !data.choices[0]) return "Error: No AI response.";

        let reply = data.choices[0].message.content;
        
        // Remove <think> tags 
        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        return reply;

    } catch (error) {
        console.error("External API Client Error:", error);
        throw error; 
    }
}