import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { StartSessionSchema, AppendNoteSchema, EmptyPayloadSchema } from "../agent/schemas/mcp.js";
import { CONFIG } from "./config.js";

/**
 * @class DeepSessionMCPBridge
 * @description Manages the lifecycle of the MCP connection and translates MCP tools
 * into LangChain-compatible tools. Demonstrates the Single Responsibility Principle.
 */
export class DeepSessionMCPBridge {
    private mcpClient: Client;
    private transport: StdioClientTransport;

    constructor() {
        this.mcpClient = new Client({ name: "sessionflow-agent", version: "1.0.0" });

        // Configure transport to execute the standalone headless client
        this.transport = new StdioClientTransport({
            command: "npx",
            // Path must point to deepsession-mcp project index.ts
            args: ["tsx", CONFIG.MCP_SERVER_PATH],
        });
    }

    /**
     * Initializes the stdio transport connection to the local MCP server.
     */
    public async connect(): Promise<void> {
        console.log("[MCP] Booting connection to DeepSession Headless Client...");
        await this.mcpClient.connect(this.transport);
        console.log("[MCP] Connection established.");
    }

    /**
     * Generates LangChain tools bounded to the active MCP connection.
     * Adheres to the Open/Closed Principle: to add new tools, we just append to this array.
     */
    public getLangChainTools(): DynamicStructuredTool[] {
        return [
            new DynamicStructuredTool({
                name: "start_session",
                description: "Initializes a new DeepSession sprint. Fails if one is already active.",
                schema: StartSessionSchema,
                func: async (args) => this.executeTool("start_session", args),
            }),
            new DynamicStructuredTool({
                name: "pause_session",
                description: "Suspends active tracking for a break.",
                schema: EmptyPayloadSchema,
                func: async () => this.executeTool("pause_session", {}),
            }),
            new DynamicStructuredTool({
                name: "resume_session",
                description: "Re-activates a paused session.",
                schema: EmptyPayloadSchema,
                func: async () => this.executeTool("resume_session", {}),
            }),
            new DynamicStructuredTool({
                name: "get_session_info",
                description: "Retrieves details and state of the currently active session.",
                schema: EmptyPayloadSchema,
                func: async () => this.executeTool("get_session_info", {}),
            }),
            new DynamicStructuredTool({
                name: "append_note",
                description: "Attaches a new thought or log entry to the active session workspace.",
                schema: AppendNoteSchema,
                func: async (args) => this.executeTool("append_note", args),
            }),
            new DynamicStructuredTool({
                name: "stop_session",
                description: "Terminates the active sprint and logs the permanent record.",
                schema: EmptyPayloadSchema,
                func: async () => this.executeTool("stop_session", {}),
            }),
        ];
    }

    /**
     * DRY helper to execute tools via the MCP protocol and extract the text content.
     */
    private async executeTool(name: string, args: any): Promise<string> {
        try {
            const result = await this.mcpClient.callTool({ name, arguments: args }) as any;
            // MCP returns an array of content blocks; we extract the text for LangChain
            return result.content.map(c => c.type === "text" ? c.text : "").join("\n");
        } catch (error: any) {
            // Return errors as strings so the LLM knows the tool failed and can recover
            return `Tool execution failed: ${error.message}`;
        }
    }
}