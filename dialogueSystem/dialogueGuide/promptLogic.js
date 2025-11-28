import { semInnerModel } from "./semInnerModel.js";

export function promptLogic(messageEnvelope) {
  
  const prediction = semInnerModel(messageEnvelope.intent, messageEnvelope.history);

  if (prediction) {
    // Model found a meaningful next intent
    messageEnvelope.userPrompt = prediction.promptMsg;
    messageEnvelope.flagState = "frontFlow";
  } else {
    // Model did not find a confident next step
    messageEnvelope.userPrompt = null;
    messageEnvelope.flagState = "frontFlow";
  }

  return messageEnvelope;
}
