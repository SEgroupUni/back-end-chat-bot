# software_engineering_assignment

These files implements the server of a chatbot system designed to manage dialogue flow, user intents, personas, and session state. 
It supports integration with external AI services and is structured to allow modular expansion and testing.

Main features:
-Central class-based controller responsible for coordinating session state and dialogue processing pipelines
-Dialogue intent recognition using pattern matching and classification
-Local embedded transformer model for intent classification
-External API integration with the DeepSeek R1 large language model
-Context-aware dialogue guidance to maintain conversational coherence
-Dedicated error handling and logging module

Technologies Used:
-node.js
-Javascript
-Express
-npm
-JSON for data/configuration
-xenova/transformers
-deepseek-ai/DeepSeek-R1-Distill-Qwen-14B

express-server-historical-chatbot/
│
├── dialogueSystem/        # Dialogue flow logic and response management
├── externalAiIntegration/ # Interfaces for external AI model APIs
├── intentData/            # Intent definitions and classification data
├── liveSessionState/      # Session creation and global access
├── personas/              # Chatbot persona definitions
├── src/                   # Application entry point and server logic
├── testingSuite/          # Unit and integration tests
│
├── .env                   # Environment variables and API keys
├── README.md              # Project documentation
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Dependency lock file
├── node_modules/          # Installed dependencies
├── log.json               # Runtime logging and debugging output
