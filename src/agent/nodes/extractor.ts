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

Extract ONLY if the input contains:

- A new task or project (work item, sprint goal).
- A durable long-term goal or recurring preference.
- A random idea worth logging for later.
- A personal fact, identity, or role relevant across sessions.

Do NOT extract:

- Greetings, casual chat, or transient emotions.
- One-off questions or ephemeral details.
- Redundant information already stored.

Output must be minimal and structured. If nothing qualifies, return an empty list.
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