import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../../core/config";
import { SemanticMemoryStore } from "../../db/semantic-store";
import { SessionState } from "../state";
import { MemoryExtractionSchema } from "../schemas";
import { llm } from "../../core/llm.js";

const semanticStore = new SemanticMemoryStore(CONFIG.DB_PATH);

export const silentExtractorNode = async (state: SessionState) => {
  const messages = state.messages;
  const humanInput = messages.length > 1 ? messages[messages.length - 2].content : "";

  const sysMsg = new SystemMessage(`
You are a background memory processor. Analyze the user's latest input.
Extract the information IF the user states:
- A new task or project
- A long-term goal or preference
- A random idea
- A personal fact, identity, role, or background information.

If they are just saying hello, asking a question, or chatting normally without stating facts/goals, return an empty list.
  `);

  const structuredLlm = llm.withStructuredOutput(MemoryExtractionSchema);
  const result = await structuredLlm.invoke([sysMsg, new HumanMessage(humanInput as string)]);

  for (const memory of result.memories) {
    semanticStore.appendMemory(memory.category, memory.content);
  }

  return {}; 
};