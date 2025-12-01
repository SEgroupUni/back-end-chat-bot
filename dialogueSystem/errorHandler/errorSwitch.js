export function errorSwitch(messageEnvelope, history){
    const swtichHist = history[-1].errorCount
    const switchErrMsg = messageEnvelope.response

    switch(switchErrMsg){

        case 'no input':
             return inputError(messageEnvelope)
    }
}