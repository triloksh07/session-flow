import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pool } from "pg";
import { zodToJsonSchema } from "zod-to-json-schema";
// import * as dotenv from "dotenv";
// dotenv.config();

const SUPABASE_URL="postgresql://rag_agent.fagtsdikquxqqkhelsre:agent_secure_password_123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

// Ensure your Supabase connection string is in your .env file
const pool = new Pool({
  // connectionString: process.env.SUPABASE_URL,
  connectionString: SUPABASE_URL,
});

const querySchema = z.object({
  query: z.string().describe("A fully qualified PostgreSQL SELECT query."),
});

export async function executeRawQuery(query: string): Promise<string> {
  if (!query) return "SQL Execution Error: Query string is undefined or empty.";

  try {
    // Basic safeguard: Block obvious destructive commands at the application layer
    const upperQuery = query.toUpperCase();
    if (
      upperQuery.includes("INSERT ") ||
      upperQuery.includes("UPDATE ") ||
      upperQuery.includes("DELETE ") ||
      upperQuery.includes("DROP ") ||
      upperQuery.includes("ALTER ")
    ) {
      return "Error: Execution denied. This tool is strictly for read-only SELECT queries.";
    }

    const result = await pool.query(query);

    // Safeguard against massive token bloat if the LLM forgets to use LIMIT
    if (result.rows.length > 50) {
      const truncated = result.rows.slice(0, 50);
      return (
        JSON.stringify(truncated) +
        "\n... [Warning: Result set exceeded 50 rows and was truncated. Use strict LIMIT or tighter WHERE clauses.]"
      );
    }

    return JSON.stringify(result.rows);
  } catch (error: any) {
    const localizedError = error.message || JSON.stringify(error);
    // Returning the exact SQL error teaches the LLM why its query failed
    return `SQL Execution Error: ${localizedError}\nReview your syntax and try again.`;
  }
}

export const executeReadQuery = tool(
  async ({ query }) => {
    return await executeRawQuery(query);
  },
  {
    name: "execute_read_query",
    description: "Executes a PostgreSQL SELECT query against the F1 database. Returns rows as JSON. IMPORTANT: Empty or null values in this database are represented by the string literal '\\N'. Account for this in your WHERE clauses.",
    schema: zodToJsonSchema(querySchema),
  }
);
