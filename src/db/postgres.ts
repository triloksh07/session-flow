import { Pool } from "pg";
import { CONFIG } from "../core/config.js";

export const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
});