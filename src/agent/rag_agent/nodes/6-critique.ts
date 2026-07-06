import type { SqlAgentStateType } from "../../state.js";

export function critiqueRouterEdge(state: SqlAgentStateType): "generator" | "synthesizer" {
  // Check if query threw an error structure or produced zero rows
  const hasError = state.sqlError && state.sqlError.length > 0;
  // const isEmpty = state.answer === "[]";

  // TODO: why generator? instead need to check what's the error and then re-route based on error
  if ((hasError) && state.retryCount < 1) {
    console.warn(`⚠️ Critique Node: Execution anomaly caught. Routing back to generator. Attempt count: ${state.retryCount + 1}`);
    return "generator";
  }

  return "synthesizer";
}
