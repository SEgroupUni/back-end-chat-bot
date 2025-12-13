export async function processAiLogic(messageEnvelope, sessionPrompt) {
    // Fast museum pattern matching (pre-filter)
    const userInput = String(messageEnvelope.userInput).toLowerCase().trim();
    const museumMatch = museumInfo.find(item => 
        userInput.includes(item.pattern.toLowerCase()) || 
        new RegExp(item.pattern, 'i').test(userInput)
    );

    if (museumMatch) {
        console.log("[AI Logic] Direct museum match - fast path");
        messageEnvelope.response = museumMatch.response;
        messageEnvelope.error = false;
        messageEnvelope.flagState = "frontFlow";
        messageEnvelope.componentUsed = "Direct Museum Match";
        return messageEnvelope;
    }

    // -----------------------------------------------------------------------
    // OPTIMIZED SYSTEM PROMPT (Preserving modular persona structure)
    // -----------------------------------------------------------------------
    let systemPrompt = "";

    if (typeof sessionPrompt === "object") {
        // Extract the out-of-date response text for fast access
        const outDateResponse = sessionPrompt.outDateRespond.includes("respond:") 
            ? sessionPrompt.outDateRespond.split("respond:")[1].trim()
            : sessionPrompt.outDateRespond;

        systemPrompt = `
CRITICAL PRIORITIES (In This Order):
1. RESPONSE FORMAT: ONLY output JSON: {"response": "text", "source": "museum|generated"}
2. SPEED: Think briefly, then respond. No lengthy reasoning.
3. BREVITY: ${sessionPrompt.lengthConstraint || "Max 50 words."}

PERSONA CORE:
- Role: ${sessionPrompt.rolePlay}
- Audience: ${sessionPrompt.generalAudience}
- Sentiment: ${sessionPrompt.sentiment || "informative"}


TIME BOUNDARY SYSTEM:
- KNOWLEDGE PERIOD: 1303–1213 BC ONLY (Your reign)
- IN-SCOPE: Your life, rule, battles, monuments, family, Egyptian society during your reign
- OUT-OF-SCOPE: Everything before 1303 BC or after 1213 BC

DECISION FLOW (Execute Sequentially):
1. TIME CHECK: Is question about 1303–1213 BC?
   - YES → Answer in character → {"response": "[character answer]", "source": "generated"}
   - NO → Use out-of-scope response → {"response": "${outDateResponse}", "source": "generated"}

2. MUSEUM CHECK: If user mentions "museum", "British Museum", "exhibit", "artifact" (but no pattern match)
   - Provide brief museum-appropriate context
   - ${sessionPrompt.expected}

HISTORY CONTEXT RULES:
- Use ONLY last user-assistant exchange for context
- Vague responses ("yes", "no", "ok") = continue previous topic
- No clarification questions EVER

FORMATTING MANDATES:
- ONE sentence for out-of-scope responses
- 2-3 sentences MAX for in-scope
- Never exceed 50 words total
- No apologies, no disclaimers
- No markdown, no explanations

FINAL OUTPUT FORMAT (EXACT):
{
  "response": "",
  "source": "generated"
}

REMEMBER: Fast thinking → Fast response. Your primary goal is speed.`;
    }

    // -----------------------------------------------------------------------
    // FAST HISTORY PROCESSING (Last 1 exchange only)
    // -----------------------------------------------------------------------
    let cleanHistory = [];
    try {
        let rawHistory = messageEnvelope.history;
        if (typeof rawHistory === "string") rawHistory = JSON.parse(rawHistory);
        
        if (Array.isArray(rawHistory) && rawHistory.length > 0) {
            // Take only the most recent exchange for speed
            const lastEntry = rawHistory[rawHistory.length - 1];
            
            if (lastEntry?.userInput?.trim()) {
                cleanHistory.push({ 
                    role: "user", 
                    content: lastEntry.userInput.trim().slice(0, 80) // Shorten
                });
            }
            if (lastEntry?.response?.trim()) {
                cleanHistory.push({ 
                    role: "assistant", 
                    content: lastEntry.response.trim().slice(0, 80) // Shorten
                });
            }
        }
    } catch (err) {
        console.warn("[AI Logic] History processing simplified:", err);
        // Continue without history if error
    }

    // -----------------------------------------------------------------------
    // OPTIMIZED MESSAGE PAYLOAD
    // -----------------------------------------------------------------------
    const messages = [
        { role: "system", content: systemPrompt },
        ...cleanHistory,
        { 
            role: "user", 
            content: userInput.slice(0, 100) // Limit input length
        }
    ];

    console.log("[AI Logic] Sending optimized request to LLM...");

    // -----------------------------------------------------------------------
    // OPTIMIZED API CALL WITH TOKEN LIMITS
    // -----------------------------------------------------------------------
    const result = await sendToExternalAI(messages, {
        max_tokens: 120,  // Reduced for faster generation
        temperature: 0.2,  // Lower for more consistent outputs
        top_p: 0.8,
        frequency_penalty: 0.5,  // Discourage repetition
        presence_penalty: 0.3
    });

    // -----------------------------------------------------------------------
    // FAST FALLBACK RESPONSES
    // -----------------------------------------------------------------------
    if (!result.ok) {
        // Quick fallback based on input type
        if (userInput.includes("museum") || userInput.includes("exhibit")) {
            messageEnvelope.response = "The British Museum houses many artifacts from my reign, including statues and inscriptions.";
        } else if (userInput.includes("when") || userInput.includes("year") || userInput.includes("century")) {
            messageEnvelope.response = "My godlike mind knows not what you mean, mortal. Such matters lie beyond the age of my reign.";
        } else {
            messageEnvelope.response = "Speak clearly, mortal, of matters from my time (1303–1213 BC).";
        }
        
        messageEnvelope.error = false;
        messageEnvelope.flagState = "frontFlow";
        messageEnvelope.componentUsed = "Optimized Fallback";
        return messageEnvelope;
    }

    // -----------------------------------------------------------------------
    // RAPID RESPONSE INTEGRATION
    // -----------------------------------------------------------------------
    const aiResponse = result.json?.response;
    
    if (!aiResponse) {
        // Ultra-fast default based on question type
        const isHistorical = /(ramesses|pharaoh|egypt|battle|temple|ancient)/i.test(userInput);
        
        messageEnvelope.response = isHistorical 
            ? "As Pharaoh Ramesses II, I rule Egypt with divine authority from 1303 to 1213 BC."
            : "My godlike mind knows not what you mean, mortal. Such matters lie beyond the age of my reign.";
    } else {
        messageEnvelope.response = aiResponse;
    }

    messageEnvelope.error = false;
    messageEnvelope.flagState = "frontFlow";
    messageEnvelope.componentUsed = "Optimized LLM";

    return messageEnvelope;
}