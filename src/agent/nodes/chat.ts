import { SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../../core/config.js";
import { SemanticMemoryStore } from "../../db/semantic-store.js";
import type { SessionState } from "../state.js";

const llm = new ChatGoogleGenerativeAI({
  model: CONFIG.MODEL_NAME,
  temperature: CONFIG.TEMPERATURE,
});

const semanticStore = new SemanticMemoryStore();

export const chatNode = async (state: SessionState) => {
  const memoryContext = await semanticStore.fetchChronologicalContext();

  const sysMsg = new SystemMessage(`
You are SessionFlow, a cognitive continuity assistant for an independent engineer.
Act as a natural conversational partner. Keep responses concise and focused.
CRITICAL INSTRUCTION: Never narrate or announce your memory operations. Do not type things like 'Appending to memory'. Just reply to the user naturally.

=== YOUR LONG-TERM MEMORY (APPEND-ONLY LOG) ===
${memoryContext}

Note: Memories are listed chronologically. If older memories conflict with newer ones, the newest memory is the current absolute truth. Never contradict the latest memory.
  `);

  const response = await llm.invoke([sysMsg, ...state.messages]);
  return { messages: [response] };
};