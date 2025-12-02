import { getSession } from "../../liveSessionState/sessionState.js";
import { promptLogic } from "./promptLogic.js";

export function promptGateway(messageEnvelope) {
    console.log("prompt gateway");
    const session = getSession();

    // 1. Create a cloned working copy so promptLogic doesn't modify the original session object
    const workingEnvelope = structuredClone(messageEnvelope);

    // 2. Run prompt logic on the cloned object (this may modify workingEnvelope)
    const processEnvelope = promptLogic(workingEnvelope);

    // 3. Store the processed envelope back into the session
    session.processSessionObj(processEnvelope);
}
