import { tool } from "@langchain/core/tools";
import { TavilySearch } from "@langchain/tavily";
import z from "zod";
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
// import * as dotenv from "dotenv";

// dotenv.config();

/**
 * @file search.ts
 * @description Provides agentic real-time web exploration utility capabilities.
 */
export const createWebSearchTool = () => {
  return new TavilySearch({
    maxResults: 3,
    // apiKey:process.env.TAVILY_API_KEY,
  });
};

// export const createWebSearchTool = () => {
//   const tavily = new TavilySearch({
//     maxResults: 3,
//   });

//   // Explicitly wrap using the standard tool schema factory
//   return tool(
//     async ({ query }) => {
//       return await tavily.invoke(query);
//     },
//     {
//       name: "tavily_search",
//       description: "A search engine optimized for comprehensive, accurate, and fast results. Useful for when you need to answer questions about current events.",
//       schema: z.object({
//         query: z.string().describe("The search query to look up on the internet."),
//       }),
//     }
//   );
// };
