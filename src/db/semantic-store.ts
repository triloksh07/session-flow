import { v4 as uuidv4 } from "uuid";
import { pool } from "./postgres.js";

export class SemanticMemoryStore {
  async initializeSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS semantic_memory (
        id TEXT PRIMARY KEY,
        category TEXT,
        content TEXT,
        timestamp TEXT
      )
    `);
  }

  public async appendMemory(category: string, content: string) {
    const query = "INSERT INTO semantic_memory (id, category, content, timestamp) VALUES ($1, $2, $3, $4)";
    const values = [uuidv4(), category, content, new Date().toISOString()];
    await pool.query(query, values);
  }

  public async fetchChronologicalContext(): Promise<string> {
    const result = await pool.query(
      "SELECT category, content, timestamp FROM semantic_memory ORDER BY timestamp ASC"
    );
    
    if (result.rows.length === 0) {
      return "No historical memories yet.";
    }

    return result.rows
      .map((r) => `[${r.timestamp}] ${r.category.toUpperCase()}: ${r.content}`)
      .join("\n");
  }
}

export const semanticStore = new SemanticMemoryStore();