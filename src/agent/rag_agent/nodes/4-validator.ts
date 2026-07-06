import type { SqlAgentStateType } from "../../state.js";

export async function programmaticValidatorNode(state: SqlAgentStateType) {
    let sql = state.currentSql.trim();

    if (!sql) {
        return { sqlError: "Validation Failure: Generated query string is empty." };
    }

    const destructiveKeywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT"];
    const containsMalicious = destructiveKeywords.some(keyword =>
        new RegExp(`\\b${keyword}\\b`, "i").test(sql)
    );

    if (containsMalicious) {
        return { sqlError: "Security Violation: Dangerous write-operation blocked programmatically." };
    }

    // Programmatically guarantee limit constraints to avoid blowing memory limits

    // TODO: need to update so that limit can be increased dynamically based on the intent
    if (!/\bLIMIT\b/i.test(sql)) {
        sql = sql.replace(/;?$/, " LIMIT 50;");
    }

    return { currentSql: sql, sqlError: "" };
}
