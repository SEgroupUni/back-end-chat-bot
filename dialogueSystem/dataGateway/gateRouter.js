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


// 3 — Process user input
export function backFlowGateRouter(userInput) {
    const session = getSession();
    session.setFlagState("intEngine");
    session.setUserInput(userInput); // run AFTER flag is set
}



export function frontFlowGateRouter(response) {
    const session = getSession();
    console.log(response)
    session.flushSessionObject();
    session.testFlush()
    return response.response
}

// 5 — Single handler for route usage
export async function handleMessage({ initialData, userData, userInput, response }) {
    if (initialData) createSession(initialData);
    if (userData) updateUserData(userData);
    if (userInput) backFlowGateRouter(userInput);
    if (response) return frontFlowGateRouter(response);

    return 'No response generated';
}