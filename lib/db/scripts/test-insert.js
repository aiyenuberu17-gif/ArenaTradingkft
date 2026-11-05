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
    await client.query('BEGIN');
    const insertSql = `INSERT INTO company_documents (title, description, category, storage_path, file_name, mime_type, file_size, preview_path, display_order, is_active, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`;
    const values = [
      'COMPUTRADE',
      'Computrade',
      'Official Registration',
      'documents/test-doc.pdf',
      'test.pdf',
      'application/pdf',
      12345,
      'https://example.com/preview.jpg',
      0,
      true,
      'admin',
      'admin'
    ];
    const res = await client.query(insertSql, values);
    console.log('Insert returned:', res.rows[0]);
    await client.query('ROLLBACK');
    console.log('Rolled back test insert');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Insert failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
