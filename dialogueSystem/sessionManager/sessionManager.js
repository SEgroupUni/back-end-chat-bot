import { intentController } from "../intentEngine/intentController.js";
import { finishCycle } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from "../../externalAiIntegration/sessionInputGateway.js";
import { promptGateway } from "../dialogueGuide/promptGateWay.js";
import fileSaver from "../endSessionManager/fileSaver.js";
import  errorGateway  from "../errorHandler/errorGateway.js";

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
            errorCount: 0,
            errMsg: null,
            history: [],
            
        };

        /** @type {Array<{ step: (obj: any) => Promise<void>, flagState: string }>} */
        this.pipeline = [
            { step: intentController, flagState: "intEngine" },
            { step: handleAiRequest, flagState: "aiRequest" },
            { step: promptGateway, flagState: "prompt" },
            { step: errorGateway, flagState: "error"},
            { step: finishCycle, flagState: "frontFlow" },
            { step: fileSaver, flagState: "endSession" }
        ];
    }


    // --- User interaction entry point ---
    async setUserInput(userInput) {

        this.currentSessionObj.userInput = userInput;
        this.setHistory();

        // (KEEPING BEHAVIOR AS YOU REQUESTED)
        if (userInput !== 'no input') {
            this.currentSessionObj.flagState = "intEngine";
        } else {
            this.currentSessionObj.flagState = "error";
        }

        return await this.runPipeline();
    }


    // --- Logging for persistence/debug ---
    logSessionObj(messageEnvelope) {
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


    // --- Session State Management ---

    processSessionObj(messageEnvelope) {
        this.currentSessionObj.flagState = messageEnvelope.flagState;
        this.currentSessionObj.response = messageEnvelope.response;
        this.currentSessionObj.error = messageEnvelope.error;
        this.currentSessionObj.userPrompt = messageEnvelope.userPrompt;
        //switch to pass this.logSessionObj
    }

    flushSessionObject() {
        this.currentSessionObj = {
            ...this.currentSessionObj,
            userInput: null,
            response: null,
            userPrompt: null,
            flagState: null,
        };
    }

    setHistory() {
        this.currentSessionObj.history = [...this.sessionLog].slice(-5);
    }

    testFlush() {
        console.log(this.currentSessionObj);
    }
}

export default Session;
