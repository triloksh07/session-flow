import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SessionStateAnnotation } from "./state.js";
import type { SessionState } from "./state.js"
import { chatNode } from "./nodes/chat.js";
import { silentExtractorNode } from "./nodes/extractor.js";
import { pool } from "../db/postgres.js";
import { semanticStore } from "../db/semantic-store.js";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DeepSessionMCPBridge } from "../core/mcp-client.js";
import { createWebSearchTool } from "./tools/serach.js";

import { DynamicStructuredTool, Tool } from "@langchain/core/tools";

import z from "zod";
import type { RunnableToolLike } from "@langchain/core/runnables";

const checkpointer = new PostgresSaver(pool);

/**
 * @file graph.ts
 * @description Wires the cognitive architecture. Now includes a conditional 
 * routing loop for tool execution.
 */

export const setupGraph = async () => {
  // Initialize core database schemas and persistence layers
  await semanticStore.initializeSchema();
  await checkpointer.setup();

  // Establish the Model Context Protocol bridge for local tool execution
  const mcpBridge = new DeepSessionMCPBridge();
  await mcpBridge.connect();

  // const tools = mcpBridge.getLangChainTools();
  const mcpTools = mcpBridge.getLangChainTools();
  const searchTool = createWebSearchTool();

  const allTools = [...mcpTools, searchTool as unknown as RunnableToolLike];
  // const allTools = [...mcpTools, searchTool];

  const toolNode = new ToolNode(allTools);
  // const toolNode = new ToolNode(mcpTools);

  // Define the conditional routing logic with strict type safety guards
  const routePostChat = (state: SessionState) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) {
      return "extractor";
    }

    // Safely check for LangChain's native tool_calls array on the AIMessage object
    const hasNativeToolCalls =
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length > 0;

    // Safely check for provider-specific tool calls within additional_kwargs
    const hasKwargsToolCalls =
      lastMessage.additional_kwargs &&
      Array.isArray(lastMessage.additional_kwargs.tool_calls) &&
      lastMessage.additional_kwargs.tool_calls.length > 0;

    if (hasNativeToolCalls || hasKwargsToolCalls) {
      return "tools";
    }

    return "extractor";
  };

  // Construct the workflow loop, wrapping the chat node to inject the dynamic tools
  const workflow = new StateGraph(SessionStateAnnotation)
    .addNode("chat", (state) => chatNode(state, allTools))
    .addNode("tools", toolNode)
    .addNode("extractor", silentExtractorNode)
    .addEdge(START, "chat")
    .addConditionalEdges("chat", routePostChat)
    .addEdge("tools", "chat")
    .addEdge("extractor", END);

  return workflow.compile({ checkpointer });
};