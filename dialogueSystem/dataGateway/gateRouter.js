import { getSession } from "../../liveSessionState/sessionState.js";
import { getPersona } from "../../personas/getPersona.js";
import { validatePersona } from "./gateValidation.js";

/**
 * gateRouter.js
 *
 * This module acts as the central routing controller for session creation
 * and user-input processing. It connects user messages to the session pipeline,
 * manages clean session resets, and finalizes each pipeline cycle.
 *
 * IMPORTANT:
 * - No business logic has been modified — only comments and documentation added.
 * - This file orchestrates session flow but leaves processing to the pipeline
 *   modules (intent engine, LLM, prompts, error handler, etc.).
 */


// ------------------------------------------------------------
// 1 — CREATE SESSION
// ------------------------------------------------------------
/**
 * Creates a new session based on persona ID or name.
 * Validates input → loads persona → initializes session object.
 *
 * @param {string} initialData - persona identifier/name
 * @returns {boolean} whether session creation succeeded
 */
export function createSession(initialData) {
    if (!validatePersona(initialData)) return false;

    const personaObject = getPersona(initialData);

    // Initializes the session using the persona object
    getSession(personaObject);

    return true;
}



// ------------------------------------------------------------
// 2 — PROCESS USER INPUT
// ------------------------------------------------------------
/**
 * Routes user input into the session pipeline.
 * Steps:
 * 1. Fetch live session
 * 2. Send user input into pipeline
 * 3. Wait for pipeline to complete
 * 4. Return final output (response + prompt)
 *
 * @param {string|null} userInput
 * @returns {{response: string, userPrompt: string|null, error: boolean}}
 */
export async function sessionGateRouter(userInput) {
    const session = getSession();
    console.log("gaterouter");

    // If input missing → send placeholder so pipeline triggers error paths cleanly
    if (!userInput) {
        userInput = "no input";
    }

    // Run full conversation pipeline
    await session.setUserInput(userInput);

    // Extract output AFTER pipeline finishes
    const { response, userPrompt, error } = session.currentSessionObj;

    // Reset session object for next turn
    session.flushSessionObject();

    return { response, userPrompt, error };
}



// ------------------------------------------------------------
// 3 — FINAL PIPELINE STEP (finishCycle)
// ------------------------------------------------------------
/**
 * Final stage of the conversation pipeline.
 * Ensures:
 * - A response exists (otherwise routes to error)
 * - History is cleared before next turn
 * - Flag state is set to end the pipeline loop
 *
 * @param {object} response - message envelope from previous stage
 */
export function finishCycle(response) {
    const session = getSession();

    // Work on a safe clone so session state isn't mutated directly
    const workingEnvelope = structuredClone(response);

    // If no response returned → pipeline must route to error handler
    if (!workingEnvelope.response) {
        console.log("error working");
        workingEnvelope.flagState = "error";
        workingEnvelope.error = true;
        workingEnvelope.errMsg = "no return msg";

    } else {
        // Normal completion: stop pipeline + clear temporary history
        workingEnvelope.flagState = null;
    }

    // Commit updated envelope to session state
    session.processSessionObj(workingEnvelope);
     if (workingEnvelope.history) {
            console.log("history present");
            workingEnvelope.history = [];
        }
    console.log(workingEnvelope)
}
