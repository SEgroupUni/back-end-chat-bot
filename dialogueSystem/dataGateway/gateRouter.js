import { getSession } from "../../session/sessionState.js";
import { validatePersona } from "./gateValidation.js";

// 1 — Create session
export function createSession(initialData) {
    if (!validatePersona(initialData)) return false;
    getSession(initialData);
    return true;
}

// 2 — Update user data (optional)
export function updateUserData(userData) {
    const session = getSession();
    session.setUserData(userData);
}

// 3 — Process user input
export function backFlowGateRouter(userInput) {
    const session = getSession();
    session.setFlagState("intEngine");
    session.setUserInput(userInput); // run AFTER flag is set
}
export async function frontFlowGateRouter(response) {
    const session = getSession();
    console.log("Front flow stage running:", response);
    session.flushSessionObject();
    session.testFlush()

    return null;
}

