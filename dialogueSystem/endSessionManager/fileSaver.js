import fs from "fs";
import path from "path";
import { getSession, deleteSession } from "../../liveSessionState/sessionState.js";


export default function fileSaver() {
  
  // finds the file to save the data into
  const sessionFilePath = path.join(process.cwd(), 'log.json');

  // gets the current session
  const currentSession = getSession();

  const sessionData = {
    id: currentSession.id,
    sessionLog: currentSession.sessionLog
  };

  // appends the current session data to all previous sessions
  fs.appendFileSync(sessionFilePath, JSON.stringify(sessionData) + "\n", "utf-8");

   // deletes the session from memory after saving
  deleteSession();

}