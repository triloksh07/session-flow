import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../../core/config.js";
import { semanticStore } from "../../db/semantic-store.js";
import type { SessionState } from "../state.js";
import { MemoryExtractionSchema } from "../schemas.js";
import { llm } from "../../core/llm.js";

export const silentExtractorNode = async (state: SessionState) => {
  const messages = state.messages;

  if (!messages || messages.length < 2) {
    return {};
  }

  const humanInput = messages[messages.length - 2]?.content;

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

  if (result && result.memories && result.memories.length > 0) {
    for (const memory of result.memories) {
      await semanticStore.appendMemory(memory.category, memory.content);
    }
  }

  return {};
};