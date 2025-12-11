import { getSession } from "../../liveSessionState/sessionState.js";
import { errorSwitch } from "./errorSwitch.js";

/**
 * errorGateway(messageEnvelope)
 * --------------------------------------------------------------
 * Central entry point for handling any system errors generated
 * during pipeline execution. This function:
 *
 *  1. Logs the error state into the session (for history/auditing).
 *  2. Tracks repeated errors using history.errorCount.
 *  3. Ends the session if too many consecutive errors occur.
 *  4. Passes the message envelope through errorSwitch() so the
 *     system can try to auto-recover or provide a fallback reply.
 *  5. Clears the error state if recovery was successful.
 *
 * IMPORTANT:
 * - No logic in this file modifies the meaning of errorSwitch().
 * - structuredClone() is used to prevent accidental mutation of
 *   the original session object.
 */


export function errorGateway(messageEnvelope) {
    console.log('error handler');
    const session = getSession();

    // Extract the last count
    const count = messageEnvelope.errorCount

    // ------------------------------------------------------------
    // 1. LOG THE ORIGINAL ERROR STATE BEFORE ALTERING ANYTHING
    // ------------------------------------------------------------
    const logObj = structuredClone(messageEnvelope);
    logObj.componentUsed = "error handler";
    session.processSessionObj(logObj);

    // ------------------------------------------------------------
    // 2. If error has occurred 3+ times, exit session hard
    // ------------------------------------------------------------
    if (count >= 3) {

    const exitObj = {
        userInput: null,
        response: "Our discussion must now end. May the gods guide your steps.",
        userPrompt: null,
        promptIntent: null,
        flagState: "endSession",
        error: true,
        errorCount: count,
        errMsg: "too many errors",
        history: [],
        componentUsed: "error handler"
    };

    session.processSessionObj(exitObj);
    return;
}

    // ------------------------------------------------------------
    // 3. Clone envelope to avoid mutating original
    // ------------------------------------------------------------
    const workingEnvelope = structuredClone(messageEnvelope);

    // ------------------------------------------------------------
    // 4. Run cloned envelope through error recovery logic
    // ------------------------------------------------------------
    const processEnvelope = errorSwitch(workingEnvelope);

    // ------------------------------------------------------------
    // 5. If errorSwitch succeeded (i.e., did not return another error)
    //    → clear error flags so downstream pipeline continues normally.
    // ------------------------------------------------------------
    if (
        processEnvelope.flagState !== "error" &&
        processEnvelope.flagState !== "endSession"
    ) {
        processEnvelope.error = false;
        processEnvelope.errMsg = null;
    }

    // ------------------------------------------------------------
    // 6. Commit updated state to session
    // ------------------------------------------------------------
    session.processSessionObj(processEnvelope);
}
