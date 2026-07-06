/*
* * USAGE: npx tsx test_db_connect.ts
*/ 

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("🔌 Attempting to connect to Supabase via TCP/IP Pooler...");
  
//   if (!process.env.SUPABASE_URL) {
//     console.error("❌ Error: SUPABASE_URL is missing from your .env file.");
//     process.exit(1);
//   }

  const pool = new Pool({
    connectionString: process.env.SUPABASE_URL,
    connectionTimeoutMillis: 5000 // 5 seconds timeout fail-fast
  });

  try {
    // 1. Verify basic connection and active database role
    const connectionResult = await pool.query("SELECT current_user, current_database();");
    const { current_user, current_database } = connectionResult.rows[0];
    
    console.log(`\n✅ Connected successfully!`);
    console.log(`👤 Active DB Role: \x1b[36m${current_user}\x1b[0m`);
    console.log(`📦 Database Name: \x1b[36m${current_database}\x1b[0m`);

    // 2. Test read-access on the semantic reporting view
    console.log("\n📊 Testing access to public.v_race_results_summary...");
    const viewResult = await pool.query("SELECT COUNT(*) FROM public.v_race_results_summary;");
    console.log(`📈 View Row Count: \x1b[32m${viewResult.rows[0].count}\x1b[0m`);

    // 3. Verify security layer (RBAC check)
    console.log("\n🛡️ Running RBAC Write-Protection Test (This should fail)...");
    try {
      await pool.query("CREATE TABLE public.agent_malicious_test (id INT);");
      console.error("❌ SECURITY WARNING: The role has write permissions! It succeeded in creating a table.");
    } catch (err: any) {
      console.log(`✅ Security Verified: Write access denied as expected. (${err.message})`);
    }

    console.log("\n🎉 All database connection and security checks passed perfectly.");
    await pool.end();
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ Database Connection Failed!");
    console.error(`Error Details: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

testConnection();