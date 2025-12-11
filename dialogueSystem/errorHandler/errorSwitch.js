import { 
    inputError, 
    noReturnMsg,
    gatewayVerification,
    historyParseError,
    missingTokenError,
    aiRecycle
} from "./errorHelpers.js";
/**
 * errorSwitch(messageEnvelope)
 * --------------------------------------------------------------
 * Central routing switch for all recognised error messages.
 *
 * The system assigns messageEnvelope.errMsg during failures.
 * errorSwitch() uses that string as a lookup key to determine:
 *
 *   - Which recovery helper should be invoked
 *   - Whether the error is internal, history-related, or from
 *     the HuggingFace API layer
 *   - Whether to recycle the message through the AI pipeline
 *     (e.g., HF_INVALID_JSON → retry)
 *
 * If no matching error type is found, a generic fallback error
 * object is returned so the pipeline can continue.
 */



export function errorSwitch(messageEnvelope) {
    console.log('switch');

    // The driving key for this switch logic:
    // messageEnvelope.errMsg is set upstream during failure detection.
    const switchErrMsg = messageEnvelope.errMsg;

    switch (switchErrMsg) {

        // ----------------------------------------------------------
        // INTERNAL SYSTEM ERRORS
        // ----------------------------------------------------------

        // User provided no input string
        case "no input":
            return inputError(messageEnvelope);

        // Internal modules returned no message
        case "no return msg":
            return noReturnMsg(messageEnvelope);

        // AI gateway input verification failed
        case "AI gateway verification fail":
            return gatewayVerification(messageEnvelope);

        // History object was malformed or failed JSON.parse
        case "History parsing failed":
            return historyParseError(messageEnvelope);


        // ----------------------------------------------------------
        // HUGGINGFACE API ERRORS
        // ----------------------------------------------------------

        // Token missing → user cannot continue
        case "Missing HUGGINGFACE_TOKEN":
            return missingTokenError(messageEnvelope);

        // All other HF failures are recyclable conditions
        case "HF_HTTP_ERROR":
        case "HF_NO_CONTENT":
        case "HF_INVALID_JSON":
        case "HF_NETWORK_ERROR":
            return aiRecycle(messageEnvelope);


        // ----------------------------------------------------------
        // DEFAULT CATCH-ALL FALLBACK
        // ----------------------------------------------------------
        default:
            return {
                ...messageEnvelope,
                error: true,
                errMsg: switchErrMsg ?? "unknown error",
                flagState: "frontFlow",
                componentUsed: "Error Switch",
            };
    }
}
