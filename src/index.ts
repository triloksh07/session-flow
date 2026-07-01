import * as readline from "readline";
import { setupGraph } from "./agent/graph.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { pool } from "./db/postgres.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log("==================================================");
  console.log("🧠 SESSIONFLOW INITIATED (POSTGRES PERSISTENCE)");
  console.log("==================================================");

  const app = await setupGraph();

  let sessionId = await question("\nEnter Session ID:\n> ");
  sessionId = sessionId.trim() || "default_sprint";

  const config = { configurable: { thread_id: sessionId } };

  while (true) {
    const userInput = await question("\n[YOU] > ");

    if (["exit", "quit"].includes(userInput.toLowerCase())) {
      console.log("Shutting down SessionFlow.");
      await pool.end();
      rl.close();
      process.exit(0);
    }

    const stream = await app.stream(
      { messages: [new HumanMessage(userInput)] },
      { ...config, streamMode: "values" }
    );

    // for await (const event of stream) {
    //   if (event.messages) {
    //     const latestMsg = event.messages[event.messages.length - 1];
    //     if (latestMsg instanceof AIMessage && latestMsg.content) {
    //       console.log(`\n[SessionFlow]: ${latestMsg.content}`);
    //     }
    //   }
    // }

    for await (const event of stream) {
      if (event.messages) {
        const latestMsg = event.messages[event.messages.length - 1];

        if (latestMsg instanceof AIMessage) {
          let textToPrint = "";

          if (typeof latestMsg.content === "string") {
            textToPrint = latestMsg.content;
          } else if (Array.isArray(latestMsg.content)) {
            textToPrint = latestMsg.content
              .filter((block: any) => block.type === "text")
              .map((block: any) => block.text)
              .join("\n");
          }

          if (textToPrint.trim()) {
            console.log(`\n[SessionFlow]: ${textToPrint}`);
          }

          if (latestMsg.tool_calls && latestMsg.tool_calls.length > 0) {
            latestMsg.tool_calls.forEach((tool: any) => {
              console.log(`\n[System]: 🛠️ SessionFlow is executing '${tool.name}'...`);
            });
          }
        }
      }
    }
  }
}

main().catch(console.error);