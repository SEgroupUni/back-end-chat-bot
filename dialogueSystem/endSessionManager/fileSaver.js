import fs from "fs";
import path from "path";
import { getSession } from "../../liveSessionState/sessionState.js";

/**
 * fileSaver.js
 * ------------------------------------------------------------------
 * FINAL PIPELINE STAGE — RUNS WHEN flagState === "endSession"
 *
 * Responsibilities:
 *   1. Save the entire sessionLog to /log.json
 *   2. Append metadata: session ID + last real user input
 *   3. Reset the session when ending due to error
 *   4. Cleanly terminate the session when ending normally
 *
 * This module does NOT modify core logic—only documents it.
 */


export default function fileSaver(messageEnvelope, sessionPrompt, sessionLog, id) {
  console.log("file saver");

  const sessionFilePath = path.join(process.cwd(), "log.json");
  const currentSession = getSession();

  // ------------------------------------------------------------------
  // EXTRACT LAST NON-NULL USER INPUT
  // Used for analytics / debugging / restoring interrupted sessions.
  // ------------------------------------------------------------------
  const lastUserInput = sessionLog
    .slice() // shallow copy to avoid mutating original
    .reverse()
    .find(entry => entry.userInput !== null && entry.userInput !== undefined)
    ?.userInput || null;

  // ------------------------------------------------------------------
  // LOAD EXISTING SAVED SESSIONS (if file exists)
  // ------------------------------------------------------------------
  let allSessions = [];
  if (fs.existsSync(sessionFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      if (Array.isArray(parsed)) allSessions = parsed;
    } catch {
      // If corrupted file, reset to empty
      allSessions = [];
    }
  }

  // ------------------------------------------------------------------
  // APPEND NEW SESSION DATA
  // ------------------------------------------------------------------
  allSessions.push({
    id,
    sessionLog,
    lastUserInput,
  });

  fs.writeFileSync(sessionFilePath, JSON.stringify(allSessions, null, 2), "utf8");

  // ------------------------------------------------------------------
  // ERROR-END SESSION BEHAVIOUR
  // If messageEnvelope.error === true, the session is not “finished.”
  // Instead:
  //   - Prepare a new session state object
  //   - Set next flagState to frontFlow
  //   - Indicate a new session is required
  // ------------------------------------------------------------------
  if (messageEnvelope.error === true) {
    const resend = structuredClone(messageEnvelope);

    resend.flagState = "frontFlow";        // restart pipeline cleanly
    resend.errMsg = "new session required";
    resend.response = "req response";      // placeholder to satisfy frontFlow rules

    currentSession.processSessionObj(resend);
    return; // stop here — do not run normal termination block
  }

  // ------------------------------------------------------------------
  // NORMAL CLEAN SESSION TERMINATION
  // - No errors
  // - Pipeline should stop executing
  // - Send final “end session” message
  // ------------------------------------------------------------------
  const finalObj = structuredClone(messageEnvelope);

  finalObj.flagState = null;        // No next stage → pipeline stops
  finalObj.response = "end session";
  finalObj.userInput = null;

  currentSession.processSessionObj(finalObj);
}
