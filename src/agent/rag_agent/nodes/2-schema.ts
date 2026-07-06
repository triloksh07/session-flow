import { supabasePool } from "../../../db/supabase.js";
import type { SqlAgentStateType } from "../../state.js";

// TODO: why few hardcoded tables?
export async function schemaDiscoveryNode(state: SqlAgentStateType) {
  // Query only reporting views and underlying telemetry tables
  const targetTables = ["v_race_results_summary", "races", "drivers", "constructors", "results"];
  
  try {
    const query = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
      ORDER BY table_name, ordinal_position;
    `;
    
    const result = await supabasePool.query(query, [targetTables]);
    
    // Group catalog rows systematically into structural clean strings
    const schemaMap = result.rows.reduce((acc: Record<string, string[]>, row) => {
      if (!acc[row.table_name]) acc[row.table_name] = [];
      acc[row.table_name].push(`  ${row.column_name} (${row.data_type})`);
      return acc;
    }, {});

    const schemaDump = Object.entries(schemaMap)
      .map(([table, cols]) => `Table: ${table}\nColumns:\n${cols.join("\n")}`)
      .join("\n\n");

    return { discoveredSchema: schemaDump };
  } catch (error: any) {
    return { discoveredSchema: `Failed to discover system catalog schema: ${error.message}` };
  }
}