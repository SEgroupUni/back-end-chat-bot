import { getSession } from "../../liveSessionState/sessionState.js";

export function errorGateway(messageEnvelope, history) {
    const session = getSession();

    // 1. Log the original error state BEFORE modifying anything
    const logObj = structuredClone(messageEnvelope);
    logObj.componentUsed = "error handler";
    session.processSessionObj(logObj);

    // 2. Clone the envelope so errorSwitch can't mutate the original
    const workingEnvelope = structuredClone(messageEnvelope);

    // 3. Process the cloned envelope through the error handler logic
    const processEnvelope = errorSwitch(workingEnvelope, history);

    // 4. Commit the updated error envelope back into the session
    session.processSessionObj(processEnvelope);
}
