import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export class SemanticMemoryStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS semantic_memory (
        id TEXT PRIMARY KEY,
        category TEXT,
        content TEXT,
        timestamp TEXT
      )
    `);
  }

  public appendMemory(category: string, content: string) {
    const stmt = this.db.prepare(
      "INSERT INTO semantic_memory (id, category, content, timestamp) VALUES (?, ?, ?, ?)"
    );
    stmt.run(uuidv4(), category, content, new Date().toISOString());
  }

  public fetchChronologicalContext(): string {
    const stmt = this.db.prepare(
      "SELECT category, content, timestamp FROM semantic_memory ORDER BY timestamp ASC"
    );
    const rows = stmt.all() as { category: string; content: string; timestamp: string }[];

    if (rows.length === 0) {
      return "No historical memories yet.";
    }

    return rows
      .map((r) => `[${r.timestamp}] ${r.category.toUpperCase()}: ${r.content}`)
      .join("\n");
  }
}