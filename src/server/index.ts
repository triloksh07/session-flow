import express from "express";
import cors from "cors";
import { setupGraph } from "../agent/graph.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { pool } from "../db/postgres.js";

const appServer = express();

appServer.use(cors({ origin: "*" }));
appServer.use(express.json());

interface ChatQuery {
  session_id: string;
  message: string;
}

interface ChatMessage {
  role: "human" | "ai";
  content: string;
}

let graphApp: any;

/**
 * GET /api/sessions
 * Fetches unique session IDs directly from the LangGraph Postgres checkpoint ledger.
 */
appServer.get("/api/sessions", async (req, res) => {
  try {
    // LangGraph-checkpoint-postgres persists session keys under the thread_id column
    const result = await pool.query("SELECT DISTINCT thread_id FROM checkpoints");
    const sessions = result.rows.map((row) => row.thread_id);
    res.json({ sessions });
  } catch (error) {
    res.json({ sessions: [] });
  }
});

/**
 * GET /api/session/:session_id
 * Retrieves the complete chat log for an active session, converting message structures cleanly.
 */
appServer.get("/api/session/:session_id", async (req, res) => {
  const { session_id } = req.params;
  const config = { configurable: { thread_id: session_id } };

  try {
    // const graphApp = await setupGraph();
    const state = await graphApp.getState(config);

    if (!state.values || !state.values.messages) {
      res.json({ exists: false, status: "new", history: [] });
      return;
    }

    // Determine if the graph is paused at an execution checkpoint (waiting for human intervention)
    const isPaused = state.next && state.next.length > 0;
    const rawMessages = state.values.messages;
    const chatHistory: ChatMessage[] = [];

    // for (const msg of rawMessages) {
    //   // const msgType = msg._getType();

    //   if (msgType === "human") {
    //     chatHistory.push({ role: "human", content: msg.content });
    //   } else if (msgType === "ai" && msg.content) {
    //     let textContent = "";

    //     // Unpack text arrays safely to prevent [object Object] serialization
    //     if (typeof msg.content === "string") {
    //       textContent = msg.content;
    //     } else if (Array.isArray(msg.content)) {
    //       textContent = msg.content
    //         .filter((block: any) => block.type === "text")
    //         .map((block: any) => block.text)
    //         .join("\n");
    //     }

    //     // Only append to historical context if conversational content is found
    //     if (textContent.trim()) {
    //       chatHistory.push({ role: "ai", content: textContent });
    //     }
    //   }
    // }

    for (const msg of rawMessages) {
      if (msg instanceof HumanMessage) {
        chatHistory.push({ role: "human", content: msg.content as string });
      } else if (msg instanceof AIMessage && msg.content) {
        let textContent = "";

        if (typeof msg.content === "string") {
          textContent = msg.content;
        } else if (Array.isArray(msg.content)) {
          textContent = msg.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text)
            .join("\n");
        }

        if (textContent.trim()) {
          chatHistory.push({ role: "ai", content: textContent });
        }
      }
    }

    res.json({
      exists: true,
      status: isPaused ? "paused" : "completed",
      history: chatHistory,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to extract session state payload." });
  }
});

/**
 * GET /api/chat/stream
 * Handles SSE conversation loops using the exact query parameter structure required by the UI hook.
 */
appServer.get("/api/chat/stream", async (req, res) => {
  const { session_id, message } = req.query as unknown as ChatQuery;

  if (!session_id || !message) {
    res.status(400).send("data: " + JSON.stringify({ error: "Missing session_id or message" }) + "\n\n");
    return;
  }

  // Establish explicit Server-Sent Events network streaming protocols
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const config = { configurable: { thread_id: session_id } };

  try {
    const graphApp = await setupGraph();
    const state = await graphApp.getState(config);

        const stream = await graphApp.stream(
          { messages: [new HumanMessage(message)] },
          { ...config, streamMode: "values" }
        );

    for await (const event of stream) {
      if (event.messages && event.messages.length > 0) {
        const latestMsg = event.messages[event.messages.length - 1];

        if (latestMsg instanceof AIMessage) {
          let textToPrint = "";
          let activeTools: string[] = [];

          // Clean array chunk extraction layer matching the terminal baseline
          if (typeof latestMsg.content === "string") {
            textToPrint = latestMsg.content;
          } else if (Array.isArray(latestMsg.content)) {
            textToPrint = latestMsg.content
              .filter((block: any) => block.type === "text")
              .map((block: any) => block.text)
              .join("\n");
          }

          if (latestMsg.tool_calls && latestMsg.tool_calls.length > 0) {
            activeTools = latestMsg.tool_calls.map((t: any) => t.name);
          }

          // Construct the execution output packet matching the UI consumer expectations
          const updatePacket = {
            content: textToPrint,
            executing_tools: activeTools,
            status: "running"
          };

          res.write(`data: ${JSON.stringify(updatePacket)}\n\n`);
        }
      }
    }

    // Capture post-stream lifecycle changes to determine graph final state
    const finalState = await graphApp.getState(config);
    const finalStatus = finalState.next && finalState.next.length > 0 ? "paused" : "completed";

    res.write(`data: ${JSON.stringify({ status: finalStatus })}\n\n`);
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});

const bootServer = async () => {
  try {
    console.log("Initializing SessionFlow Graph & MCP Bridge...");
    graphApp = await setupGraph();

    const PORT = process.env.PORT || 8000;
    appServer.listen(PORT, () => {
      console.log(`🚀 SessionFlow Service Engine streaming on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to initialize graph:", err);
    process.exit(1);
  }
};

bootServer();