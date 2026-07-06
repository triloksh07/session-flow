import { config } from "dotenv";

config();

export const CONFIG = {
  MODEL_NAME: process.env.MODEL_NAME ?? "gemini-2.5-flash"!,
  TEMPERATURE: Number(process.env.TEMPERATURE ?? 0)!,
  DATABASE_URL: process.env.DATABASE_URL!,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
  MCP_SERVER_PATH: process.env.MCP_SERVER_PATH!,
};

if (!CONFIG.GOOGLE_API_KEY || !CONFIG.DATABASE_URL) {
  throw new Error("Missing GOOGLE_API_KEY or DATABASE_URL in environment variables.");
}

/**
 * import * as dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`🚨 CRITICAL CONFIG ERROR: Environment variable ${key} is missing.`);
  }
  return value;
}

export const config = {
  db: {
    // The connection string for the read-only rag_agent
    url: getEnvVar("DATABASE_URL"),
  },
  ai: {
    openaiKey: getEnvVar("OPENAI_API_KEY"),
  }
};
 */