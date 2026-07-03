import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pool } from "pg";
import { zodToJsonSchema } from "zod-to-json-schema";

// Ensure your Supabase connection string is in your .env file
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
});

const querySchema = z.object({
  query: z.string().describe("A fully qualified PostgreSQL SELECT query."),
});

export const executeReadQuery = tool(
  async ({ query }) => {
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
      // Returning the exact SQL error teaches the LLM why its query failed
      return `SQL Execution Error: ${error.message}\nReview your syntax and try again.`;
    }
  },
  {
    name: "execute_read_query",
    description: "Executes a PostgreSQL SELECT query against the F1 database. Returns rows as JSON. IMPORTANT: Empty or null values in this database are represented by the string literal '\\N'. Account for this in your WHERE clauses.",
    schema: zodToJsonSchema(querySchema),
  }
);

