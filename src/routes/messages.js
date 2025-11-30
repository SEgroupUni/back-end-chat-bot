import express from 'express';
import {
    sessionGateRouter,
    finishCycle
} from '../../dialogueSystem/dataGateway/gateRouter.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const { userInput } = req.body;

        // Await the async gateway
        const response = await sessionGateRouter(userInput);

        res.json({
            reply: response.response,
            next: response.userPrompt ?? null
        });

    } catch (err) {
        next(err);
    }
});

export default router;
