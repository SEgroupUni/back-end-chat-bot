import { intentController } from "../intentEngine/intentController.js";
import { frontFlowGateRouter } from "../dataGateway/gateRouter.js";

class Session {

    constructor(initialData) {

        if (!initialData) {
            throw new Error('Session requires initial persona data.');
        }

        this.id = new Date().toISOString();
        this.userData = null;
        this.sessionLog = [];
        this.sessionPrompt;
        this.persona = initialData;

        this.currentSessionObj = {
            userInput: null,
            response: null,
            userPrompt: null,
            flagState: null,
            sessionData: null
        };

        /** @type {Array<{ step: (obj: any) => Promise<void>, flagState: string }>} */
        this.pipeline = [
            { step: intentController, flagState: "intEngine" },
            { step: frontFlowGateRouter, flagState: "frontFlow" }
        ];
    }

    // --- User interaction entry point ---
    setUserInput(userInput) {
        this.currentSessionObj.userInput = userInput;
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
            sessionData: null
        };
    }

    // Only updates session state — does NOT trigger pipeline again
    processSessionObj(messageEnvelope) {
        this.currentSessionObj.flagState = messageEnvelope.flagState;
        this.currentSessionObj.response = messageEnvelope.response;
        this.currentSessionObj.sessionData = {
            intent: messageEnvelope.intent,
            componentUsed: messageEnvelope.componentUsed,
            score: messageEnvelope.score
        };
    }
    testFlush(){
        console.log(this.currentSessionObj)
    }
}

export default Session;
