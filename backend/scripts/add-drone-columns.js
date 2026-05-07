/**
 * add-drone-columns.js - Add missing columns to drones table
 * Usage: node scripts/add-drone-columns.js
 */

require("dotenv").config();
const pool = require("../db");

async function addDroneColumns() {
  console.log("\n[add-drone-columns] Adding missing columns to drones table...");
  
  const alterations = [
    "ALTER TABLE drones ADD COLUMN IF NOT EXISTS type TEXT",
    "ALTER TABLE drones ADD COLUMN IF NOT EXISTS camera TEXT", 
    "ALTER TABLE drones ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}'",
  ];

  for (const sql of alterations) {
    try {
      await pool.query(sql);
      console.log(`[add-drone-columns] ✓ Executed: ${sql}`);
    } catch (error) {
      console.error(`[add-drone-columns] ✗ Error: ${error.message}`);
    }
  }

  console.log("[add-drone-columns] ✓ Migration completed");
  await pool.end();
}

addDroneColumns().catch(console.error);
