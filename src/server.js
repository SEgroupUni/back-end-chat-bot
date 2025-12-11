import express from "express";
import cors from "cors";
import sessionRoute from "./routes/session.js";
import messageRoute from "./routes/messages.js";
import sessionEnd from "./routes/sessionEnd.js";

/**
 * Express Server Entry Point
 * --------------------------
 * This file initializes and runs the backend web server.
 *
 * Responsibilities:
 *  - Create an Express application
 *  - Enable CORS for frontend communication
 *  - Parse incoming JSON request bodies
 *  - Mount all API routes:
 *  - Start listening on the configured port
 *
 * IMPORTANT:
 * This file must NOT be deleted. It is required to boot the backend.
 */


const app = express();
const PORT = 3001;

// Enable CORS so frontend can make requests to this backend
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Mount session and message routes
app.use("/api/session", sessionRoute);
app.use("/api/messages", messageRoute);
app.use("/api/sessionEnd", sessionEnd);

// Simple health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "Active" }));

// Start the server and listen on PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*
 * DO NOT DELETE THIS FILE
 * This is the main server entry point. It starts the Express server,
 * mounts all routes, and allows the frontend to communicate with the backend.
 * Removing this file would break the entire backend functionality.
 */
