import { getSession } from "../../liveSessionState/sessionState.js";
import { getPersona } from "../../personas/getPersona.js";
import { validatePersona } from "./gateValidation.js";

// 1 — Create session
export function createSession(initialData) {
    if (!validatePersona(initialData)) return false;
    
    const personaObject = getPersona(initialData);
    getSession(personaObject); 
    return true;
}


// 2 — Process user input
export async function sessionGateRouter(userInput) {
    const session = getSession();
    console.log('gaterouter')
    // Run pipeline and wait for completion
    if(userInput){
        await session.setUserInput(userInput);
    }
    else{
        userInput = 'no input'
        await session.setUserInput(userInput)
    }
    

    // Once pipeline finishes, extract final output
    const { response, userPrompt } = session.currentSessionObj;
    session.flushSessionObject();

    return { response, userPrompt };
}

export function finishCycle(response) {
    const session = getSession();
    if(!response.response){
        response.flagState = 'error';
        response.errorMsg = 'no return message';
        session.processSessionObj(response)
    }
    else{
        response.flagState = null;
        session.processSessionObj(response)
        console.log(response)}
}

