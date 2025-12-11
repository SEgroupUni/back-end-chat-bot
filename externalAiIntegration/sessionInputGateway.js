import { getSession } from "../liveSessionState/sessionState.js";
import { processAiLogic } from "./aiLogicManager.js";
/**
 * AI Gateway Layer
 * ----------------
 * Acts as the entry point for external LLM calls.
 * - Validates incoming message and session prompt
 * - Clones the envelope to avoid mutating original session state
 * - Delegates AI generation to processAiLogic()
 * - Saves processed results back into session state
 */


export async function handleAiRequest(messageEnvelope, sessionPrompt) {
    const session = getSession();
    console.log("session gateway");

    // Clone to avoid mutating the original envelope
    const workingEnvelope = structuredClone(messageEnvelope);

    // ---- INPUT VERIFICATION ----
    // Ensures required fields exist before sending anything to the LLM
    if (!workingEnvelope?.userInput || !sessionPrompt) {
        workingEnvelope.error = true;
        workingEnvelope.flagState = "error";
        workingEnvelope.errMsg = "AI gateway verification fail.";
        workingEnvelope.componentUsed = "External LLM";

        // Still update session so pipeline remains consistent
        session.processSessionObj(workingEnvelope);
        return;
    }

    // ---- PROCESS THROUGH AI LOGIC MANAGER ----
    const processEnvelope = await processAiLogic(workingEnvelope, sessionPrompt);

    // Save processed results into the session
    session.processSessionObj(processEnvelope);
}
