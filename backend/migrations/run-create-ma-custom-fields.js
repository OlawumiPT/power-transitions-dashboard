/**
 * Migration Script: Create ma_custom_fields registry table
 *
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * Usage:
 *   node backend/migrations/run-create-ma-custom-fields.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';

async function runMigration() {
  console.log('Starting ma_custom_fields migration...');
  console.log(`Schema: ${schema}`);

  const client = await pool.connect();

  try {
    // Read and execute SQL, replacing schema placeholder
    let sql = fs.readFileSync(path.join(__dirname, 'create-ma-custom-fields.sql'), 'utf8');
    sql = sql.replace(/pipeline_dashboard/g, schema);

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('Migration completed successfully. ma_custom_fields table created.');

    // Verify table exists
    const verifyQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'ma_custom_fields'
      ORDER BY ordinal_position
    `;
    const result = await client.query(verifyQuery, [schema]);
    console.log(`Verified ma_custom_fields table has ${result.rows.length} columns:`);
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
