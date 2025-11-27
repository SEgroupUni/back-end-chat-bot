import { sendToExternalAI } from "./externalApiClient.js";
import { getSession } from "../session/sessionState.js";
// ive done aiInPut gateway updated the code for error and what it passes
//prompt in persona and in session manager for dynamic prompt, you can convert this to a script then pass as message along with user msg or what ever u think to llm, message envelope is an object so look at this.currentSessionObj for elements in session manager, 
// history is now a set of user and bot respones as json made in session manager before you were sending a list of objects full of all sorts
// when you get posistive message from llm update messageEnvelope response and flagstate to frontFlow
// if you get catch or error up date messageEnvelope.git error and update flag state to error. look at aiInputGateway for example
// then run cmd session.processSessionObj(messageEnvelope) can litterally copy and paste
// ive commented out some parts we can keep for later,  i just dont know how to use them as dialogue system is auto pipeline and currently dont know how to use dynamic user data
//if you look at test you can put question thats more complicated than name or hello and will get to llm cant guarentee no bugs


export async function processAiLogic(messageEnvelope, setPrompt) {
    
    const session = getSession()
    const messages = [  
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage }
    ];

    // 3. Call External API
    const rawResponse = await sendToExternalAI(messages);

    // 4. Validate Format 
    let parsedData;
    try {
        const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
        parsedData = JSON.parse(cleanJson);
    } catch (e) {
        // Fallback if AI fails to give JSON
        parsedData = { reply: rawResponse, sentiment: "neutral", newFacts: {} };
    }

    // UPDATE THE SESSION 
    

    // // Update User Data if AI found new facts
    // if (parsedData.newFacts && Object.keys(parsedData.newFacts).length > 0) {
    //     const currentData = sessionInstance.userData || {};
    //     sessionInstance.setUserData({ ...currentData, ...parsedData.newFacts });
    // }

    return parsedData.reply;
}