import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";
import { createSession, sessionGateRouter } from "../dataGateway/gateRouter.js";

export async function ErrorReload() {
  const sessionFilePath = path.join(process.cwd(), "log.json");

  // If no log file at all
  if (!fs.existsSync(sessionFilePath)) {
    return "No logs available.";
  }

  // Load array safely
  let allSessions = [];
  try {
    allSessions = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
    if (!Array.isArray(allSessions)) allSessions = [];
  } catch {
    return "Log file corrupted.";
  }

  if (allSessions.length === 0) {
    return "No previous session found.";
  }

  // Load last saved session
  const latestSave = allSessions[allSessions.length - 1];

  // Extract persona before deleting
  const oldSession = getSession();
  const persona = oldSession?.persona || "default persona";

  deleteSession();

  // Create a new session
  const sessionLive = createSession(persona);
  if (!sessionLive) {
    deleteSession();
    createSession("default persona");
    return "Failed to restore session. Started a fresh session.";
  }

  // Load the previous session log
  const session = getSession();
  session.loadSessionLog(latestSave.sessionLog);

  // Extract last input
  const lastEntry = latestSave.sessionLog[latestSave.sessionLog.length - 1];
  const lastUserInput = lastEntry.userInput;

  // Prevent infinite end-session trigger
  if (lastUserInput === "end session") {
    return "Restored session. No replay executed.";
  }

  // Replay the last input
  return await sessionGateRouter(lastUserInput);
}
