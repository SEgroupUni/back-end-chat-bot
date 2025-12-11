import express from 'express';
import { sessionGateRouter } from '../../dialogueSystem/dataGateway/gateRouter.js';
import { errorReload } from '../../dialogueSystem/endSessionManager/errorReload.js';
import leoProfanity from "leo-profanity";
/**
 * Message Route Handler
 * ---------------------
 * This endpoint receives user messages from the frontend and routes them
 * through the dialogue system pipeline.
 *
 * Responsibilities:
 *  - Accept `userInput` from POST requests
 *  - Run profanity filtering using `leo-profanity`
 *  - Forward clean input to the session pipeline (`sessionGateRouter`)
 *  - If the pipeline reports an error, trigger session restoration via `errorReload`
 *  - Return the final chatbot response and optional userPrompt
 *
 * Notes:
 *  - No session creation is done here; that is handled in the session route.
 */



const router = express.Router();

// Create profanity filter
leoProfanity.loadDictionary();

router.post('/', async (req, res, next) => {
  try {
    const { userInput } = req.body;

    if (leoProfanity.check(userInput)) { //profanity check
      return res.json({
        response: 
          "Please speak respectfully in my presence. I will not respond to such language.", 
        userPrompt: null
      });
    }

    // Normal processing if clean
    let result = await sessionGateRouter(userInput);

    // If there's an error, perform the error reload
    if (result.error === true) {
      result = await errorReload();
    }

    // Send the response back to the client
    res.json({
      response: result.response,
      userPrompt: result.userPrompt
    });

  } catch (err) {
    next(err);
  }
});

export default router;
