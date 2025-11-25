import Session from "../dialogueSystem/sessionManager/sessionManager.js";


let sessionInstance = null;

export function getSession(initialData = null) {
    
    if (!sessionInstance) {
        sessionInstance = new Session(initialData);
    }

    return sessionInstance;
}