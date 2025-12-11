import { getSession } from "../../liveSessionState/sessionState.js";
/**
 * errorHelpers.js
 * ----------------------------------------------------------
 * A collection of small, focused recovery handlers used by
 * errorSwitch(). Each helper modifies messageEnvelope in a
 * controlled way, decides the next pipeline state, increments
 * error counters, and returns the updated envelope.
 *
 * These helpers DO NOT perform branching logic beyond what is
 * required for each specific error type — they only respond
 * to a known category of failure.
 */

// ------------------------------------------------------------
// INPUT ERROR HANDLING
// ------------------------------------------------------------

/**
 * Triggered when user input was missing (e.g., empty string).
 * The system tells the user to resend and continues safely.
 */


export function inputError(messageEnvelope) {
    console.log('input');

    messageEnvelope.flagState = "frontFlow";   // Return to user-facing stage
    messageEnvelope.response =
        "Your message was lost like a grain of sand in the desert — please send it once more.";

    messageEnvelope.errorCount++;              // Track repeated failures
    messageEnvelope.componentUsed = 'error input';

    return messageEnvelope;
}

/**
 * Triggered when internal functions returned no response text.
 * If user input existed → retry intent engine.
 * If not → ask user to resend the message.
 */
export function noReturnMsg(messageEnvelope) {
    const userMsgBool = !!messageEnvelope.userInput;

    if (userMsgBool) {
        messageEnvelope.flagState = "intEngine";  // Retry interpretation
    } else {
        messageEnvelope.flagState = "frontFlow";  // Ask user for input again
        messageEnvelope.response =
            "Your message was lost like a grain of sand in the desert — please send it once more.";
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'error return';

    return messageEnvelope;
}


// ------------------------------------------------------------
// GATEWAY VERIFICATION ERRORS
// ------------------------------------------------------------

/**
 * Triggered when AI gateway input verification fails.
 * Uses session sanity flags to determine whether the user
 * should retry, whether history is intact, or whether
 * the session must terminate.
 */
export function gatewayVerification(messageEnvelope) {
    const session = getSession();
    const inputBool = session.getUserInputBool();
    const histBool = session.getHistoryBool();

    if (inputBool && histBool) {
        messageEnvelope.flagState = "intEngine";   // Retry intent matching
    } 
    else if (!inputBool && histBool) {
        messageEnvelope.flagState = "frontFlow";   // Ask user to resend
        messageEnvelope.response =
            "Your message was lost like a grain of sand in the desert — please send it once more.";
    } 
    else {
        messageEnvelope.flagState = "endSession";  // Unsafe state → close session
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'error gateway';

    return messageEnvelope;
}


// ------------------------------------------------------------
// HISTORY PARSE ERRORS
// ------------------------------------------------------------

/**
 * Triggered when conversation history fails to parse.
 * If partial history still exists → retry AI.
 * If no reliable history → end session.
 */
export function historyParseError(messageEnvelope) {
    const session = getSession();
    const histBool = session.getHistoryBool();

    if (histBool) {
        messageEnvelope.flagState = "aiRequest";   // Safe to retry with reduced history
    } else {
        messageEnvelope.flagState = "endSession";  // Critical corruption → terminate
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'history parse';

    return messageEnvelope;
}


// ------------------------------------------------------------
// MISSING TOKEN ERROR
// ------------------------------------------------------------

/**
 * Triggered when the HF API token is missing.
 * If the token suddenly appears (fixed by user) retry AI;
 * otherwise end session.
 */
export function missingTokenError(messageEnvelope) {
    const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

    if (HF_TOKEN) {
        messageEnvelope.flagState = "aiRequest";   // Retry now that token exists
    } else {
        messageEnvelope.flagState = "endSession";  // Cannot continue without token
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'token missing';

    return messageEnvelope;
}


// ------------------------------------------------------------
// AI RECYCLE (generic retry for HF issues)
// ------------------------------------------------------------

/**
 * Triggered for any transient HuggingFace model error:
 *   - HF_HTTP_ERROR
 *   - HF_NO_CONTENT
 *   - HF_INVALID_JSON
 *   - HF_NETWORK_ERROR
 *
 * These are treated as "retryable" mistakes — the pipeline
 * simply attempts another AI request.
 */
export function aiRecycle(messageEnvelope) {
    messageEnvelope.flagState = "aiRequest";     // Perform LLM retry
    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'network error';

    return messageEnvelope;
}
