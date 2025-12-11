import { intentController } from "../intentEngine/intentGateway.js";
import { finishCycle } from "../dataGateway/gateRouter.js";
import { handleAiRequest } from "../../externalAiIntegration/sessionInputGateway.js";
import { promptGateway } from "../dialogueGuide/promptGateWay.js";
import fileSaver from "../endSessionManager/fileSaver.js";
import { errorGateway }  from "../errorHandler/errorGateway.js";
/**
 * Session.js
 * ---------------------------------------------------------------
 * This class manages:
 *   • The entire conversation pipeline state machine
 *   • Session memory (sessionLog, current envelope)
 *   • Transitioning between pipeline stages based on flagState
 *   • Error handling, logging, and clean persistence
 *
 * The pipeline flow is:
 *      intEngine → aiRequest → prompt → frontFlow → endSession
 *
 * Errors are routed through:
 *      errorGateway → errorSwitch → handler functions
 
 */


class Session {

    constructor(initialData) {

        if (!initialData) {
            throw new Error('Session requires initial persona data.');
        }

        // Session identity + persona config
        this.id = new Date().toISOString();
        this.sessionLog = [];
        this.sessionPrompt = initialData;
        this.sessionPersona = initialData.name;

        // Active working envelope (updated each pipeline step)
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

        /**
         * PIPELINE DEFINITION
         * Each entry has:
         *   step: function to execute
         *   flagState: when currentSessionObj.flagState === this value,
         *              that step is executed.
         */
        this.pipeline = [
            { step: intentController, flagState: "intEngine" },
            { step: handleAiRequest, flagState: "aiRequest" },
            { step: promptGateway, flagState: "prompt" },
            { step: errorGateway, flagState: "error"},
            { step: finishCycle, flagState: "frontFlow" },
            { step: fileSaver, flagState: "endSession" }
        ];
    }


    /**
     * Entry point for new user messages.
     * Sets the input, updates history, and kicks off the pipeline.
     */
    async setUserInput(userInput) {

        this.currentSessionObj.userInput = userInput;
        this.setHistory();

        // Manual session end command
        if (userInput === 'end session') {
            this.currentSessionObj.flagState = 'endSession';
            return await this.runPipeline();
        }

        // Normal message
        if (userInput !== 'no input') {
            this.currentSessionObj.flagState = "intEngine";
        } 
        else {
            // Error — no input provided
            this.currentSessionObj.flagState = "error";
            this.currentSessionObj.errMsg = 'no input';
            this.currentSessionObj.error = true;
        }

        return await this.runPipeline();
    }


    /**
     * Snapshot logger:
     *  - Clones current session object
     *  - Removes history to avoid recursive growth
     *  - Stores in sessionLog
     */
    logSessionObj() {
        this.currentSessionObj.history = [];

        const logObj = structuredClone(this.currentSessionObj);
        this.sessionLog.push(logObj);
    }


    /**
     * Load previously saved sessionLog back into memory.
     */
    loadSessionLog(PastSessionLog = []) {
        for (let i = 0; i < PastSessionLog.length; i++){
            this.sessionLog.push(PastSessionLog[i]);
        }
    }


    /**
     * Core pipeline engine.
     * Continues executing steps until flagState no longer changes.
     */
    async runPipeline() {
        let lastFlag = null;

        while (lastFlag !== this.currentSessionObj.flagState) {
            lastFlag = this.currentSessionObj.flagState;

            const stage = this.pipeline.find(
                s => s.flagState === this.currentSessionObj.flagState
            );

            if (!stage) {
                console.log("Pipeline ended — no matching stage.");
                this.logSessionObj();
                break;
            }

            // SPECIAL: endSession should log before final execution
            if (stage.flagState === "endSession") {
                this.logSessionObj();
                await stage.step(
                    this.currentSessionObj,
                    this.sessionPrompt,
                    this.sessionLog,
                    this.id,
                    this
                );
                continue;
            }

            // Normal execution path
            await stage.step(
                this.currentSessionObj,
                this.sessionPrompt,
                this
            );
        }
    }


    /**
     * Safely replace the working session object.
     * Logs errors immediately before continuing.
     */
    processSessionObj(messageEnvelope) {
        const logObj = structuredClone(messageEnvelope);
        this.currentSessionObj = logObj;

        if (this.currentSessionObj.error) {
            this.logSessionObj();
        }
    }


    /**
     * Clears the working envelope but keeps persona/session identity.
     */
    flushSessionObject() {
        this.currentSessionObj = {
            ...this.currentSessionObj,
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
    }


    /**
     * Set history to last 5 snapshots.
     */
    setHistory() {
        this.currentSessionObj.history = [...this.sessionLog].slice(-5);
    }


    /** Debug helper */
    testFlush() {
        console.log(this.currentSessionObj);
    }

    /** API-friendly wrapper to end session manually */
    endSession(){
        this.currentSessionObj.flagState = 'endSession';
        this.runPipeline();
    }

    
    getSessionPersona(){
        return this.sessionPersona
    }
    // Small boolean utilities for error-handling logic
    getUserInputBool(){
        return this.currentSessionObj.userInput ? true : false;
    }

    getpromptBool(){
        return this.sessionPrompt ? true : false;
    }

    getHistoryBool(){
        return this.currentSessionObj.history ? true : false;
    }

    // Testing functions
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
