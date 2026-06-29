import { config } from "dotenv";

config();

export const CONFIG = {
  MODEL_NAME: process.env.MODEL_NAME ?? "gemini-2.5-flash",
  TEMPERATURE: Number(process.env.TEMPERATURE ?? 0),
  DB_PATH: "sessionflow.db",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
};

if (!CONFIG.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY in environment variables.");
}