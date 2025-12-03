import readline from "readline";
import fetch from "node-fetch";

// Your backend URL
const BASE_URL = "http://localhost:3001/api";

// CLI Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//
// 1 — Create a session
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
// 2 — Send message to backend
//
async function sendMessage(text) {
    const res = await fetch(`${BASE_URL}/messages/chat`, {   // FIXED
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
    });

    const raw = await res.text();
    console.log("\nRAW CHAT RESPONSE:", raw);

    let data;
    try {
        data = JSON.parse(raw);
        console.log("🤖 Bot:", data.response);
    } catch (err) {
        console.error("❌ JSON parse error:", err);
    }
}

//
// 3 — Start interactive CLI chat
//
async function startChat() {
    await createSession();

    console.log("\n💬 Type your messages below. Type `exit` to quit.\n");

    rl.on("line", async (input) => {
        if (input.toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
        }
        await sendMessage(input);
    });
}

startChat();
