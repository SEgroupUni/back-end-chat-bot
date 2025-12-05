import fs from "fs";
import path from "path";
import { getSession } from "../../liveSessionState/sessionState.js";

export default function fileSaver(messageEnvelope, persona, sessionLog, id) {
  console.log("File Saver Running...");

  const sessionFilePath = path.join(process.cwd(), "log.json");
  const currentSession = getSession();

  // --- CLEAN HISTORY: keep only meaningful user + bot messages ----
  const cleanedLog = sessionLog
    .filter(entry => entry.userInput && entry.response) // must have both user question and bot reply
    .map(entry => ({
      user: entry.userInput,
      bot: entry.response,
      timestamp: new Date().toISOString()
    }));

  // Load existing logs or create new file
  let allSessions = [];
  if (fs.existsSync(sessionFilePath)) {
    try {
      allSessions = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      if (!Array.isArray(allSessions)) allSessions = [];
    } catch {
      allSessions = [];
    }
  }

  // Append clean finalized session
  allSessions.push({
    id,
    persona: persona?.name ?? "unknown",
    completed: true,
    log: cleanedLog
  });

  // Write updated file
  fs.writeFileSync(sessionFilePath, JSON.stringify(allSessions, null, 2), "utf8");

  // Set final response back to frontend
  messageEnvelope.response = "Session successfully saved.";
  messageEnvelope.flagState = "frontFlow";

  currentSession.processSessionObj(messageEnvelope);
}
