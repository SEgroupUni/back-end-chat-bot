import { sendToExternalAI } from "./externalApiClient.js";
import { getSession } from "../session/sessionState.js";
// ive done aiInPut gatewat updated the code for
//prompt in persona and in session manager for dynamic prompt, you can convert this to a script an pass as message along with user msg or what ever, message envelope object so look at this.currentSessionObj for elements, 
// history is now a set of user and bot respones json made in session manager before you were sending a list of objects full of all sorts
// when get posistibr message from llm use command update messageEnvelope response and flagstate to frontFlow
// if you get catch or error up date messageEnvelope.git error and update flag state to error. look at aiInputGateway for example
// then run cmd session.processSessionObj(messageEnvelope) can litterall
// ive commented out some parts we can keep i just dont know how to use them as dialogue system is auto pipeline and currently dont know how to use dynamic user data
//if you look at test you can put quesion in more complicated than name or hello and will get to llm cant guarentee not bugs


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