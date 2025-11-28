
import { processAiLogic } from "./externalAiIntegration/aiLogicManager.js";

async function runTest() {
    console.log("--- Testing Object Passing Architecture ---");

    // Create the Fake Envelope 
    // This simulates what the Session Manager would send you
    const fakeEnvelope = {
        userInput: "Who was won the champions league in 2021?",
        history: [], 
        response: null, 
        flagState: "intEngine", 
        error: false
    };

    const fakePrompt = "You are a football expert. Answer briefly.";

    console.log("1. Envelope BEFORE:", fakeEnvelope);

    // Call Logic Manager
    console.log("... Calling AI Logic ...");
    await processAiLogic(fakeEnvelope, fakePrompt);

    // Check the Envelope AFTER
    console.log("\n2. Envelope AFTER:", fakeEnvelope);

    // Verify 
    if (fakeEnvelope.flagState === "frontFlow" && fakeEnvelope.response) {
        console.log("\n SUCCESS");
        console.log("AI Response:", fakeEnvelope.response);
    } else {
        console.log("\nm FAILED");
    }
}

runTest();