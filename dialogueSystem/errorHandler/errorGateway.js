import { getSession } from "../../liveSessionState/sessionState.js";
import { errorSwitch } from "./errorSwitch.js";

export function errorGateway(messageEnvelope) {
    console.log('error handler')
    const session = getSession();
    const lastEntry = messageEnvelope.history?.[messageEnvelope.history.length - 1];  
    const count = lastEntry?.errorCount ?? 0;

    // // 1. Log the original error state BEFORE modifying anything
    // const logObj = structuredClone(messageEnvelope);
    // logObj.componentUsed = "error handler";
    // session.processSessionObj(logObj);

    // 2. If error count >= 3 → end session
    if (count >= 3) {
        session.processSessionObj(exitObj);
        return;
    }

    // 3. Clone envelope so errorSwitch cannot mutate original
    const workingEnvelope = structuredClone(messageEnvelope);

    // 4. Process the cloned envelope through error handler
    const processEnvelope = errorSwitch(workingEnvelope);

    // 5. If errorSwitch resolved → clear error flag
    if (processEnvelope.flagState !== "error" && processEnvelope.flagState !== 'endSession') {
        processEnvelope.error = false;
    }

    // 6. Commit updated state to session
    session.processSessionObj(processEnvelope);
}