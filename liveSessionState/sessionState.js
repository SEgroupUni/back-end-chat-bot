import Session from "../dialogueSystem/sessionManager/sessionManager.js";

/**
 * Session State Manager
 * ---------------------
 * This module controls creation, retrieval, and deletion of the
 * active conversational session.
 *
 * Only one session exists at a time; this acts as a singleton wrapper
 * around the Session class.
 */

let sessionInstance = null;

/**
 * Retrieve the active session.
 * If no session exists, create one using the provided initial persona data.
 */
export function getSession(initialData = null) {
    if (!sessionInstance) {
        sessionInstance = new Session(initialData);
    }
    return sessionInstance;
}

/**
 * Completely remove the current session.
 * The next call to getSession() will create a new one.
 */
export function deleteSession() {
    sessionInstance = null;
    if (!sessionInstance) {
        console.log("session deleted");
    }
}
