import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";
import { createSession, sessionGateRouter } from "../dataGateway/gateRouter.js";

/**
 * errorReload.js
 * ------------------------------------------------------------------
 * Called by the error-handling system when the LLM fails repeatedly.
 *
 * Purpose:
 *   - Restore the *previous* saved session from log.json
 *   - Reconstruct conversation memory
 *   - Rebuild the persona session
 *   - Optionally replay the last user input
 *
 * This enables "graceful recovery" from model errors.
 *
 * PARAMETERS:
 *   messageEnvelope  → the failing state snapshot
 *   sessionPrompt    → persona config (not modified here)
 *   sessionLog       → current log buffer kept in memory
 *   id               → session identifier UUID
 *
 * RETURNS:
 *   A string explaining what happened, OR triggers a replay via
 *   sessionGateRouter().
 */

export async function errorReload(messageEnvelope, sessionPrompt, sessionLog, id) {
  const sessionFilePath = path.join(process.cwd(), "log.json");

  // ------------------------------------------------------------------
  // 1. VALIDATE LOG FILE EXISTENCE
  // ------------------------------------------------------------------
  if (!fs.existsSync(sessionFilePath)) {
    return "No logs available.";
  }

  // ------------------------------------------------------------------
  // 2. LOAD ALL SAVED SESSIONS
  // ------------------------------------------------------------------
  let allSessions = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
    if (Array.isArray(parsed)) {
      allSessions = parsed;
    }
  } catch {
    return "Log file corrupted.";
  }

  if (allSessions.length === 0) {
    return "No previous session found.";
  }

  // ------------------------------------------------------------------
  // 3. RETRIEVE LAST SAVED SESSION SNAPSHOT
  // ------------------------------------------------------------------
  const latestSave = allSessions[allSessions.length - 1];
  const { lastUserInput } = latestSave;

  // ------------------------------------------------------------------
  // 4. RECOVER PROMPT FROM OLD SESSION (if it exists)
  // ------------------------------------------------------------------
  const oldSession = getSession();
  if(oldSession){console.log('session live')}

  const persona = oldSession.sessionPrompt
  

  // ------------------------------------------------------------------
  // 5. RESET SESSION AND REBUILD A NEW ONE
  // ------------------------------------------------------------------
  deleteSession();
  const sessionLive = createSession(persona);

  if (!sessionLive) {
    // Safety fallback
    deleteSession();
    createSession("default persona");
    return "Failed to restore session. Started a fresh session.";
  }

  // ------------------------------------------------------------------
  // 6. RESTORE SESSION LOG INTO THE NEW SESSION INSTANCE
  // ------------------------------------------------------------------
  const session = getSession();
  session.loadSessionLog(sessionLog);

  // ------------------------------------------------------------------
  // 7. IF LAST INPUT WAS NULL OR END-SESSION → DO NOT REPLAY
  // ------------------------------------------------------------------
  if (!lastUserInput || lastUserInput === "end session") {
    return "Restored session. No replay executed.";
  }

  // ------------------------------------------------------------------
  // 8. REPLAY THE LAST VALID USER MESSAGE THROUGH ROUTER
  // ------------------------------------------------------------------
  return await sessionGateRouter(lastUserInput);
}
