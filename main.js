// ***** Expansion ideas:
// intent can return 3 predicted questions to pipeline LLM and cache responses.
// Record hit/miss for session manager and update predictions daily.
// Certain intents may return media files (image.png) along with text.

import { getResponse } from "./dialogueSystem/intentEngine/getResponse.js";
import readline from "readline";
import Session from "./dialogueSystem/sessionManager/sessionManager.js"; // updated import



