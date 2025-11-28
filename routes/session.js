import express from 'express';
import { createSession } from '../dialogueSystem/dataGateway/gateRouter.js';

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