import { StateGraph, START, END } from "@langchain/langgraph";
import { SessionStateAnnotation } from "./state";
import { chatNode } from "./nodes/chat";
import { silentExtractorNode } from "./nodes/extractor";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import Database from "better-sqlite3";
import { CONFIG } from "../core/config";

const threadDb = new Database(CONFIG.DB_PATH);
const checkpointer = new SqliteSaver(threadDb);

const workflow = new StateGraph(SessionStateAnnotation)
  .addNode("chat", chatNode)
  .addNode("extractor", silentExtractorNode)
  .addEdge(START, "chat")
  .addEdge("chat", "extractor")
  .addEdge("extractor", END);

export const app = workflow.compile({ checkpointer });