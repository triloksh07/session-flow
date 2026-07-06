import { sqlAgentGraph } from "./sql_agent.js";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config();

async function runTest() {
    console.log("🚀 Booting Text-to-SQL RAG Agent...");

    // A question that requires aggregating data across multiple tables/views
    const userQuestion = "Who won the 2021 Abu Dhabi Grand Prix, and how many points did they get?";

    console.log(`\n👤 User: "${userQuestion}"\n`);

    const initialState = {
        messages: [new HumanMessage(userQuestion)],
        currentSql: "",
        sqlError: "",
        retryCount: 0,
    };

    try {
        // We use .stream() instead of .invoke() so we can watch the routing loop live
        const stream = await sqlAgentGraph.stream(initialState);

        for await (const chunk of stream) {
            // Print which node just finished executing
            const nodeName = Object.keys(chunk)[0];
            console.log(`\n⚙️  [Node Execution Completed: ${nodeName.toUpperCase()}]`);

            // If it generated or linted SQL, show us the code
            if (chunk[nodeName].currentSql) {
                console.log(`\x1b[36m${chunk[nodeName].currentSql}\x1b[0m`);
            }

            // If it hit an error, show us the fail state
            if (chunk[nodeName].sqlError) {
                console.log(`\x1b[31m${chunk[nodeName].sqlError}\x1b[0m`);
            }

            // If it's the final synthesis, print the AI's response
            if (nodeName === "synthesize") {
                const finalMessage = chunk[nodeName].messages[0];
                console.log(`\n🤖 Agent Response:\n\x1b[32m${finalMessage.content}\x1b[0m\n`);
            }
        }

        console.log("✅ Workflow execution complete.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Fatal Execution Error:", error);
        process.exit(1);
    }
}

runTest();