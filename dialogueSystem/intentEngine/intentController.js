import getResponse from "./getResponse.js";
import { getSession } from "../../session/sessionState.js";

export async function intentController(messageEnvelope) {
    console.log('intent controller')
    const session = getSession()
    const tempEnvelope = await getResponse(messageEnvelope);
    console.log("Local Match Score:", tempEnvelope.score);
    tempEnvelope.flagState = tempEnvelope.componentUsed
        ? "frontFlow"
        : "aiRequest";
    session.processSessionObj(tempEnvelope)
}