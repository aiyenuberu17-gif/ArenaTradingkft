#!/usr/bin/env node
import fs from "fs";
import pg from "pg";

const [, , sqlPath] = process.argv;
if (!sqlPath) {
  console.error("Usage: node apply-sql.js <path-to-sql-file>");
  process.exit(2);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL or DATABASE_URL must be set in environment");
  process.exit(2);
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration applied successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
