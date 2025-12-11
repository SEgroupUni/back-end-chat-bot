/**
 * errorTests.js
 * Run with: node testingSuite/errorTests.js
 */

import { sessionGateRouter } 
  from "../dialogueSystem/dataGateway/gateRouter.js";

import { errorReload } 
  from "../dialogueSystem/endSessionManager/errorReload.js";

import { errorGateway } 
  from "../dialogueSystem/errorHandler/errorGateway.js";

import { getSession, deleteSession } 
  from "../liveSessionState/sessionState.js";

/* ------------------------------------------------------------------ */
/* Utility Functions                                                  */
/* ------------------------------------------------------------------ */

function logState(label) {
  const session = getSession();
  const s = session.currentSessionObj;

  console.log(`\n=== ${label} ===`);
  console.log({
    flagState: s.flagState,
    error: s.error,
    errMsg: s.errMsg,
    errorMsg: s.errorMsg,
    errorCount: s.errorCount,
    componentUsed: s.componentUsed,
    userInput: s.userInput,
    response: s.response,
  });
}

/**
 * Reset Session — now matches real system design
 * - delete current session
 * - let getSession() rebuild it automatically
 */
function resetSession(personaName = "ramesses") {
  deleteSession();
  return getSession(personaName);
}

/**
 * Build an error envelope that reflects your actual session object shape.
 */
function buildErrorEnvelope(overrides = {}) {
  const session = getSession();
  const base = session.currentSessionObj || {};

  return {
    userInput: base.userInput ?? null,
    response: base.response ?? null,
    userPrompt: base.userPrompt ?? null,
    promptIntent: base.promptIntent ?? null,
    flagState: "error",
    error: true,
    errorCount: base.errorCount ?? 0,
    errMsg: null,
    history: base.history ?? [],
    componentUsed: "test harness",
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* TEST 1: inputError                                                 */
/* ------------------------------------------------------------------ */
async function test_inputError() {
  resetSession();

  console.log("\n######## TEST: inputError ########");

  await sessionGateRouter(null);

  logState("After inputError");
}

/* ------------------------------------------------------------------ */
/* TEST 2: noReturnMsg                                                */
/* ------------------------------------------------------------------ */
async function test_noReturnMsg() {
  resetSession();

  console.log("\n######## TEST: noReturnMsg ########");

  const env = buildErrorEnvelope({
    errMsg: "no return msg",
    userInput: null,
    response: null,
  });

  errorGateway(env);
  logState("After noReturnMsg");
}

/* ------------------------------------------------------------------ */
/* TEST 3: gatewayVerification                                        */
/* ------------------------------------------------------------------ */
async function test_gatewayVerification() {
  resetSession();

  console.log("\n######## TEST: gatewayVerification ########");

  const session = getSession();
  session.currentSessionObj.userInput = "test user input";
  session.currentSessionObj.history = [{ userInput: "prev", response: "prev" }];

  const env = buildErrorEnvelope({
    errMsg: "AI gateway verification fail",
  });

  errorGateway(env);

  logState("After gatewayVerification");
}

/* ------------------------------------------------------------------ */
/* TEST 4: historyParseError                                          */
/* ------------------------------------------------------------------ */
async function test_historyParseError() {
  resetSession();

  console.log("\n######## TEST: historyParseError ########");

  const session = getSession();
  session.currentSessionObj.history = [{ userInput: "u", response: "r" }];

  const env = buildErrorEnvelope({
    errMsg: "History parsing failed",
  });

  errorGateway(env);

  logState("After historyParseError");
}

/* ------------------------------------------------------------------ */
/* TEST 5: missingTokenError                                          */
/* ------------------------------------------------------------------ */
async function test_missingTokenError() {
  resetSession();

  console.log("\n######## TEST: missingTokenError ########");

  const oldToken = process.env.HUGGINGFACE_TOKEN;
  delete process.env.HUGGINGFACE_TOKEN;

  const env = buildErrorEnvelope({
    errMsg: "Missing HUGGINGFACE_TOKEN",
  });

  errorGateway(env);

  logState("After missingTokenError");

  if (oldToken !== undefined) {
    process.env.HUGGINGFACE_TOKEN = oldToken;
  }
}

/* ------------------------------------------------------------------ */
/* TEST 6: aiRecycle                                                  */
/* ------------------------------------------------------------------ */
async function test_aiRecycle() {
  resetSession();

  console.log("\n######## TEST: aiRecycle ########");

  const env = buildErrorEnvelope({
    errMsg: "HF_HTTP_ERROR",
  });

  errorGateway(env);

  logState("After aiRecycle");
}

/* ------------------------------------------------------------------ */
/* TEST 7: errorCountReset                                            */
/* ------------------------------------------------------------------ */
async function test_errorCountReset() {
  resetSession();

  console.log("\n######## TEST: errorCountReset ########");

  for (let i = 0; i <= 3; i++) {
    const env = buildErrorEnvelope({
      errMsg: "Simulated error " + (i + 1),
      errorCount: i,
    });

    errorGateway(env);
  }

  logState("After 4 consecutive errors");
}

/* ------------------------------------------------------------------ */
/* TEST 8: errorReload                                                */
/* ------------------------------------------------------------------ */
async function test_errorReload() {
  resetSession();

  console.log("\n######## TEST: errorReload ########");

  await sessionGateRouter("where were you born");

  const session = getSession();
  session.endSession();

  await new Promise((resolve) => setTimeout(resolve, 250));

  console.log("\n--- Calling errorReload() ---");
  const result = await errorReload();

  console.log("errorReload() returned:", result);

  logState("After errorReload");
}

/* ------------------------------------------------------------------ */
/* MAIN RUNNER                                                        */
/* ------------------------------------------------------------------ */
async function main() {
  try {
    await test_inputError();
    await test_noReturnMsg();
    await test_gatewayVerification();
    await test_historyParseError();
    await test_missingTokenError();
    await test_aiRecycle();
    await test_errorCountReset();
    await test_errorReload();

    console.log("\n######## ALL ERROR TESTS COMPLETED ########\n");
  } catch (err) {
    console.error("Test runner crashed:", err);
  }
}

main();
