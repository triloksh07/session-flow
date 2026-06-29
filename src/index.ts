import * as readline from "readline";
import { app } from "./agent/graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log("==================================================");
  console.log("🧠 SESSIONFLOW INITIATED (TS + SQLITE PERSISTENT)");
  console.log("==================================================");

  let sessionId = await question("\nEnter Session ID:\n> ");
  sessionId = sessionId.trim() || "default_sprint";

  const config = { configurable: { thread_id: sessionId } };

  while (true) {
    const userInput = await question("\n[YOU] > ");

    if (["exit", "quit"].includes(userInput.toLowerCase())) {
      console.log("Shutting down SessionFlow.");
      rl.close();
      process.exit(0);
    }

    const stream = await app.stream(
      { messages: [new HumanMessage(userInput)] },
      { ...config, streamMode: "values" }
    );

    for await (const event of stream) {
      if (event.messages) {
        const latestMsg = event.messages[event.messages.length - 1];
        if (latestMsg instanceof AIMessage && latestMsg.content) {
          console.log(`\n[SessionFlow]: ${latestMsg.content}`);
        }
      }
    }
  }
}

main().catch(console.error);