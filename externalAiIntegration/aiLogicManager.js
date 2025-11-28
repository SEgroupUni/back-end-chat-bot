import { sendToExternalAI } from "./externalApiClient.js";
// ive done aiInPut gateway updated the code for error and what it passes
//prompt in persona and in session manager for dynamic prompt, you can convert this to a script then pass as message along with user msg or what ever u think to llm, message envelope is an object so look at this.currentSessionObj for elements in session manager, 
// history is now a set of user and bot respones as json made in session manager before you were sending a list of objects full of all sorts
// when you get posistive message from llm update messageEnvelope response and flagstate to frontFlow
// if you get catch or error up date messageEnvelope.git error and update flag state to error. look at aiInputGateway for example
// then run cmd session.processSessionObj(messageEnvelope) can litterally copy and paste
// ive commented out some parts we can keep for later,  i just dont know how to use them as dialogue system is auto pipeline and currently dont know how to use dynamic user data
//if you look at test you can put question thats more complicated than name or hello and will get to llm cant guarentee no bugs


export async function processAiLogic(messageEnvelope, sessionPrompt) {
    
    // CLEAN THE PROMPT
    let cleanPrompt = "You are Ram Ram, an ancient Egyptian Pharaoh. Answer in character."; // Default
    
    if (typeof sessionPrompt === 'string' && sessionPrompt.trim().length > 0) {
        cleanPrompt = sessionPrompt;
    } else if (typeof sessionPrompt === 'object') {
        // If it's an object ignore it 
        console.log("[AI Logic] Session prompt was an object/empty, using default.");
    }

    // CLEAN THE HISTORY 
    let cleanHistory = [];
    
    try {
        let rawHistory = messageEnvelope.history;

        // If it came as a string, parse it back to an array
        if (typeof rawHistory === 'string') {
            rawHistory = JSON.parse(rawHistory);
        }


        if (Array.isArray(rawHistory)) {
            cleanHistory = []; // Reset array
            for (const entry of rawHistory) {
                if (entry.user) {
                    cleanHistory.push({ role: "user", content: String(entry.user) });
                }
                if (entry.bot) {
                    cleanHistory.push({ role: "assistant", content: String(entry.bot) });
                }
            }
        }
    } catch (e) {
        console.warn("[AI Logic] Could not parse history. Ignoring context.", e);
        cleanHistory = [];
    }

    const messages = [
        { role: "system", content: cleanPrompt }, 
        ...cleanHistory, 
        { role: "user", content: String(messageEnvelope.userInput) }
    ];

    console.log("[AI Logic] Sending request to API...");

    // Call External API
    const rawResponse = await sendToExternalAI(messages);

    // PARSE RESPONSE 
    let finalReply = rawResponse;

    try {
        if (rawResponse.trim().startsWith("{") || rawResponse.includes("```json")) {
            const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);
            finalReply = parsedData.reply || parsedData.message || rawResponse;
        }
    } catch (e) {
        console.warn("[AI Logic] JSON Parse failed, using raw text response.");
        finalReply = rawResponse;
    }
    // UPDATE THE SESSION 
    

    // // Update User Data if AI found new facts
    // if (parsedData.newFacts && Object.keys(parsedData.newFacts).length > 0) {
    //     const currentData = sessionInstance.userData || {};
    //     sessionInstance.setUserData({ ...currentData, ...parsedData.newFacts });
    // }

    messageEnvelope.response = finalReply;
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.error = false;

    console.log ("Envolope Updated. Flag set to frontFlow");
}