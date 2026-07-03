// import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { executeReadQuery } from "./execute_read_query.js"; // The tool we wrote earlier
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Define the schema/state for our Text-to-SQL graph
interface SqlAgentState {
    messages: any[];
    currentSql: string;
    sqlError: string;
    retryCount: number;
}

// Production Rule: Enforce Output Determinism (Temperature = 0)
// const sqlModel = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });
const sqlModel = new ChatGoogleGenerativeAI({ model: "gemini-falsh-2.5", temperature: 0 });

// 1. GENERATOR NODE: Writes the SQL query
async function generateSqlQueryNode(state: SqlAgentState) {
    const systemContext = `
    You are an expert PostgreSQL developer specialized in the Ergast Formula 1 database.
    Your task is to write a valid SQL query to answer the user's question.
    
    CRITICAL DATABASE RULES:
    1. Only use SELECT queries. Never attempt data modification.
    2. Always append a strict 'LIMIT 50' to protect compute resources unless a lower limit is requested.
    3. Empty or missing text data is represented as the literal string '\\N'. If filtering text columns for missing data, check for column = '\\N'.
    
    AVAILABLE SUMMARY VIEW (v_race_results_summary):
    - Columns: year, race_name, race_date, driver_name, driver_nationality, constructor_name, grid, position, points, laps, race_time_ms
    Use this view for general questions about race standings, winners, points, and times to bypass heavy manual JOIN syntax.
    
    If the previous attempt resulted in an error, analyze the error log provided in the context and correct your syntax completely.
    Return ONLY the executable SQL block wrapped inside markdown code blocks, nothing else.
  `;

    const contextMessages = [
        new SystemMessage(systemContext),
        ...state.messages
    ];

    if (state.sqlError) {
        contextMessages.push(new HumanMessage(`Your previous query failed with this error: ${state.sqlError}. Please rewrite it.`));
    }

    const response = await sqlModel.invoke(contextMessages);

    // Extract SQL from markdown block
    const sqlMatch = response.content.toString().match(/```sql([\s\S]*?)```/) || response.content.toString().match(/```([\s\S]*?)```/);
    const sqlQuery = sqlMatch ? sqlMatch[1].trim() : response.content.toString().trim();

    return { currentSql: sqlQuery, retryCount: state.retryCount + 1 };
}

// 2. LINTER / DOUBLE-CHECK NODE: Validates common mistakes before execution
async function lintSqlQueryNode(state: SqlAgentState) {
    const linterPrompt = `
    Review the following PostgreSQL query for safety and standard optimization rules:
    "${state.currentSql}"
    
    Ensure that:
    1. It does not contain hazardous keywords (DROP, DELETE, UPDATE, INSERT, ALTER).
    2. It contains a LIMIT clause. If it does not, append 'LIMIT 50' to it.
    
    Output the final verified SQL query statement string exactly as it should be executed, without any markdown formatting wrappers.
  `;

    const response = await sqlModel.invoke([new HumanMessage(linterPrompt)]);
    return { currentSql: response.content.toString().trim() };
}

// 3. EXECUTION NODE: Runs the query using our custom tool
async function executeSqlQueryNode(state: SqlAgentState) {
    // Call the tool functionally inside our graph workflow
    const toolResult = await executeReadQuery.invoke({ query: state.currentSql });

    if (toolResult.toString().startsWith("SQL Execution Error")) {
        return { sqlError: toolResult.toString() };
    }

    return {
        messages: [...state.messages, new AIMessage(`SQL Result Data: ${toolResult.toString()}`)],
        sqlError: ""
    };
}

// 4. ROUTING CONDITION: Self-Correction Control Flow
function routeExecution(state: SqlAgentState) {
    if (state.sqlError && state.retryCount < 3) {
        console.log(`⚠️ SQL execution failed. Initiating retry loop #${state.retryCount}...`);
        return "generator"; // Loop back to rewrite the query
    }
    return "synthesize";
}

// 5. SYNTHESIS NODE: Translates JSON back to a human response
async function synthesizeResponseNode(state: SqlAgentState) {
    const finalPrompt = `
    Based on the compiled database query results available in the chat history, 
    formulate a clean, comprehensive, and engaging response answering the user's initial question.
    Do not expose raw JSON fragments directly to the user; summarize it beautifully.
  `;
    const response = await sqlModel.invoke([...state.messages, new HumanMessage(finalPrompt)]);
    return { messages: [response] };
}

// --- COMPOSE THE STATE GRAPH ---
const workflow = new StateGraph<SqlAgentState>({
    channels: {
        messages: { value: (x, y) => x.concat(y), default: () => [] },
        currentSql: { value: (x, y) => y, default: () => "" },
        sqlError: { value: (x, y) => y, default: () => "" },
        retryCount: { value: (x, y) => y, default: () => 0 }
    }
})
    .addNode("generator", generateSqlQueryNode)
    .addNode("linter", lintSqlQueryNode)
    .addNode("executor", executeSqlQueryNode)
    .addNode("synthesize", synthesizeResponseNode);

workflow.setEntryPoint("generator");
workflow.addEdge("generator", "linter");
workflow.addEdge("linter", "executor");

// Dynamic error handling loop back or final exit
workflow.addConditionalEdges("executor", routeExecution, {
    generator: "generator",
    synthesize: "synthesize"
});

workflow.addEdge("synthesize", END);

export const sqlAgentGraph = workflow.compile();