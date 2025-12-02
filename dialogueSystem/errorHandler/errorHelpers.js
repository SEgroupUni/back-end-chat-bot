

export function inputError(messageEnvelope, history){
    const lastEntry = history?.[history.length - 1];  
    const count = lastEntry?.errorCount ?? 0;
    if(count >= 3){ 
        messageEnvelope.flagState = 'endSession';
        }
    else{
        messageEnvelope.flagState = 'frontFlow';
        messageEnvelope.response = 'Your message was lost like a grain of sand in the dessert  — please send it once more.'
        messageEnvelope.count++;
        
    }
    return messageEnvelope
   
}   
export function noReturnMsg(messageEnvelope, history) {
    
    const lastEntry = history?.[history.length - 1];  
    const count = lastEntry?.errorCount ?? 0;

    const userMsgBool = !!messageEnvelope.userInput;

    // If error count exceeds limit — end session
    if (count >= 3) {
        messageEnvelope.flagState = "endSession";
        return messageEnvelope
    }

    // Otherwise continue based on whether input exists
    if (userMsgBool) {
        messageEnvelope.flagState = "intEngine";
        messageEnvelope.count++;
    } else {
        messageEnvelope.flagState = 'frontFlow';
        messageEnvelope.response = 'Your message was lost like a grain of sand in the dessert  — please send it once more.'
        messageEnvelope.count++;
        
        
    }

    return messageEnvelope;
}