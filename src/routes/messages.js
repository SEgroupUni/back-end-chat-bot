import express from 'express';
import { sessionGateRouter } from '../../dialogueSystem/dataGateway/gateRouter.js';
import { errorReload } from '../../dialogueSystem/endSessionManager/errorReload.js';
import leoProfanity from "leo-profanity";

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