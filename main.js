// main.js
import express from "express";
import cors from "cors";
import Session from "./dialogueSystem/sessionManager/sessionManager.js";
import { handleAiRequest } from "./externalAiIntegration/aiInputGateway.js"; 

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const initialPersona = { name: "Ram Ram", role: "Pharaoh Chatbot" };
const globalSession = new Session(initialPersona);

console.log("Session Initialized:", globalSession.id);

// Validation Point 
app.get("/api/health", (req, res) => {
    res.json({ status: "Active", sessionID: globalSession.id });
});

// The Main Chat Route
app.post("/api/message", async (req, res) => {
    //Extract text from the request body
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        // Call the Gateway with the correct arguments 
        const aiResponse = await handleAiRequest(globalSession, text);

        // Send the result back to the frontend as JSON
        res.json({ message: aiResponse });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});