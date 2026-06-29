import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SessionStateAnnotation } from "./state.js";
import { chatNode } from "./nodes/chat.js";
import { silentExtractorNode } from "./nodes/extractor.js";
import { pool } from "../db/postgres.js";
import { semanticStore } from "../db/semantic-store.js";

const checkpointer = new PostgresSaver(pool);

export const setupGraph = async () => {
  await semanticStore.initializeSchema(); 
  await checkpointer.setup(); 
  
  const workflow = new StateGraph(SessionStateAnnotation)
    .addNode("chat", chatNode)
    .addNode("extractor", silentExtractorNode)
    .addEdge(START, "chat")
    .addEdge("chat", "extractor")
    .addEdge("extractor", END);

  return workflow.compile({ checkpointer });
};