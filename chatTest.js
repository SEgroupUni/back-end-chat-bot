import readline from "readline";
import fetch from "node-fetch";

// Backend base URL
const BASE_URL = "http://localhost:3001/api";

// CLI interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createSession() {
    const res = await fetch(`${BASE_URL}/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialData: "ramasses" })
    });

    const data = await res.json();
    console.log("\n🟢 Session:", data);
}

async function sendMessage(text) {
    const res = await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: text })
    });

    const data = await res.json();
    console.log("🤖 Bot:", data.reply);
    console.log()
}

async function startChat() {
    // create backend session
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
