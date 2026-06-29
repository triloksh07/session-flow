import { z } from "zod";

export const ExtractedMemorySchema = z.object({
  category: z.enum([
    "task",
    "idea",
    "preference",
    "reflection",
    "fact",
  ]).describe("Categorize the extracted information."),

  content: z.string().describe(
    "The actual fact, goal, preference or idea."
  ),
});

export const MemoryExtractionSchema = z.object({
  memories: z.array(ExtractedMemorySchema)
    .default([])
    .describe("List of new memories to save. Return empty if the user is just chatting normally."),
});

export type ExtractedMemory = z.infer<typeof ExtractedMemorySchema>;
export type MemoryExtraction = z.infer<typeof MemoryExtractionSchema>;