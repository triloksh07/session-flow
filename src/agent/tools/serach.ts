import { tool } from "@langchain/core/tools";
import { TavilySearch } from "@langchain/tavily";
import z from "zod";

/**
 * @file search.ts
 * @description Provides agentic real-time web exploration utility capabilities.
 */
export const createWebSearchTool = () => {
  return new TavilySearch({
    maxResults: 3,
  });
};
