import { MessagesAnnotation } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const SessionStateAnnotation = MessagesAnnotation;
export type SessionState = typeof SessionStateAnnotation.State;

export const SqlAgentState = Annotation.Root({
    // Active conversation history or current query context
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    // Clean text extract of user request
    intent: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    // Dynamically mapped database schemas from information_schema
    discoveredSchema: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    // Executable SQL candidate written by the generator
    currentSql: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    // Error message stack trace returned by PostgreSQL execution
    sqlError: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    // Strictly capped loop index
    retryCount: Annotation<number>({
        reducer: (x, y) => x + y,
        default: () => 0,
    }),
    // Final synthesized response
    answer: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
});

export type SqlAgentStateType = typeof SqlAgentState.State;