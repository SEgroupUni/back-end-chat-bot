import { getSession } from "../liveSessionState/sessionState.js";
import { processAiLogic } from "./aiLogicManager.js";


export async function handleAiRequest(messageEnvelope, sessionPrompt) {
    const session = getSession();
    console.log("session gateway");

    const workingEnvelope = structuredClone(messageEnvelope);

    // ---- INPUT VERIFICATION ----
    if (!workingEnvelope?.userInput || !sessionPrompt) {
        workingEnvelope.error = true;
        workingEnvelope.flagState = "error";
        workingEnvelope.errMsg = "AI gateway verification fail.";
        workingEnvelope.componentUsed = "External LLM";
        session.processSessionObj(workingEnvelope);
        return;
    }

    
    const processEnvelope = await processAiLogic(workingEnvelope, sessionPrompt);
    session.processSessionObj(processEnvelope);
}

