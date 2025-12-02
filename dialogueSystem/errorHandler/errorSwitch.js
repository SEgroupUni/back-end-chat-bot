import { inputError, noReturnMsg } from "./errorHelpers.js";


export function errorSwitch(messageEnvelope, history){
    const switchErrMsg = messageEnvelope.response

    switch(switchErrMsg){

        case 'no input':
             return inputError(messageEnvelope, history)
        
        case 'no return me':
            return noReturnMsg(messageEnvelope, history)
    }
}