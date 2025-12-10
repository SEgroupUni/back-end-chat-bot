import { intentController } from "../intentEngine/intentController.js";
import { finishCycle } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from "../../externalAiIntegration/sessionInputGateway.js";
import { promptGateway } from "../dialogueGuide/promptGateWay.js";
import fileSaver from "../endSessionManager/fileSaver.js";
import { errorGateway }  from "../errorHandler/errorGateway.js";

class Session {

    constructor(initialData) {

        if (!initialData) {
            throw new Error('Session requires initial persona data.');
        }

        this.id = new Date().toISOString();
        this.sessionLog = [];
        this.sessionPrompt = initialData;
        this.sessionPersona = initialData.name

        this.currentSessionObj = {
            userInput: null,
            response: null,
            userPrompt: null,
            promptIntent: null,
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
        if(userInput === 'end session'){
            this.currentSessionObj.flagState = 'endSession'
            return await this.runPipeline();
        }
        if (userInput !== 'no input') {
            this.currentSessionObj.flagState = "intEngine";
            
        } else {
            this.currentSessionObj.flagState = "error";
            this.currentSessionObj.errMsg = 'no input'
            this.currentSessionObj.error = true
        }

        return await this.runPipeline();
    }


    // Logging clone for persistence/debug 
    logSessionObj() {
    // delete history as it is a snapshot of session log
    this.currentSessionObj.history = []
        // 1. Store a copy, not previous memory reference only one
    const logObj = structuredClone(this.currentSessionObj);

    // 2. Push that snapshot so history is frozen in time
    this.sessionLog.push(logObj);
}
    //restoring a past session log
    loadSessionLog(PastSessionLog = []) {
        for (let i = 0; i < PastSessionLog.length; i++){
            this.sessionLog.push(PastSessionLog[i]);
        }
    }


/// --- Core Conversation Pipeline Engine ---
async runPipeline() {
    let lastFlag = null;

    while (lastFlag !== this.currentSessionObj.flagState) {
        lastFlag = this.currentSessionObj.flagState;

        const stage = this.pipeline.find(
            s => s.flagState === this.currentSessionObj.flagState
        );

        if (!stage) {
            console.log("Pipeline ended — no matching stage.");
            this.logSessionObj();    // <-- only log happens here
            break;
        }

        // Special handling for endSession
        if (stage.flagState === "endSession") {
            this.logSessionObj();    // <-- good: log before ending
            await stage.step(
                this.currentSessionObj,
                this.sessionPrompt,
                this.sessionLog,
                this.id,
                this
            );
            continue;
        }

        // Normal stages
        await stage.step(
            this.currentSessionObj,
            this.sessionPrompt,
            this
        );

    }
}


    processSessionObj(messageEnvelope) {
    // Replace current object with a clone break reference connection
    const logObj = structuredClone(messageEnvelope)
    this.currentSessionObj = logObj;

    // If it contains an error, log before cont with pipeline
    if (this.currentSessionObj.error) {
        this.logSessionObj();}
    
}

    flushSessionObject() {
        this.currentSessionObj = {
            ...this.currentSessionObj,
            userInput: null,
            response: null,
            userPrompt: null,
            promptInent: null,
            flagState: null,
            error: false,
            errorCount: 0,
            errMsg: null,
            history: [],
        };
    }

    setHistory() {
        this.currentSessionObj.history = [...this.sessionLog].slice(-5);
    }

    testFlush() {
        console.log(this.currentSessionObj);
    }
    endSession(){
        this.currentSessionObj.flagState = 'endSession'
        this.runPipeline()
    }
    getUserInputBool(){
        return this.currentSessionObj.userInput? true : false
    }
    getpromptBool(){
        return this.sessionPrompt? true : false
    }
    getHistoryBool(){
        return this.currentSessionObj.history? true : false
    }
    testErrorUserInput(){
        this.currentSessionObj.userInput = null;
    }
    testErrorNoReturn(){
        this.currentSessionObj.response = null;
    }
    
    testNohistory(){
        this.currentSessionObj.history = null;
    }

}

export default Session;
