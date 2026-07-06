import { StateGraph, END, START } from "@langchain/langgraph";
import { SqlAgentState, type SqlAgentStateType } from "../state.js";
import { intentNode } from "./nodes/1-intent.js";
import { schemaDiscoveryNode } from "./nodes/2-schema.js";
import { sqlGeneratorNode } from "./nodes/3-generator.js";
import { programmaticValidatorNode } from "./nodes/4-validator.js";
import { queryExecutorNode } from "./nodes/5-executor.js";
import { critiqueRouterEdge } from "./nodes/6-critique.js";
import { synthesisNode } from "./nodes/7-synthesizer.js";

const builder = new StateGraph(SqlAgentState)
  .addNode("intent_classifier", intentNode)
  .addNode("schema", schemaDiscoveryNode)
  .addNode("generator", sqlGeneratorNode)
  .addNode("validator", programmaticValidatorNode)
  .addNode("executor", queryExecutorNode)
  .addNode("synthesizer", synthesisNode);

// Define Linear Flow Sequences
builder.addEdge(START, "intent_classifier");

// Conditional routing right after the catalog discovery step
builder.addConditionalEdges("intent_classifier", (state: SqlAgentStateType) => {
  return state.answer === "CACHE_HIT" ? "synthesizer" : "schema";
}, {
  synthesizer: "synthesizer",
  schema: "schema"
});

// builder.addEdge("intent_classifier", "schema");
builder.addEdge("schema", "generator");
builder.addEdge("generator", "validator");
builder.addEdge("validator", "executor");

// Inject the Critique Router conditional evaluation pathway
builder.addConditionalEdges("executor", critiqueRouterEdge, {
  generator: "generator",
  synthesizer: "synthesizer"
});

builder.addEdge("synthesizer", END);

export const sqlAgentGraph = builder.compile();

