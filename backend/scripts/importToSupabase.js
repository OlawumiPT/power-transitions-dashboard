// Import script for Supabase
// Updated to use ideal column naming conventions from import template
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const XLSX = require('xlsx');
const path = require('path');
const database = require('../utils/db');
const { calculateAllScores } = require('../utils/scoreCalculations');
const {
  transformExcelData,
  calculateMarketScore,
  calculateCODScore,
  calculateStatus
} = require('../utils/importUtils');

async function importToSupabase(inputFile = null) {
  const pool = database.getPool();
  let client;

  try {
    console.log('🚀 IMPORT TO SUPABASE STARTING...');
    console.log('='.repeat(60));

    client = await pool.connect();

    // Set schema
    await client.query('SET search_path TO pipeline_dashboard');

    // Read Excel file - support either the new transformed_data.xlsx or the original
    const filePath = inputFile || path.join(__dirname, '../../public/transformed_data.xlsx');
    console.log(`📁 Reading: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: true });

    // Fix: Trim column names (some Excel columns have trailing spaces)
    data = data.map(row => {
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });
      return cleanRow;
    });

    console.log(`📊 Found ${data.length} records in Excel`);

    // Clear existing data
    console.log('\n🗑️ Clearing existing project data...');
    await client.query('TRUNCATE TABLE projects RESTART IDENTITY CASCADE');

    const insertSQL = `
      INSERT INTO projects (
        excel_row_id,
        plant_owner,
        project_codename,
        project_name,
        overall_project_score,
        thermal_operating_score,
        redevelopment_score,
        redevelopment_load_score,
        ic_score,
        process_type,
        number_of_sites,
        legacy_nameplate_capacity_mw,
        tech,
        heat_rate_btu_kwh,
        capacity_factor_2024,
        legacy_cod,
        gas_reference,
        redev_tier,
        redevelopment_base_case,
        redev_capacity_mw,
        redev_tech,
        redev_fuel,
        redev_heatrate_btu_kwh,
        redev_cod,
        redev_land_control,
        redev_stage_gate,
        redev_lead,
        redev_support,
        contact,
        iso,
        zone_submarket,
        location,
        site_acreage,
        fuel,
        plant_cod,
        capacity_factor,
        markets,
        thermal_optimization,
        environmental_score,
        market_score,
        infra,
        ix,
        co_locate_repower,
        transactability_scores,
        transactability,
        project_type,
        status,
        overall_score,
        thermal_score,
        redev_score,
        is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
        $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
      ) RETURNING id;
    `;

    console.log('\n📥 Starting import...');

    let successCount = 0;
    let errorCount = 0;

    for (const [index, row] of data.entries()) {
      try {
        const extractNumericValue = (val) => {
          if (val == null || val === '' || val === 'N/A' || val === '#N/A' || val === '#VALUE!') {
            return null;
          }
          if (typeof val === 'number') return val;
          const str = String(val).trim();
          if (str.includes('XLOOKUP') || str.includes('xlfn') || str.startsWith('=')) {
            return null;
          }
          const num = parseFloat(str);
          return isNaN(num) ? null : num;
        };

        const toString = (val) => {
          if (val == null || val === '' || val === 'N/A' || val === '#N/A' || val === '#VALUE!') {
            return null;
          }
          return String(val).trim();
        };

        const toInt = (val) => {
          const num = extractNumericValue(val);
          return num != null ? Math.round(num) : null;
        };

        // Thermal optimization defaults to 0 (not 1) per score calculation spec
        const toThermalOptimization = (val) => {
          const str = toString(val);
          if (str === null) return '0'; // Default to 0
          const num = parseInt(str);
          if (isNaN(num)) return '0';
          return String(Math.min(Math.max(num, 0), 2)); // Clamp to 0-2
        };

        // Helper to get value from either old or new column names
        const getVal = (...keys) => {
          for (const key of keys) {
            const val = row[key];
            if (val !== undefined && val !== null && val !== '') return val;
          }
          return null;
        };

        // Get ISO from either old "Market" or new "ISO" column
        const iso = toString(getVal('ISO', 'Market'));

        // Calculate market score from ISO (using shared utility)
        const marketScore = calculateMarketScore(iso);
        const marketScoreStr = marketScore !== null ? marketScore.toString() : '1';

        // Get legacy COD from either old or new column names
        const legacyCOD = toString(getVal('Legacy COD (Year)', 'Legacy COD'));
        const codScore = calculateCODScore(legacyCOD);

        // Calculate scores from component values using the canonical formula
        const calculatedScores = calculateAllScores({
          plant_cod: codScore || getVal('Plant  COD', 'Plant COD'),
          markets: marketScoreStr,
          transactability_scores: getVal('Transactability', 'Transactability Scores'),
          thermal_optimization: getVal('Thermal Optimization'),
          environmental_score: getVal('Environmental Score', 'Envionmental Score'),
          market_score: getVal('Market Score'),
          infra: getVal('Infra'),
          ix: getVal('IX'),
          co_locate_repower: getVal('Co-Locate/Repower')
        });

        const redevCOD = toString(getVal('Redev COD'));
        const statusValue = calculateStatus(legacyCOD, redevCOD);

        const values = [
          index + 1,
          toString(getVal('Plant Owner')),
          toString(getVal('Project Codename')),
          toString(getVal('Project Name')),
          toString(getVal('Overall Project Score')),  // Keep original for reference
          toString(getVal('Thermal Operating Score')), // Keep original for reference
          toString(getVal('Redevelopment Score')),     // Keep original for reference
          toString(getVal('Redevelopment (Load) Score')),
          toString(getVal('I&C Score')),
          toString(getVal('Process Type', 'Process (P) or Bilateral (B)')),
          toInt(getVal('Number of Sites')),
          toString(getVal('Legacy Capacity (MW)', 'Legacy Nameplate Capacity (MW)')),
          toString(getVal('Tech')),
          toString(getVal('Heat Rate (Btu/kWh)')),
          toString(getVal('Capacity Factor (%)', '2024 Capacity Factor')),
          legacyCOD,
          toString(getVal('Gas Reference')),
          toString(getVal('Redev Tier')),
          toString(getVal('Redev Base Case', 'Redevelopment Base Case')),
          toString(getVal('Redev Capacity (MW)')),
          toString(getVal('Redev Tech')),
          toString(getVal('Redev Fuel')),
          toString(getVal('Redev Heat Rate', 'Redev Heatrate (Btu/kWh)')),
          redevCOD,
          toString(getVal('Redev Land Control')),
          toString(getVal('Redev Stage Gate')),
          toString(getVal('Redev Lead')),
          toString(getVal('Redev Support')),
          toString(getVal('Contact')),
          iso,
          toString(getVal('Zone/Submarket')),
          toString(getVal('Location')),
          toString(getVal('Site Acreage')),
          toString(getVal('Fuel')),
          codScore !== null ? codScore.toString() : null, // plant_cod score
          toString(getVal('Capacity Factor')), // capacity factor score
          marketScoreStr,  // Calculated from ISO
          toThermalOptimization(getVal('Thermal Optimization')),
          toString(getVal('Environmental Score', 'Envionmental Score')),
          toString(getVal('Market Score')),
          toString(getVal('Infra')),
          toString(getVal('IX')),
          toString(getVal('Co-Locate/Repower')),
          toString(getVal('Transactability', 'Transactability Scores')),
          toString(getVal('Transactability')),
          toString(getVal('Project Type')),
          statusValue,
          calculatedScores.overall_score !== null ? calculatedScores.overall_score.toString() : null,
          calculatedScores.thermal_score !== null ? calculatedScores.thermal_score.toString() : null,
          calculatedScores.redevelopment_score !== null ? calculatedScores.redevelopment_score.toString() : null,
          true // is_active
        ];

        await client.query(insertSQL, values);
        successCount++;

        if (successCount % 10 === 0) {
          console.log(`   ✅ Imported ${successCount} records...`);
        }

      } catch (error) {
        errorCount++;
        console.error(`   ❌ Row ${index + 1}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);

    // Verify
    const count = await client.query('SELECT COUNT(*) as total FROM projects WHERE is_active = true');
    console.log(`\n🔍 Verification: ${count.rows[0].total} active projects in database`);

    // Sample data
    const sample = await client.query('SELECT project_name, plant_owner, iso, status FROM projects LIMIT 5');
    console.log('\n📋 Sample projects:');
    sample.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.project_name} | ${row.plant_owner} | ${row.iso} | ${row.status}`);
    });

    console.log('\n🎉 IMPORT SUCCESSFUL!');

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

// Allow specifying file path as command line argument
const args = process.argv.slice(2);
const inputFile = args[0] || null;

if (inputFile) {
  console.log(`Using custom input file: ${inputFile}`);
}

importToSupabase(inputFile);
