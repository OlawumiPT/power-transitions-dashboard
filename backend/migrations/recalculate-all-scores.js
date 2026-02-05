/**
 * Migration Script: Recalculate All Project Scores
 *
 * This script recalculates all derived and composite scores for existing projects.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node backend/migrations/recalculate-all-scores.js
 *
 * Make sure your environment variables are set (DB connection, etc.)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const { calculateAllScores } = require('../utils/scoreCalculations');
const {
  calculateMarketScore,
  calculateCODScore,
  calculateCapacityFactorScore,
  calculateTransactabilityScore,
  calculateStatus
} = require('../utils/importUtils');

// Create database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const schema = process.env.DB_SCHEMA || 'pipeline_dashboard';

async function recalculateAllScores() {
  console.log('🚀 Starting score recalculation migration...');
  console.log(`📦 Schema: ${schema}`);

  const client = await pool.connect();

  try {
    // Fetch all active projects
    const fetchQuery = `
      SELECT * FROM ${schema}.projects
      WHERE is_active = true
      ORDER BY id
    `;

    const { rows: projects } = await client.query(fetchQuery);
    console.log(`📊 Found ${projects.length} projects to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const project of projects) {
      try {
        // Calculate derived scores from raw values
        const derivedScores = {};

        // Market score from ISO
        if (project.iso) {
          derivedScores.markets = calculateMarketScore(project.iso);
        }

        // COD score from Legacy COD
        if (project.legacy_cod) {
          derivedScores.plant_cod = calculateCODScore(project.legacy_cod);
        }

        // Capacity factor score
        if (project.capacity_factor_2024 !== null && project.capacity_factor_2024 !== undefined) {
          derivedScores.capacity_factor = calculateCapacityFactorScore(project.capacity_factor_2024);
        }

        // Transactability score (handles both numeric and text)
        const transactValue = project.transactability_scores || project.transactability;
        if (transactValue !== null && transactValue !== undefined && transactValue !== '') {
          derivedScores.transactability_scores = calculateTransactabilityScore(transactValue);
        }

        // Status from COD dates
        derivedScores.status = calculateStatus(project.legacy_cod, project.redev_cod);

        // Merge for composite calculation
        const rowWithDerived = { ...project, ...derivedScores };

        // Calculate composite scores
        const compositeScores = calculateAllScores(rowWithDerived);

        // Build update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (derivedScores.markets !== null && derivedScores.markets !== undefined) {
          updates.push(`markets = $${paramCount++}`);
          values.push(derivedScores.markets);
        }

        if (derivedScores.plant_cod !== null && derivedScores.plant_cod !== undefined) {
          updates.push(`plant_cod = $${paramCount++}`);
          values.push(derivedScores.plant_cod);
        }

        if (derivedScores.capacity_factor !== null && derivedScores.capacity_factor !== undefined) {
          updates.push(`capacity_factor = $${paramCount++}`);
          values.push(derivedScores.capacity_factor);
        }

        if (derivedScores.transactability_scores !== null && derivedScores.transactability_scores !== undefined) {
          updates.push(`transactability_scores = $${paramCount++}`);
          values.push(derivedScores.transactability_scores);
        }

        if (derivedScores.status) {
          updates.push(`status = $${paramCount++}`);
          values.push(derivedScores.status);
        }

        if (compositeScores.thermal_score !== null) {
          updates.push(`thermal_score = $${paramCount++}`);
          values.push(compositeScores.thermal_score);
          updates.push(`thermal_operating_score = $${paramCount++}`);
          values.push(compositeScores.thermal_score);
        }

        if (compositeScores.redevelopment_score !== null) {
          updates.push(`redev_score = $${paramCount++}`);
          values.push(compositeScores.redevelopment_score);
          updates.push(`redevelopment_score = $${paramCount++}`);
          values.push(compositeScores.redevelopment_score);
        }

        if (compositeScores.overall_score !== null) {
          updates.push(`overall_score = $${paramCount++}`);
          values.push(compositeScores.overall_score);
          updates.push(`overall_project_score = $${paramCount++}`);
          values.push(compositeScores.overall_score);
        }

        if (updates.length === 0) {
          console.log(`⏭️  [${project.id}] ${project.project_name}: No updates needed`);
          skipped++;
          continue;
        }

        // Add updated_at and id
        updates.push(`updated_at = NOW()`);
        updates.push(`updated_by = $${paramCount++}`);
        values.push('migration');

        values.push(project.id);

        const updateQuery = `
          UPDATE ${schema}.projects
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
        `;

        await client.query(updateQuery, values);

        console.log(`✅ [${project.id}] ${project.project_name}: thermal=${compositeScores.thermal_score}, redev=${compositeScores.redevelopment_score}, overall=${compositeScores.overall_score}, transact_score=${derivedScores.transactability_scores}`);
        updated++;

      } catch (err) {
        console.error(`❌ [${project.id}] ${project.project_name}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n========== MIGRATION COMPLETE ==========');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${projects.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
recalculateAllScores()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
