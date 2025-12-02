import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";
import { sessionGateRouter } from "../dataGateway/gateRouter.js";


export default function fileSaver() {
  
  // finds the file to save the data into
  const sessionFilePath = path.join(process.cwd(), 'log.json');

  // gets the current session
  const currentSession = getSession();

  const sessionData = {
    id: currentSession.id,
    sessionLog: currentSession.sessionLog
  };
  if (currentSession.error == true) {
    ErrorReload();
  }
  // appends the current session data to all previous sessions
  fs.appendFileSync(sessionFilePath, JSON.stringify(sessionData) + "\n", "utf-8");

   // deletes the session from memory after saving
  deleteSession();
  
}


export function ErrorReload() {
  const sessionFilePath = path.join(process.cwd(), 'log.json');
  const jsonData = fs.readFileSync(sessionFilePath, 'utf-8');
  const data = JSON.parse(jsonData);
  const latestSave = data[data.length - 1];
  sessionGateRouter(latestSave.sessionLog[sessionLog.length - 1])
  
}