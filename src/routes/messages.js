import express from 'express';
import { sessionGateRouter } from '../../dialogueSystem/dataGateway/gateRouter.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { userInput } = req.body;

    const result = await sessionGateRouter(userInput);

    res.json({
      response: result.response,
      userPrompt: result.userPrompt
    });

  } catch (err) {
    next(err);
  }
});

export default router;