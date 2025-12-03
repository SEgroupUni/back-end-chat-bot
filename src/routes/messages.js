import express from 'express';
import {
    sessionGateRouter,
} from '../../dialogueSystem/dataGateway/gateRouter.js';
import { ErrorReload } from "../../dialogueSystem/endSessionManager/fileSaver.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
    const userInput = req.body.message;

    const result = await sessionGateRouter(userInput);

    if (result.error) {
        console.log("Restarting session after error…");

        const restarted = await ErrorReload();

        return res.json({
            response: restarted.response,
            userPrompt: restarted.userPrompt
        });
    }

    res.json({
        response: result.response,
        userPrompt: result.userPrompt
    });
});

