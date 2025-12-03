import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";
import { createSession, sessionGateRouter } from "../dataGateway/gateRouter.js";


export default function fileSaver(messageEnvelope, history, sessionLog, id) {
  const workingEnvelope = structuredClone(messageEnvelope)
  // finds the file to save the data into
  const sessionFilePath = path.join(process.cwd(), 'log.json');

  // gets the current session
  const currentSession = getSession();

  const sessionData = {
    id: id,
    sessionLog: sessionLog
  };
  if (messageEnvelope.error == true) {
    workingEnvelope.errorMsg = 'new session required'
    workingEnvelope.flagState = 'frontFlow'
    workingEnvelope.response = 'req response'
    currentSession.processSessionObj(workingEnvelope)
  }
  // appends the current session data to all previous sessions
  fs.appendFileSync(sessionFilePath, JSON.stringify(sessionData) + "\n", "utf-8");

   // deletes the session from memory after saving
  deleteSession();
  
}


export async function ErrorReload() {

  const sessionFilePath = path.join(process.cwd(), "log.json");

  const lines = fs.readFileSync(sessionFilePath, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean);

  const data = lines.map(l => JSON.parse(l));
  const latestSave = data[data.length - 1];
  const oldSession = getSession()
  const persona = oldSession.persona
  deleteSession();

  const sessionLive = createSession(persona);
  if (!sessionLive) return await ErrorReload();

  const session = getSession();
  session.loadSessionLog(latestSave.sessionLog);

  const lastUserInput =
    latestSave.sessionLog[latestSave.sessionLog.length - 1].userInput;

  return await sessionGateRouter(lastUserInput);
}
