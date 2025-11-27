import { processAiLogic } from "./aiLogicManager.js";

export async function handleAiRequest(sessionInstance, message) {
    
    if (!message) throw new Error("No message provided to AI Gateway");

    try {
        console.log("[AI Gateway] Processing:", message);

        // Pass to Logic Component
        const response = await processAiLogic(sessionInstance, message);

        return response;

    } catch (error) {
        console.error("[AI Gateway] Failed:", error);
        return "I am having trouble connecting right now.";
    }
}