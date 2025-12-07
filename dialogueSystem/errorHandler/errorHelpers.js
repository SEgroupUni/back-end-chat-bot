import { getSession } from "../../liveSessionState/sessionState.js";


// ------------------------
// INPUT ERROR HANDLING
// ------------------------
export function inputError(messageEnvelope) {
    console.log('input')
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.response = 
        "Your message was lost like a grain of sand in the desert — please send it once more.";
    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'error input'
    return messageEnvelope;
}

export function noReturnMsg(messageEnvelope) {
    const userMsgBool = !!messageEnvelope.userInput;

    if (userMsgBool) {
        messageEnvelope.flagState = "intEngine";
    } else {
        messageEnvelope.flagState = "frontFlow";
        messageEnvelope.response =
            "Your message was lost like a grain of sand in the desert — please send it once more.";
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'error return'
    return messageEnvelope;
}

// ------------------------
// GATEWAY VERIFICATION
// ------------------------
export function gatewayVerification(messageEnvelope) {

    const session = getSession();
    const inputBool = session.getUserInputBool();
    const histBool = session.getHistoryBool();

    if (inputBool && histBool) {
        messageEnvelope.flagState = "intEngine";
    } 
    else if (!inputBool && histBool) {
        messageEnvelope.flagState = "frontFlow";
        messageEnvelope.response =
            "Your message was lost like a grain of sand in the desert — please send it once more.";
    } 
    else {
        messageEnvelope.flagState = "endSession";
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'error gateway'
    return messageEnvelope;
}

// ------------------------
// HISTORY PARSE ERROR
// ------------------------
export function historyParseError(messageEnvelope) {
    const session = getSession();
    const histBool = session.getHistoryBool();

    if (histBool) {
        messageEnvelope.flagState = "aiRequest";
    } else {
        messageEnvelope.flagState = "endSession";
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'history parse'
    return messageEnvelope;
}

// ------------------------
// MISSING TOKEN ERROR
// ------------------------
export function missingTokenError(messageEnvelope) {
    const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

    if (HF_TOKEN) {
        messageEnvelope.flagState = "aiRequest";
    } else {
        messageEnvelope.flagState = "endSession";
    }

    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'token missing'
    return messageEnvelope;
}

// ------------------------
// AI RECYCLE (retry LLM)
// ------------------------
export function aiRecycle(messageEnvelope) {
    messageEnvelope.flagState = "aiRequest";
    messageEnvelope.errorCount++;
    messageEnvelope.componentUsed = 'network error'
    return messageEnvelope;
}
