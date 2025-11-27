import { intentController } from "../intentEngine/intentController.js";
import { frontFlowGateRouter } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from '../externalAiIntegration/aiInputGateway.js'

class Session {

    constructor(initialData) {

        if (!initialData) {
            throw new Error('Session requires initial persona data.');
        }

        this.id = new Date().toISOString();
        this.userData = {
            age : '18+',
            visitor: 'casual'
        };
        this.sessionLog = [];
        this.sessionPrompt = {};
        this.persona = initialData;

        this.currentSessionObj = {
            userInput: null,
            response: null,
            userPrompt: null,
            flagState: null,
            error: false,
            history, 
        };

        /** @type {Array<{ step: (obj: any) => Promise<void>, flagState: string }>} */
        this.pipeline = [
            { step: intentController, flagState: "intEngine" },
            { step: frontFlowGateRouter, flagState: "frontFlow" },
            {step: handleAiRequest, flagState: 'aiRequest'}
        ];
    }

    // --- User interaction entry point ---
    setUserInput(userInput) {
        this.currentSessionObj.userInput = userInput;
        this.setHistory()
        this.runPipeline();
    }

    // --- Runtime session methods ---

    setUserData(userData) {
        this.userData = userData;
        
    }

    setFlagState(flagState) {
        this.currentSessionObj.flagState = flagState;
    }

    logSessionEnvelopes(messageEnvelope) {
        this.sessionLog.push(messageEnvelope);
    }
    setSessionPrompt(personaPrompt) {

    // update dynamic fields inside the object
    personaPrompt.currentSpecific = this.userData.visitor;
    personaPrompt.currentAge = this.userData.age;

    // store as object in session
    this.sessionPrompt = personaPrompt;
}

    // --- Core Conversation Pipeline Engine ---
    async runPipeline() {
        let lastFlag = null;

        while (lastFlag !== this.currentSessionObj.flagState) {
            lastFlag = this.currentSessionObj.flagState;

            const stage = this.pipeline.find(
                s => s.flagState === this.currentSessionObj.flagState
            );

            if (!stage) {
                console.log("Pipeline ended — no matching stage.");
                break;
            }

            await stage.step(this.currentSessionObj);
        }
    }

    // --- Session Lifecycle Methods ---

    flushSessionObject() {
        this.currentSessionObj = {
            userInput: null,
            response: null,
            userPrompt: null,
            flagState: null,
            
        };
    }

    // Only updates session state — does NOT trigger pipeline again
    processSessionObj(messageEnvelope){
        this.currentSessionObj.flagState = messageEnvelope.flagState;
        this.currentSessionObj.response = messageEnvelope.response;
        this.currentSessionObj.error = messageEnvelope.error
            
        };
    
    testFlush(){
        console.log(this.currentSessionObj)
    }
    setHistory() {
    // Filter sessionLog to only entries that contain both userInput and response
    const pairs = this.sessionLog.filter(entry => entry.userInput && entry.response);

    // Take last 3 pairs
    const lastThree = pairs.slice(-3);

    // Create simplified objects
    const formatted = lastThree.map(pair => ({
        user: pair.userInput,
        bot: pair.response
    }));

    // Store as JSON string
    this.currentSessionObj.history = JSON.stringify(formatted);
}
}


export default Session;
