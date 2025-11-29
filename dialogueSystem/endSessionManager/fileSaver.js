import { getSession } from "../../liveSessionState/sessionState";
export default fileSaver()
    // finds the file to save the data into
    const sessionFilePath = path.join(process.cwd(),'log.json');
    let savedSessions = {};
    if (fs.existsSync(sessionFilePath)){
        const fileData = fs.readFileSync(sessionFilePath, 'utf-8')
        if (fileData.trim().length > 0){
            //downloads all previous sessions so they don't get cleared on file save
            savedSessions = JSON.parse(fileData)
        }
    }
    //gets the current session
    const currentSession = getSession()


    const sessionData = {
        id: currentSession.id,
        sessionLog: currentSession.sessionLog
    };
    //appends the current session data to all previous sessions
    savedSessions[currentSession.id] = sessionData;
    //writes everything into the JSON file
    fs.writeFileSync(sessionFilePath, JSON.stringify(savedSessions, null, 2), 'utf-8')
    sessionData = {
        id: null,
        sessionLog: null
    };