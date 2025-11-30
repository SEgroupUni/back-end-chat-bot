import { getSession } from "../../liveSessionState/sessionState.js";
import { promptLogic } from "./promptLogic.js";

export function promptGateway(messageEvelope){
    const session = getSession()
    console.log('prompt gateway')
    const tempEnvelope = promptLogic(messageEvelope)
    session.processSessionObj(tempEnvelope)
}