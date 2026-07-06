import { Pool } from "pg";
import { CONFIG } from "../core/config.js";

export const supabasePool = new Pool({
  connectionString: CONFIG.SUPABASE_URL,
  connectionTimeoutMillis: 5000,
});