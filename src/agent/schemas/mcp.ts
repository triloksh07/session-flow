import { z } from "zod";

/**
 * @file mcp.ts
 * @description Single source of truth for DeepSession MCP tool schemas. 
 * Adheres to the DRY principle: these schemas are used both for LangChain tool definition
 * and internal TypeScript type inference.
 */

export const StartSessionSchema = z.object({
  title: z.string().describe("The primary focus or task of this session"),
  type: z.string().describe("The category of work (e.g., Development, Study)"),
  notes: z.string().optional().describe("Initial drafts or context notes")
});

export const AppendNoteSchema = z.object({
  content: z.string().describe("The exact note to append to the draft.")
});

export const EmptyPayloadSchema = z.object({});

// Extract TypeScript types for internal use
export type StartSessionPayload = z.infer<typeof StartSessionSchema>;
export type AppendNotePayload = z.infer<typeof AppendNoteSchema>;