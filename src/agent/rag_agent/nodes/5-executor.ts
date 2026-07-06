import { supabasePool } from "../../../db/supabase.js";
import type { SqlAgentStateType } from "../../state.js";

export async function queryExecutorNode(state: SqlAgentStateType) {
  // If the validator node flagged an error, jump straight out
  if (state.sqlError) return {};

  try {
    const result = await supabasePool.query(state.currentSql);
    // Explicitly pass data payloads through serialized strings

    return {
      answer: JSON.stringify(result.rows),
      sqlError: ""

      // If we want to retry on empty arrays, we increment here. 
      // But structurally, an empty array just means "no data exists for this valid query."
      // So we only increment retryCount on actual SQL syntax errors.
    };
  } catch (error: any) {

    const errorMsg = JSON.stringify(error.message) || "Unknown database error encountered."

    return {
      sqlError: errorMsg,
      retryCount: 1
    };
  }
}
