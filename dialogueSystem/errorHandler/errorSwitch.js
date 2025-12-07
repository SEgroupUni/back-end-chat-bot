import { 
    inputError, 
    noReturnMsg,
    gatewayVerification,
    historyParseError,
    missingTokenError,
    aiRecycle
} from "./errorHelpers.js";

export function errorSwitch(messageEnvelope) {
    console.log('switch')
    const switchErrMsg = messageEnvelope.errMsg;

    switch (switchErrMsg) {

        // --------------------------
        // INTERNAL ERRORS
        // --------------------------
        case "no input":
            return inputError(messageEnvelope);

        case "no return msg":
            return noReturnMsg(messageEnvelope);

        case "AI gateway verification fail":
            return gatewayVerification(messageEnvelope);

        case "History parsing failed":
            return historyParseError(messageEnvelope);


        // --------------------------
        // HUGGINGFACE ERRORS
        // --------------------------

        // Missing token
        case "Missing HUGGINGFACE_TOKEN":
            return missingTokenError(messageEnvelope);

        // HF gateway failures → all recycled
        case "HF_HTTP_ERROR":
        case "HF_NO_CONTENT":
        case "HF_INVALID_JSON":
        case "HF_NETWORK_ERROR":
            return aiRecycle(messageEnvelope);


        // --------------------------
        // DEFAULT FALLBACK
        // --------------------------
        default:
            return {
                ...messageEnvelope,
                error: true,
                errorMsg: switchErrMsg ?? "unknown error",
                flagState: "frontFlow",
                componentUsed: "Error Switch",
        
            };
    }
}
