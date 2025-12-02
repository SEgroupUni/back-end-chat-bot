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

    // 1. Clone the incoming envelope 
    const workingEnvelope = structuredClone(response);

    // 2. Determine whether a valid response exists and set the next flag accordingly
    if (!workingEnvelope.response) {
        workingEnvelope.flagState = "error";
        workingEnvelope.errorMsg = "no return message";
    } else {
        workingEnvelope.flagState = null;
        console.log(workingEnvelope);
    }

    // 3. Store the updated envelope back into the session state
    session.processSessionObj(workingEnvelope);
}

