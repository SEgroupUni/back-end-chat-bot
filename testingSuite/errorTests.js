// dialogueSystem/tests/fullErrorTest.js
// Run with:  node dialogueSystem/tests/fullErrorTest.js

import { createSession, sessionGateRouter } 
    from "../dialogueSystem/dataGateway/gateRouter.js";

import { errorReload } 
    from "../dialogueSystem/endSessionManager/errorReload.js";

import { errorGateway } 
    from "../dialogueSystem/errorHandler/errorGateway.js";

import { getSession, deleteSession } 
    from "../liveSessionState/sessionState.js";

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

// Helper to reset and start a fresh session
function resetSession(personaName = "ramesses") {
  deleteSession();
  const created = createSession(personaName);
  if (!created) {
    throw new Error(`Failed to create session for persona: ${personaName}`);
  }
  return getSession();
}

// Build a generic error envelope to feed into errorGateway
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
/* 1. inputError: errMsg = "no input" (no user input case)            */
/* ------------------------------------------------------------------ */
async function test_inputError() {
  resetSession();

  console.log("\n######## TEST: inputError (no input via sessionGateRouter) ########");

  // Passing null will cause gateRouter to convert to "no input",
  // Session.setUserInput will set errMsg="no input" and flagState="error"
  await sessionGateRouter(null);

  logState("After inputError flow (expected: componentUsed='error input')");
}

/* ------------------------------------------------------------------ */
/* 2. noReturnMsg: errMsg = "no return msg"                           */
/* ------------------------------------------------------------------ */
async function test_noReturnMsg() {
  resetSession();

  console.log("\n######## TEST: noReturnMsg (no return from previous stage) ########");

  const env = buildErrorEnvelope({
    errMsg: "no return msg",
    userInput: null,
    response: null,
  });

  // Directly call errorGateway → errorSwitch → noReturnMsg
  errorGateway(env);

  logState(
    "After noReturnMsg via errorGateway (expected: flagState='frontFlow' or 'intEngine', componentUsed='error return')"
  );
}

/* ------------------------------------------------------------------ */
/* 3. gatewayVerification: errMsg = "AI gateway verification fail"    */
/*    We test one branch: input present + history present → intEngine */
/* ------------------------------------------------------------------ */
async function test_gatewayVerification() {
  resetSession();

  console.log("\n######## TEST: gatewayVerification ########");

  const session = getSession();
  // Make sure session thinks it has user input and history
  session.currentSessionObj.userInput = "test user input";
  session.currentSessionObj.history = [{ userInput: "prev", response: "prev" }];

  const env = buildErrorEnvelope({
    errMsg: "AI gateway verification fail",
  });

  errorGateway(env);

  logState(
    "After gatewayVerification (expected: flagState='intEngine', componentUsed='error gateway')"
  );
}

/* ------------------------------------------------------------------ */
/* 4. historyParseError: errMsg = 'History parsing failed'            */
/*    We test histBool=true → flagState='aiRequest'                   */
/* ------------------------------------------------------------------ */
async function test_historyParseError() {
  resetSession();

  console.log("\n######## TEST: historyParseError ########");

  const session = getSession();
  // Make history truthy
  session.currentSessionObj.history = [{ userInput: "u", response: "r" }];

  const env = buildErrorEnvelope({
    errMsg: "History parsing failed",
  });

  errorGateway(env);

  logState(
    "After historyParseError (expected: flagState='aiRequest', componentUsed='history parse')"
  );
}

/* ------------------------------------------------------------------ */
/* 5. missingTokenError: errMsg = 'Missing HUGGINGFACE_TOKEN'         */
/*    We simulate missing token by clearing env var                   */
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

  logState(
    "After missingTokenError (expected: flagState='endSession' when no token, componentUsed='token missing')"
  );

  // Restore env to be safe
  if (oldToken !== undefined) {
    process.env.HUGGINGFACE_TOKEN = oldToken;
  }
}

/* ------------------------------------------------------------------ */
/* 6. aiRecycle: HF_* error codes → aiRecycle                         */
/* ------------------------------------------------------------------ */
async function test_aiRecycle() {
  resetSession();

  console.log("\n######## TEST: aiRecycle (HF_HTTP_ERROR) ########");

  const env = buildErrorEnvelope({
    errMsg: "HF_HTTP_ERROR",
  });

  errorGateway(env);

  logState(
    "After aiRecycle (expected: flagState='aiRequest', componentUsed='network error')"
  );
}

/* ------------------------------------------------------------------ */
/* 7. errorReload: use fileSaver's log.json and replay last input     */
/* ------------------------------------------------------------------ */
async function test_errorReload() {
  console.log("\n######## TEST: errorReload ########");

  // Start fresh session and run one normal input
  resetSession();
  await sessionGateRouter("hello from user");

  // Now force an "endSession" to trigger fileSaver & log.json
  const session = getSession();
  session.endSession(); // sets flagState='endSession' and runs pipeline → fileSaver

  // Allow a tick for async pipeline completion
  await new Promise((resolve) => setTimeout(resolve, 250));

  console.log("\n--- Calling errorReload() ---");
  const reloadResult = await errorReload();
  console.log("errorReload() returned:", reloadResult);

  // After reload, a new session should exist and the last user input replayed
  logState(
    "After errorReload (expected: session restored and pipeline re-run on lastUserInput)"
  );
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
    await test_errorReload();

    console.log("\n######## ALL ERROR TESTS COMPLETED ########\n");
  } catch (err) {
    console.error("Test runner crashed with error:", err);
  }
}

main();
