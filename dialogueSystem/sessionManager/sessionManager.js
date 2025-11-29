import { intentController } from "../intentEngine/intentController.js";
import { frontFlowGateRouter } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from "../../externalAiIntegration/aiInputGateway.js";
import { promptGateway } from "../dialogueGuide/promptGateWay.js";
import { getSession } from "../../liveSessionState/sessionState.js";
import path from 'path';
import fs from 'fs';

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
            { step: intentController, flagState: "intEngine" },
            { step: frontFlowGateRouter, flagState: "frontFlow" },
            {step: handleAiRequest, flagState: 'aiRequest'},
            {step: promptGateway, flagState: 'prompt'} 
        ];
    }

    // --- User interaction entry point ---
    setUserInput(userInput) {
        this.currentSessionObj.userInput = userInput;
        this.setHistory()
        this.runPipeline();
    }


    SessionSave(){
        // finds the file to save the data into
        const sessionFilePath = path.join(process.cwd(),'log.json');
        let savedSessions = {};
        if (fs.existsSync(sessionFilePath)){
            const fileData = fs.readFileSync(sessionFilePath, 'utf-8')
            if (fileData.trim().length > 0){
                //downloads all previous sessions so they don't get cleared on file save
                savedSessions = JSON.parse(fileData)
            }
        }
        //gets the current session
        const currentSession = getSession()


        const sessionData = {
            id: currentSession.id,
            sessionLog: currentSession.sessionLog
        };
        //appends the current session data to all previous sessions
        savedSessions[currentSession.id] = sessionData;
        //writes everything into the JSON file
        fs.writeFileSync(sessionFilePath, JSON.stringify(savedSessions, null, 2), 'utf-8')
        sessionData = {
            id: null,
            sessionLog: null
        };
    }


    setFlagState(flagState) {
        this.currentSessionObj.flagState = flagState;
    }

    logSessionEnvelopes(messageEnvelope) {
        this.sessionLog.push(messageEnvelope);
    }
    setSessionPrompt() {

    // update dynamic fields inside the object
    this.sessionPrompt.currentSpecific = this.userData.visitor;
    this.sessionPrompt.currentAge = this.userData.age;

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


