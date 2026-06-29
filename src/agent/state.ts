import { MessagesAnnotation } from "@langchain/langgraph";

export const SessionStateAnnotation = MessagesAnnotation;
export type SessionState = typeof SessionStateAnnotation.State;