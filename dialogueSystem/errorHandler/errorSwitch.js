import { inputError, noReturnMsg } from "./errorHelpers.js";


export function errorSwitch(messageEnvelope, history) {
    const switchErrMsg = messageEnvelope.response;

    switch (switchErrMsg) {
        case 'no input':
            return inputError(messageEnvelope, history);

        case 'no return me':
            return noReturnMsg(messageEnvelope, history);

        default:
            // ALWAYS return a fallback envelope
            return {
                ...messageEnvelope,
                error: true,
                errorMsg: "unhandled error type",
                response: "Something went wrong.",
                flagState: "frontFlow"
            };
    }
}
