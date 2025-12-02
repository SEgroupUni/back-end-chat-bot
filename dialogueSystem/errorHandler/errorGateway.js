import { getSession } from "../../liveSessionState/sessionState.js";

export function errorGateway(messageEnvelope, history) {
    const session = getSession();

    // 1. Clone the incoming envelope so errorSwitch can't mutate the live session state
    const workingEnvelope = structuredClone(messageEnvelope, history);

    // 2. Pass the cloned object into the error handling logic (may modify workingEnvelope)
    const processEnvelope = errorSwitch(workingEnvelope, history);

    // 3. Apply the updated envelope back into the session state
    session.processSessionObj(processEnvelope);
}
