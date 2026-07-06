// src/agent/rag_agent/test_rag_pipeline.ts
import * as dotenv from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import * as readline from "readline";
import { sqlAgentGraph } from "./sql-graph.js";
import { supabasePool } from "../../db/supabase.js";
// Ingest environment infrastructure configuration
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("==================================================");
console.log("🚀 BOOTING MODULAR TEXT-TO-SQL RAG STREAM");
console.log("==================================================");

function startSession() {
    rl.question("\n👤 Enter analytical query (or type 'exit'):\n> ", async (userQuestion) => {
        if (userQuestion.toLowerCase() === 'exit') {
            await supabasePool.end();
            rl.close();
            process.exit(0);
        }

        if (!userQuestion.trim()) {
            startSession();
            return;
        }

        const initialState = {
            messages: [new HumanMessage(userQuestion)],
            currentSql: "",
            sqlError: "",
            retryCount: 0,
        };

        console.log("\n⚡ Graph processing initiated. Streaming node chunks...\n");

        try {
            // We use .stream() instead of .invoke() so we can watch the routing loop live
            const stream = await sqlAgentGraph.stream(initialState);

            for await (const chunk of stream) {
                // Print which node just finished executing
                const nodeName = Object.keys(chunk)[0];
                // const nodeName = Object.keys(chunk)[0];
                if (!nodeName) continue; // Type Guard: skips empty chunks and guarantees nodeName is a string

                console.log(`\n⚙️  [Node Execution Completed: ${nodeName.toUpperCase()}]`);

                // Cast chunk to a Record so TypeScript accepts dynamic string indexing
                const nodeOutput = (chunk as Record<string, any>)[nodeName];

                // const nodeOutput = chunk[nodeName];

                // If it captured or targeted user intent
                if (nodeOutput.intent) {
                    console.log(`   ↳ Captured Intent: \x1b[33m"${nodeOutput.intent}"\x1b[0m`);
                }

                // If it fetched schema coordinates
                if (nodeOutput.discoveredSchema) {
                    console.log(`   ↳ Discovered Catalog Metrics: \x1b[35m${nodeOutput.discoveredSchema.split('\n').length} lines of structural metadata loaded.\x1b[0m`);
                }

                // If it generated or validated SQL, show us the code
                if (nodeOutput.currentSql) {
                    console.log(`\x1b[36m${nodeOutput.currentSql}\x1b[0m`);
                }

                // If it hit an error, show us the fail state
                if (nodeOutput.sqlError) {
                    console.log(`\x1b[31mSQL Execution Error: ${nodeOutput.sqlError}\x1b[0m`);
                }

                // If it loaded database row states
                if (nodeOutput.answer && nodeOutput.answer !== "CACHE_HIT") {
                    console.log(`   ↳ Data Payload: \x1b[34m${nodeOutput.answer}\x1b[0m`);
                }

                // Catch the final synthesis response (handles both "synthesizer" or your custom label)
                if (nodeName === "synthesizer" || nodeName === "synthesize") {
                    const finalAnswer = nodeOutput.answer || (nodeOutput.messages && nodeOutput.messages[0]?.content);
                    console.log(`\n🤖 Agent Response:\n\x1b[32m${finalAnswer}\x1b[0m\n`);
                }
            }

            console.log("━━━━━━━ ✅ Workflow execution complete. ━━━━━━━");

        } catch (error) {
            console.error("\n\x1b[31m❌ Fatal Execution Error:\x1b[0m", error);
        }

        // Loop back to keep terminal connection active for subsequent profiling runs
        startSession();
    });
}

startSession();