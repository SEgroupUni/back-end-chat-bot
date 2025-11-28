import { createSession, updateUserData, backFlowGateRouter } 
from "./dialogueSystem/dataGateway/gateRouter.js";
import { getSession } from "./session/sessionState.js";





const userInput =  'Tell me something about your first wife'

const persona = 'ramasses'

const testSessionStart = createSession(persona);
console.log(testSessionStart);
const session = getSession()
let sesh = null;
if (session) {
    sesh = true;}

console.log(`session lives: ${sesh}`);
backFlowGateRouter(userInput)



