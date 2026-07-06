import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { queryCache } from "../../../core/cache/rag_agent_cache.js";
import { CONFIG } from "../../../core/config.js";
import { RAG_PROMPTS } from "../../../core/prompts/rag_agent_prompt.js";
import type { SqlAgentStateType } from "../../state.js";

const model = new ChatGoogleGenerativeAI({
  apiKey: CONFIG.GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
  temperature: 0,
});

export async function intentNode(state: SqlAgentStateType) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  const response = await model.invoke([
    new SystemMessage(RAG_PROMPTS.INTENT_CLASSIFIER),
    new HumanMessage(lastMessage.content as string)
  ]);

  const extractedIntent = response.content as string;

  // Cache Check Layer
  const cachedAnswer = queryCache.get(extractedIntent);
  if (cachedAnswer) {
    return { 
      intent: extractedIntent,
      answer: "CACHE_HIT", // Sentinel token to tell edges to skip DB computation
      currentSql: "-- Retrieved via local execution cache --"
    };
  }

  return { intent: extractedIntent };
}