import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";
import { createSession, sessionGateRouter } from "../dataGateway/gateRouter.js";

export async function errorReload(messageEnvelope, sessionPrompt, sessionLog, id) {
  const sessionFilePath = path.join(process.cwd(), "log.json");

  // No log file at all
  if (!fs.existsSync(sessionFilePath)) {
    return "No logs available.";
  }

  // Load saved sessions
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

  // Latest saved session
  const latestSave = allSessions[allSessions.length - 1];
  const { lastUserInput } = latestSave;

  // Get old persona
  const oldSession = getSession();
  const persona = oldSession?.sessionPersona || "default persona";

  // Reset session
  deleteSession();
  const sessionLive = createSession(persona);
  if (!sessionLive) {
    deleteSession();
    createSession("default persona");
    return "Failed to restore session. Started a fresh session.";
  }

  // Restore session history
  const session = getSession();
  session.loadSessionLog(sessionLog);

  // If no real input, do not replay
  if (!lastUserInput || lastUserInput === "end session") {
    return "Restored session. No replay executed.";
  }

  // Replay last real input
  return await sessionGateRouter(lastUserInput);
}
