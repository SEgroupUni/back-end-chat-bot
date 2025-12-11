import getResponse from "./getResponse.js";
import { getSession } from "../../liveSessionState/sessionState.js";
/**
 * Intent Controller
 * -----------------
 * Central routing layer for the intent engine.
 *
 * Responsibilities:
 * - Clone the session envelope to avoid side-effects
 * - Run the local NLP intent engine (getResponse)
 * - Decide whether to:
 *      ✓ Use a locally matched intent  → transition to "prompt"
 *      ✓ Or route to the external AI  → transition to "aiRequest"
 * - Simulate “thinking time” for local matches to feel more human
 * - Save the updated envelope back into the session state
 */



export async function intentController(sessionObj) {
    console.log("intent controller");

    // Clone the incoming session object to avoid mutating shared state
    const workingEnvelope = structuredClone(sessionObj);

    // Run intent classification / local NLP matching layer
    const processEnvelope = await getResponse(workingEnvelope);
    console.log("Local Match Score:", processEnvelope.score);

    // If the NLP engine identified a component to handle the message…
    if (processEnvelope.componentUsed) {

        // Mark next pipeline stage as prompt-generation
        processEnvelope.flagState = "prompt";

        // Simulated human-like delay: 2000–4000ms
        const delay = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000);
        console.log(`Local Match Found. Simulating think time: ${delay}ms`);

        // Await the artificial delay
        await new Promise(resolve => setTimeout(resolve, delay));

    } else {

        // No local intent match → escalate to LLM
        console.log("No local match found. Routing to External AI.");
        processEnvelope.flagState = "aiRequest";
    }

    // Save updated envelope back into the session pipeline
    const session = getSession();
    session.processSessionObj(processEnvelope);
}
