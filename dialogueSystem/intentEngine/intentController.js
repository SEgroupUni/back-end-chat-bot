import getResponse from "./getResponse.js";
import { getSession } from "../../liveSessionState/sessionState.js";

export async function intentController(sessionObj) {
    console.log("intent controller");

    // Create an isolated working copy
    const workingEnvelope = structuredClone(sessionObj);

    // Process through NLP intent engine 
    const processEnvelope = await getResponse(workingEnvelope);
    console.log("Local Match Score:", processEnvelope.score);

    // Define final next state 
    if (processEnvelope.componentUsed) {

        
        processEnvelope.flagState = "prompt";

        // Calculate random delay between 2s and 4s 
        const delay = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000);
        
        console.log(`Local Match Found. Simulating think time: ${delay}ms`);
        
        // Pause execution for the duration of the delay
        await new Promise(resolve => setTimeout(resolve, delay));

    } else {
        // NO LOCAL MATCH THEN SEND TO AI
        // No artificial delay added here because the AI is naturally slow.
        console.log("No local match found. Routing to External AI.");
        processEnvelope.flagState = "aiRequest";
    }

    const session = getSession();
    session.processSessionObj(processEnvelope);
}