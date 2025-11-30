import { intentController } from "../intentEngine/intentController.js";
import { finishCycle } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from "../../externalAiIntegration/sessionInputGateway.js";
import { promptGateway } from "../dialogueGuide/promptGateWay.js";
import fileSaver from "../endSessionManager/fileSaver.js";

class Session {

    constructor(initialData) {

        if (!initialData) {
            throw new Error('Session requires initial persona data.');
        }

        this.id = new Date().toISOString();
        this.sessionLog = [];
        this.sessionPrompt = initialData;
        this.currentSessionObj = {
            userInput: null,
            response: null,
            userPrompt: null,
            flagState: null,
            error: false,
            history: [], 
        };

    /** @type {Array<{ step: (obj: any) => Promise<void>, flagState: string }>} */
    this.pipeline = [
    { step: intentController, flagState: "intEngine" },// stat at local intent classifier
    { step: handleAiRequest, flagState: "aiRequest" }, // external api to LLM
    { step: promptGateway, flagState: "prompt" },// get predicted next topic to suggest
    { step: finishCycle, flagState: "frontFlow" }, // end cycle
    { step: fileSaver, flagState: "endSession" }   // optional final persistence
    ];
    }

    // --- User interaction entry point ---
    async setUserInput(userInput) {
    this.currentSessionObj.userInput = userInput;
    this.setHistory();

    // THIS starts the pipeline correctly
    this.currentSessionObj.flagState = "intEngine";

    return await this.runPipeline();
}   

logSessionEnvelopes(messageEnvelope) {
        this.sessionLog.push(messageEnvelope);
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

            await stage.step(this.currentSessionObj, this.sessionPrompt, this);
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
        this.userPrompt = messageEnvelope.userPrompt
        };
    
    testFlush(){
        console.log(this.currentSessionObj)
    }
    setHistory(){
        this.currentSessionObj.history = this.sessionLog.slice(-5)
    }
}



export default Session;


