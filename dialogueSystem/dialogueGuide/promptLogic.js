import { promptModel } from "./promptModel.js";
export function promptLogic(messageEnvelope) {
  
  const prediction = promptModel(messageEnvelope.intent, messageEnvelope.history);
  console.log(prediction)
  if (prediction && prediction.promptMsg) {
    // Model found a meaningful next intent
    messageEnvelope.userPrompt = prediction.promptMsg;
    messageEnvelope.promptIntent = prediction.intent
    messageEnvelope.flagState = "frontFlow";
  } else {
    // Model did not find a confident next step
    messageEnvelope.userPrompt = null;
    messageEnvelope.flagState = "frontFlow";
  }

  return messageEnvelope;
}

