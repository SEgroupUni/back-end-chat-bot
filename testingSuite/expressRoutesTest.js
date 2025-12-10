import readline from "readline";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001/api";

//
// ------------------------------
// CREATE SESSION
// ------------------------------
// POST /api/session/create
//
async function createSession() {
    try {
        const res = await fetch(`${BASE_URL}/session/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                initialData: {
                    name: "ramesses",
                    persona: "default persona"
                }
            })
        });

        const raw = await res.text();
        console.log("\nRAW SESSION RESPONSE:", raw);

        const data = JSON.parse(raw);
        console.log("\n🟢 Session created:", data);

    } catch (err) {
        console.error("❌ Failed to create session:", err);
    }
}

//
// ------------------------------
// SEND USER MESSAGE
// ------------------------------
// POST /api/messages
//
async function sendMessage(text) {
    try {
        const res = await fetch(`${BASE_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userInput: text })
        });

        const raw = await res.text();
        console.log("\nRAW CHAT RESPONSE:", raw);

        const data = JSON.parse(raw);
        console.log("🤖 Bot:", data.response);

    } catch (err) {
        console.error("❌ Failed to parse response:", err);
    }
}

//
// ------------------------------
// END SESSION
// ------------------------------
// POST /api/session/end
//
async function endSession() {
    try {
        const res = await fetch(`${BASE_URL}/sessionEnd/`, {  // note trailing slash
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();  // safer parsing
        console.log("\nRAW END RESPONSE:", data);
        console.log("🛑 Session Ended:", data.status);

    } catch (err) {
        console.error("❌ Failed to end session:", err);
    }
}

//
// ------------------------------
// INTERACTIVE CLI CHAT
// ------------------------------
//
async function startChat() {
    await createSession();

    console.log("\n💬 Type your messages.");
    console.log("⚪ Type `end` to end session.");
    console.log("⚫ Type `exit` to quit program.\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("line", async (input) => {
        const lower = input.toLowerCase();

        if (lower === "exit") {
            rl.close();
            process.exit(0);
        }

        if (lower === "end") {
            await endSession();
            console.log("✔ You may now type `exit` or create a new session manually.");
            return;
        }

        await sendMessage(input);
    });
}

startChat();
