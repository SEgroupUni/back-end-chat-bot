import { processAiLogic } from "./aiLogicManager.js";
import { getSession } from "../liveSessionState/sessionState.js";

export async function handleAiRequest(messageEnvelope, sessionPrompt) {
    const session = getSession();

    // Validation 
    if (!messageEnvelope?.userInput) {
        console.warn("[AI Gateway] Missing userInput.");

        // Pass error back to system
        messageEnvelope.error = true;
        messageEnvelope.flagState = "error";
        messageEnvelope.response = "Error: Missing user input.";
        
        if(session) session.processSessionObj(messageEnvelope);
        return; 
    }

    // Execute AI Logic 
    try {
        await processAiLogic(messageEnvelope, sessionPrompt);
        if(session) session.processSessionObj(messageEnvelope);

    } catch (error) {

        console.error("[AI Gateway] Failed:", error.message);

        //  Fallback in case AI logic fails unexpectedly
        messageEnvelope.error = true;
        messageEnvelope.flagState = "error";
        
        messageEnvelope.response = `AI Connection Failed: ${error.message}`;
        
        if(session) session.processSessionObj(messageEnvelope);
    }
}


