import { promptModel } from "./promptModel.js";

/**
 * promptLogic.js
 * ----------------
 * Coordinates the semantic prompt engine with the dialogue flow.
 *
 * This module takes the current message envelope, runs the semantic
 * transition model to see whether the system should offer a guided
 * follow-up prompt, and updates the envelope accordingly.
 *
 * It does NOT modify conversation content or logic — only adds or clears
 * the optional `userPrompt` field and sets the flow flag.
 *
 */



export function promptLogic(messageEnvelope) {
  
  // Run the transition model to see if a next-intent prompt is recommended
  const prediction = promptModel(messageEnvelope.intent, messageEnvelope.history);
  console.log(prediction);

  if (prediction && prediction.promptMsg) {
    // Model confidently produced a suggested next intent/prompt
    messageEnvelope.userPrompt = prediction.promptMsg;
    messageEnvelope.promptIntent = prediction.intent;
    messageEnvelope.flagState = "frontFlow";  // Continue standard flow with prompt
  } else {
    // No strong follow-up found — continue flow without prompting
    messageEnvelope.userPrompt = null;
    messageEnvelope.flagState = "frontFlow";
  }

  return messageEnvelope;
}

