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
