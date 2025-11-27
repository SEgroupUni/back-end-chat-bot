import Session from "./dialogueSystem/sessionManager/sessionManager.js";
import { handleAiRequest } from "./externalAiIntegration/aiInputGateway.js";

async function runTest() {
    console.log("--- Starting AI Module Test ---");

    const mockSession = new Session({ name: "Ram Ram", role: "Pharaoh" });
    
    const input = "Who built the pyramids?";
    console.log("User Input:", input);

    const reply = await handleAiRequest(mockSession, input);

    console.log("\n--- RESULT ---");
    console.log("AI Reply:", reply);
    
    console.log("\n--- SESSION UPDATES ---");
    console.log("Session Log:", mockSession.sessionLog);
    console.log("User Data (Facts):", mockSession.userData);
}

runTest();