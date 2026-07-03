import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenRouter } from "@langchain/openrouter";
import { CONFIG } from "./config.js";

// export const llm = new ChatGoogleGenerativeAI({
//   model: CONFIG.MODEL_NAME,
//   temperature: CONFIG.TEMPERATURE,
// });

// export const llm = new ChatOllama({
//   baseUrl: "http://localhost:11434", // Ollama local API
//   model: "gemma:2b",                  // swap with "gemma:2b", "phi3", "llama3", "mistral"
// });

// export const llm = new ChatOpenRouter(
//   "anthropic/claude-sonnet-4.6",
//   { temperature: 0.8 }
// );

// export const llm = new ChatOpenRouter({
//   model: "anthropic/claude-sonnet-4.5",
//   temperature: 0,
//   maxTokens: 1024,
// });

export const llm = new ChatOpenRouter({
  model: CONFIG.MODEL_NAME,
  temperature: CONFIG.TEMPERATURE,
  maxTokens: 1024,
});