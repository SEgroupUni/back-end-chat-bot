import fs from "fs";
import path from "path";
import { getSession } from "../../liveSessionState/sessionState.js";

export default function fileSaver(messageEnvelope, sessionPrompt, sessionLog, id) {
  console.log("file saver");

  const sessionFilePath = path.join(process.cwd(), "log.json");
  const currentSession = getSession();

  // ---- Determine the last REAL user input ----
  const lastUserInput = sessionLog
    .slice()       // shallow copy
    .reverse()
    .find(entry => entry.userInput !== null && entry.userInput !== undefined)
    ?.userInput || null;

  // ---- Load existing saved sessions ----
  let allSessions = [];
  if (fs.existsSync(sessionFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      if (Array.isArray(parsed)) allSessions = parsed;
    } catch {
      allSessions = [];
    }
  }

  // ---- Save new session structure ----
  allSessions.push({
    id,
    sessionLog,
    lastUserInput,
  });

  fs.writeFileSync(sessionFilePath, JSON.stringify(allSessions, null, 2), "utf8");

  // ---- If we ended due to an error, prep for a new session ----
  if (messageEnvelope.error === true) {
    const resend = structuredClone(messageEnvelope);
    resend.flagState = "frontFlow";
    resend.errMsg = "new session required";
    resend.response = "req response";
    currentSession.processSessionObj(resend);
    return;
  }

  // ---- Normal clean end ----
  const finalObj = structuredClone(messageEnvelope);
  finalObj.flagState = null;        // Stop pipeline
  finalObj.response = "end session";
  finalObj.userInput = null;

  currentSession.processSessionObj(finalObj);
}
