import express from 'express';
import { sessionGateRouter } from '../../dialogueSystem/dataGateway/gateRouter.js';
import { errorReload } from '../../dialogueSystem/endSessionManager/errorReload.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { userInput } = req.body;

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
