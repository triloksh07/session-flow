import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "./config.js";

export const llm = new ChatGoogleGenerativeAI({
  model: CONFIG.MODEL_NAME,
  temperature: CONFIG.TEMPERATURE,
});