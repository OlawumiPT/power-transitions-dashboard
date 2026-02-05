/**
 * Import Transactability from Excel
 *
 * Usage: node backend/migrations/import-transactability.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const { calculateTransactabilityScore } = require('../utils/importUtils');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';

async function importTransactability() {
  console.log('📥 Importing transactability from Excel...');
  console.log(`📦 Schema: ${schema}\n`);

  const excelPath = path.join(__dirname, '..', '..', 'public', 'pt_cleanedrecords.xlsx');
  console.log(`📄 Reading: ${excelPath}\n`);

  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const excelData = XLSX.utils.sheet_to_json(sheet);

  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const row of excelData) {
    const projectName = row['Project Name'];
    if (!projectName) continue;

    // Get transactability from Excel (try score first, then text)
    let transactValue = row['Transactability Scores '] || row['Transactability Scores'];
    const transactText = row['Transactability '] || row['Transactability'];

    // If no numeric score, use the text description
    if (!transactValue || transactValue === '#N/A' || transactValue === 'N/A') {
      transactValue = transactText;
    }

    // Calculate the numeric score
    const transactScore = calculateTransactabilityScore(transactValue);

    if (transactScore === null) {
      console.log(`⏭️  ${projectName}: No transactability data`);
      skipped++;
      continue;
    }

    // Update database
    const result = await pool.query(`
      UPDATE ${schema}.projects
      SET transactability_scores = $1, transactability = $2, updated_at = NOW(), updated_by = 'excel-import'
      WHERE project_name = $3 AND is_active = true
      RETURNING id, project_name
    `, [transactScore, transactText || String(transactValue), projectName]);

    if (result.rows.length > 0) {
      console.log(`✅ ${projectName}: transactability_scores = ${transactScore}`);
      updated++;
    } else {
      console.log(`❓ ${projectName}: Not found in database`);
      notFound++;
    }
  }

  console.log(`\n========== IMPORT COMPLETE ==========`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped (no data): ${skipped}`);
  console.log(`❓ Not found: ${notFound}`);

  await pool.end();
}

importTransactability()
  .then(() => {
    console.log('\n🎉 Import completed!');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  });
