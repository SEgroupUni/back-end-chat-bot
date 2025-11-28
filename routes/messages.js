import express from 'express';
import { 
    backFlowGateRouter, 
    frontFlowGateRouter 
} from '../dialogueSystem/dataGateway/gateRouter.js';

const router = express.Router();

// POST / — handle user messages
router.post('/', async (req, res, next) => {
    try {
        const { userInput } = req.body; // extract user message from request

        // Process the input through the backend session pipeline
        backFlowGateRouter(userInput);

        // Generate a response and clean session state
        const response = frontFlowGateRouter({ response: `You said: ${userInput}` });

        // Send the reply back to the frontend as JSON
        res.json({ reply: response });
    } catch (err) {
        next(err); // pass any errors to Express error handler
    }
});

export default router;