import { sendToExternalAI } from "./externalApiClient.js";

export async function processAiLogic(sessionInstance, userMessage) {
    
    const history = sessionInstance.sessionLog.slice(-5).map(entry => ({
        role: entry.source === "User" ? "user" : "assistant",
        content: entry.text || entry.reply
    }));

    // 2. Enforce JSON format
    const systemPrompt = `
        You are ${sessionInstance.persona.name}.
        Respond in JSON format ONLY.
        {
            "sentiment": "positive|neutral|negative",
            "reply": "Your response here",
            "newFacts": { "topic": "detected topic" }
        }
    `;

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
    
    // Log the interaction
    sessionInstance.logSessionEnvelopes({
        timestamp: new Date(),
        source: "AI",
        reply: parsedData.reply,
        sentiment: parsedData.sentiment
    });

    // Update User Data if AI found new facts
    if (parsedData.newFacts && Object.keys(parsedData.newFacts).length > 0) {
        const currentData = sessionInstance.userData || {};
        sessionInstance.setUserData({ ...currentData, ...parsedData.newFacts });
    }

    return parsedData.reply;
}