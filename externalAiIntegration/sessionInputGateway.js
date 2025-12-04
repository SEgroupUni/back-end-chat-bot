import { processAiLogic } from "./aiLogicManager.js";
import { getSession } from "../liveSessionState/sessionState.js";

export async function handleAiRequest(messageEnvelope, sessionPrompt= personaPrompt) {
    const session = getSession();
    console.log('session gateway');

    // Make a safe copy so the original state isn't mutated
    const workingEnvelope = structuredClone(messageEnvelope);

    // Validation 
    if (!workingEnvelope?.userInput) {
        console.warn("[AI Gateway] Missing userInput.");

        workingEnvelope.error = true;
        workingEnvelope.flagState = "error";
        workingEnvelope.response = "Error: Missing user input.";
        workingEnvelope.componentUsed = "External LLM";

        session.processSessionObj(workingEnvelope);
        return; 
    }

    // Execute AI Logic 
    try {
        await processAiLogic(workingEnvelope, sessionPrompt);

        session.processSessionObj(workingEnvelope);

    } catch (error) {

        console.error("[AI Gateway] Failed:", error.message);

        workingEnvelope.error = true;
        workingEnvelope.flagState = "error";
        workingEnvelope.componentUsed = "External LLM";
        workingEnvelope.response = `AI Connection Failed: ${error.message}`;

        session.processSessionObj(workingEnvelope);
    }
}



