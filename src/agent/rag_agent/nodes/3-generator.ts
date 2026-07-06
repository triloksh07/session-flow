import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { SqlAgentStateType } from "../../state.js";
// import { config } from "../../core/config";
import { RAG_PROMPTS } from "../../../core/prompts/rag_agent_prompt.js";
import { CONFIG } from "../../../core/config.js";

const model = new ChatGoogleGenerativeAI({
    apiKey: CONFIG.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0,
});

export async function sqlGeneratorNode(state: SqlAgentStateType) {
    // Render our central template layout
    const systemPrompt = RAG_PROMPTS.SQL_GENERATOR
        .replace("{{DYNAMIC_SCHEMA}}", state.discoveredSchema)
        .replace("{{USER_INTENT}}", state.intent);

    // const messages = [new SystemMessage(systemPrompt)];
    // const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];
   
    const messages: BaseMessage[] = [
        new SystemMessage("You are a Staff-Level PostgreSQL Data Engineer specialized in analytical queries."),
        new HumanMessage(systemPrompt)
    ];

    // Inject the structured correction loop if we are on retry #1
    if (state.sqlError && state.retryCount > 0) {
        const retryPrompt = RAG_PROMPTS.SQL_RETRY_FEEDBACK.replace("{{ERROR_LOG}}", state.sqlError);
        messages.push(new HumanMessage(retryPrompt));
    }

    const response = await model.invoke(messages);

    const cleanSql = (response.content as string)
        .replace(/```sql/g, "")
        .replace(/```/g, "")
        .trim();

    return { currentSql: cleanSql };
}