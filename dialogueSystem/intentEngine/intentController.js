import getResponse from "./getResponse.js";
import { getSession } from "../../session/sessionState.js";
import { handleAiRequest } from "../../externalAiIntegration/aiInputGateway.js";

export async function intentController(messageEnvelope) {
    console.log('intent controller')
    const session = getSession()
    const tempEnvelope = await getResponse(messageEnvelope);
    //tempEnvelope.flagState = tempEnvelope.componentUsed
        //? "frontFlow"
        //: "frontFlow";
    //session.processSessionObj(tempEnvelope)

    console.log("Local Match Score:", tempEnvelope.score);

    // Check if score is 0 
    if (tempEnvelope.score === 0 || !tempEnvelope.intent) {
        console.log("No local match found. Calling External AI...");
        
        // Pass the envelope and sessionPrompt to Gateway
        await handleAiRequest(tempEnvelope, session.sessionPrompt || "");
        
        return tempEnvelope;
    }

    // Return the local response
    tempEnvelope.flagState = "frontFlow";
    session.processSessionObj(tempEnvelope);

    return tempEnvelope;
}