import getResponse from "./getResponse.js";
import { getSession } from "../../session/sessionState.js";

export async function intentController(messageEnvelope) {
    console.log('intent controller')
    const session = getSession()
    const tempEnvelope = await getResponse(messageEnvelope);
    console.log(tempEnvelope)
    tempEnvelope.flagState = tempEnvelope.componentUsed
        ? "frontFlow"
        : "frontFlow";
    session.processSessionObj(tempEnvelope)

    return tempEnvelope;
}