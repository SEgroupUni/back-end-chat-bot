import { getSession } from "../../liveSessionState/sessionState.js";

export  function errorGateway(messageEnvelope, history){
    const session = getSession();
    const tempEnvelope = errorSwitch(messageEnvelope, history);
    session.proccessSessionObj(tempEnvelope)
}
