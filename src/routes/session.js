import express from 'express';
import { createSession } from '../../dialogueSystem/dataGateway/gateRouter.js';
/**
 * Session Route
 * -------------
 * Provides an endpoint for creating a new chatbot session.
 *
 * Responsibilities:
 *  - Accept persona initialization data from the client
 *  - Validate the persona using `createSession()`
 *  - Start a new dialogue session if valid
 *  - Return a clear success or error response
 *
 * Notes:
 *  - This endpoint must be called before sending any user messages.
 *  - It does NOT handle conversation messages — those are processed 
 *    through the /messages route.
 */



const router = express.Router();

// POST /create — create a new session with the given persona
router.post('/create', (req, res) => {
    const { initialData } = req.body; // extract persona info from request
    const success = createSession(initialData);

    if (!success) {
        return res.status(400).json({ error: 'Invalid persona' }); // invalid persona
    }

    res.json({ status: 'Session created' }); // confirmation of session creation sent to frontend
});

export default router;
