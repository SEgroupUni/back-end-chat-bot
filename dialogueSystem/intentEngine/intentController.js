import getResponse from "./getResponse.js";
import { getSession } from "../../liveSessionState/sessionState.js";

export async function intentController(sessionObj) {
    console.log("intent controller");

    // 1) Create an isolated working copy so no mutations affect the session object
    const workingEnvelope = structuredClone(sessionObj);

    // 2) Process through NLP intent engine
    const processEnvelope = await getResponse(workingEnvelope);
    console.log("Local Match Score:", processEnvelope.score);

    // 3) Define final next state (routing instruction)
    processEnvelope.flagState = processEnvelope.componentUsed
        ? "prompt"
        : "aiRequest";

    // 4) Apply final values intentionally to the real session object
    const session = getSession();
    console.log(processEnvelope)
    session.processSessionObj(processEnvelope);
}
