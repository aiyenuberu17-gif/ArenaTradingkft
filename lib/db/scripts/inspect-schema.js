#!/usr/bin/env node
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('SUPABASE_DATABASE_URL or DATABASE_URL must be set');
  process.exit(2);
}

(async () => {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name='company_documents'
      ORDER BY ordinal_position`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Query failed:', err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
