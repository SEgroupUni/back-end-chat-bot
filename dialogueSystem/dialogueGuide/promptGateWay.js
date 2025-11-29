import { getSession } from "../../liveSessionState/sessionState.js";
import { promptLogic } from "./promptLogic.js";

export function promptGateway(messageEvelope){
    const session = getSession()
    const tempEnvelope = promptLogic(messageEvelope)
    session.processSessionObj(tempEnvelope)
}