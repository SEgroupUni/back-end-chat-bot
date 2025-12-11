import { getSession } from "../../liveSessionState/sessionState.js";
import { promptLogic } from "./promptLogic.js";

/**
 * promptGateWay.js
 * -----------------
 * Acts as the entry point for the prompt decision system.
 *
 * The gateway:
 *   1. Retrieves the active session.
 *   2. Clones the incoming message envelope to avoid mutating the original data.
 *   3. Passes the cloned envelope through the semantic prompt logic.
 *   4. Stores the updated envelope back into the session state.
 */



export function promptGateway(messageEnvelope) {
    console.log("prompt gateway");

    // Retrieve the active session context
    const session = getSession();

    // 1. Clone envelope to prevent direct modification of original state
    const workingEnvelope = structuredClone(messageEnvelope);

    // 2. Apply prompt logic (may add suggested prompt or leave unchanged)
    const processEnvelope = promptLogic(workingEnvelope);

    // 3. Commit the updated envelope back into the session manager
    session.processSessionObj(processEnvelope);
}
