import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { SqlAgentStateType } from "../../state.js";
import { RAG_PROMPTS } from "../../../core/prompts/rag_agent_prompt.js";
import { CONFIG } from "../../../core/config.js";
import { queryCache } from "../../../core/cache/rag_agent_cache.js";

const model = new ChatGoogleGenerativeAI({
    apiKey: CONFIG.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.3, // Elevated temperature for fluid sentence phrasing
});

// TODO: remainig cache integration
// export async function synthesisNode(state: SqlAgentStateType) {

//     const systemPrompt = RAG_PROMPTS.DATA_SYNTHESIZER;

//     const messages = [
//         new SystemMessage("You are an analytical data concierge translating database records into human insights."),
//         new HumanMessage(systemPrompt)
//     ];

//     const response = await model.invoke(messages);
//     return {
//         messages: [new AIMessage(response.content as string)],
//         answer: response.content as string
//     };
// }

export async function synthesisNode(state: SqlAgentStateType) {
    if (state.answer === "CACHE_HIT") {
        const cachedResponse = queryCache.get(state.intent) || "Error retrieving cache.";
        return { answer: cachedResponse };
    }

    if (state.sqlError) {
        return { answer: `I encountered a fatal database error I couldn't automatically fix: ${state.sqlError}` };
    }

    // Intercept empty data before it reaches the LLM
    if (state.answer === "[]") {
        return {
            answer: `The SQL query executed successfully, but returned zero rows. \n\nFailed Query Triggered: \n${state.currentSql}`
        };
    }

    const prompt = RAG_PROMPTS.DATA_SYNTHESIZER
        .replace("{{USER_INTENT}}", state.intent)
        .replace("{{DB_MATRIX}}", state.answer);

    const response = await model.invoke([
        new SystemMessage("You are an analytical data concierge translating database records into human insights."),
        new HumanMessage(prompt)
    ]);

    const finalAnswer = response.content as string;
    queryCache.set(state.intent, finalAnswer);

    return { answer: finalAnswer };
}