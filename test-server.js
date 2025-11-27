import fetch from "node-fetch";

async function testServer() {
    console.log("--- Testing Main.js Server Flow ---");
    console.log("Target: http://localhost:3001/api/message");

    try {
        const response = await fetch("http://localhost:3001/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "What is the capital of Egypt?" }) 
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log("\n--- SUCCESS ---");
        console.log("Server Replied:", data); 

    } catch (error) {
        console.error("\n--- FAILED ---");
        console.error("Error:", error.message);
    }
}

testServer();