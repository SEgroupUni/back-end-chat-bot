

export function inputError(messageEnvelope, history){
    const count = history[-1].errorCount
    if(count >= 3){ messageEnvelope.flagState = 'endSession'
        return messageEnvelope}
    else{
        messageEnvelope.componentUsed = 'error';
        messageEnvelope.flagState = 'frontFlow';
        messageEnvelope.response = 'Your message was lost like a grain of sand in the dessert  — please send it once more.'
        messageEnvelope.count++;
    }
   
}   

export function noReturnMsg(messageEnvelope){
    
    if(messageEnvelope.userInput)
        pass
}