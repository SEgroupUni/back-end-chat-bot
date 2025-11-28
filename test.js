import { createSession, backFlowGateRouter } 
from "./dialogueSystem/dataGateway/gateRouter.js";
import { getSession } from "./session/sessionState.js";





const userInput =  'hello'

const persona = 'ramasses'

const testSessionStart = createSession(persona);
console.log(testSessionStart);
const session = getSession()
let sesh = null;
if (session) {
    sesh = true;}

console.log(`session lives: ${sesh}`);
backFlowGateRouter(userInput)



