/**
 * Session End Route
 * -----------------
 * Handles clean termination of an active chatbot session.
 *
 * Responsibilities:
 *  - Verify that a session currently exists
 *  - Trigger the dialogue pipeline using the special input "end session"
 *    so the system can perform any final logging or cleanup
 *  - Destroy the in-memory session using `deleteSession()`
 *  - Return a JSON confirmation to the client
 *
 * Notes:
 *  - If no active session exists, it simply returns `{ status: "no active session" }`.
 *  - This route should be called whenever the frontend wants to close
 *    the conversation cleanly.
 */

import express from 'express';
import { sessionGateRouter } from '../../dialogueSystem/dataGateway/gateRouter.js';
import { deleteSession, getSession } from '../../liveSessionState/sessionState.js';

const router = express.Router();

router.post("/", async (req, res, next) => {
    try {
        const session = getSession();

        if (!session) {
            return res.json({ status: "no active session" });
        }

        const result = await sessionGateRouter("end session");

        deleteSession();

        return res.json({
            status: "session ended",
            result
        });

    } catch (err) {
        next(err);
    }
});

export default router;
