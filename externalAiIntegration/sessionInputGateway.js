import { processAiLogic } from "./aiLogicManager.js";
import { getSession } from "../liveSessionState/sessionState.js";

export async function handleAiRequest(messageEnvelope, sessionPrompt) {
    const session = getSession();

    // === 1 Validation ===
    if (!messageEnvelope?.userInput || !sessionPrompt || !messageEnvelope?.history) {
        
        messageEnvelope.error = true;
        messageEnvelope.flagState = "error";
        messageEnvelope.response =
            "Missing required chatbot data: userInput or sessionPrompt or history.";

        console.warn("[AI Gateway] Rejected payload →", messageEnvelope);

        // Commit error state to session
        session.processSessionObj(messageEnvelope);

        return; // stop execution here
    }

    // === 2 Execute AI Logic ===
    try {
        const tempEnvelope = await processAiLogic(messageEnvelope, sessionPrompt);
        console.log(messageEnvelope)
        session.processSessionObj(tempEnvelope);

    } catch (error) {

        console.error("[AI Gateway] Failed:", error);

        //  fallback in case AI logic fails unexpectedly
        messageEnvelope.error = true;
        messageEnvelope.flagState = "error";
        messageEnvelope.response =
            "AI processing failed — try again soon.";
        
        session.processSessionObj(messageEnvelope);
    }
}


