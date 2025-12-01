

export function inputError(messageEnvelope){

    messageEnvelope.componentUsed = 'error';
    messageEnvelope.flagState = 'frontFlow';
    messageEnvelope.response = 'Your message was lost like a grain of sand in the dessert  — please send it once more.'
    messageEnvelope.count++;

}   

export function notReturnMsg(messageEnvelope){
    if(messageEnvelope.userInput)

}