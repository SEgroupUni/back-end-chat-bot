import fs from "fs";
import path from "path";
import { getSession } from "../../liveSessionState/sessionState.js";

export default function fileSaver(messageEnvelope) {
  console.log("file saver");

  const workingEnvelope = structuredClone(messageEnvelope);
  const sessionFilePath = path.join(process.cwd(), "log.json");
  const currentSession = getSession();

  // Load existing array or create a fresh one
  let allSessions = [];
  if (fs.existsSync(sessionFilePath)) {
    try {
      allSessions = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      if (!Array.isArray(allSessions)) allSessions = [];
    } catch {
      allSessions = [];
    }
  }
  // Add new session entry
  allSessions.push({
    id,
    sessionLog
  });

  // Save the entire array to disk
  fs.writeFileSync(sessionFilePath, JSON.stringify(allSessions, null, 2), "utf8");

  // Error handling behaviour unchanged
  if (messageEnvelope.error === true) {
    workingEnvelope.errorMsg = "new session required";
    workingEnvelope.flagState = "frontFlow";
    workingEnvelope.response = "req response";
    currentSession.processSessionObj(workingEnvelope);
  }

  // End session
  workingEnvelope.response = "end session";
  workingEnvelope.flagState = "frontFlow";
  currentSession.processSessionObj(workingEnvelope);
}
