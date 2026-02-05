/**
 * Transformation Script: Convert original Excel data to ideal template format
 *
 * This script reads powertransitions_data.xlsx (original format) and outputs
 * a clean file in the ideal import template format.
 *
 * Key transformations:
 * - Map column names to new ideal format
 * - Extract raw values (not pre-calculated scores)
 * - Handle Excel errors (#N/A, #VALUE!, formula strings)
 * - Skip score columns (will be calculated on import)
 */

const XLSX = require('xlsx');
const path = require('path');
const { TEMPLATE_COLUMNS, COLUMN_TO_DB_MAP } = require('./createImportTemplate');

// Mapping from ORIGINAL Excel columns to IDEAL template columns
// Note: Original file has some confusing names that we need to fix
const ORIGINAL_TO_TEMPLATE_MAP = {
  // Direct mappings
  'Project Name': 'Project Name',
  'Project Codename': 'Project Codename',
  'Plant Owner': 'Plant Owner',
  'Contact': 'Contact',
  'Project Type': 'Project Type',

  // Location - Note: Original has "Market" which is the ISO name
  'Market': 'ISO', // This is the ISO/RTO name, not the score
  'ISO': 'ISO',
  'Zone/Submarket': 'Zone/Submarket',
  'Location': 'Location',

  // Technical - note the different naming
  'Legacy Nameplate Capacity (MW)': 'Legacy Capacity (MW)',
  'Tech': 'Tech',
  'Fuel': 'Fuel',
  'Heat Rate (Btu/kWh)': 'Heat Rate (Btu/kWh)',
  'Legacy COD': 'Legacy COD (Year)', // This is the YEAR, not a score
  '2024 Capacity Factor': 'Capacity Factor (%)',
  'Site Acreage': 'Site Acreage',
  'Number of Sites': 'Number of Sites',

  // Transaction
  'Process (P) or Bilateral (B)': 'Process Type',
  'Transactability Scores': 'Transactability',
  'Transactibility_1': 'Transactability', // Numeric scores (1, 2, 3) - PRIMARY
  // Note: 'Transactibility' has text descriptions, we skip it in favor of numeric
  'Gas Reference': 'Gas Reference',

  // Redevelopment
  'Redevelopment Base Case': 'Redev Base Case',
  'Redev Tier': 'Redev Tier',
  'Redev Capacity (MW)': 'Redev Capacity (MW)',
  'Redev Tech': 'Redev Tech',
  'Redev Fuel': 'Redev Fuel',
  'Redev Heatrate (Btu/kWh)': 'Redev Heat Rate',
  'Redev COD': 'Redev COD',
  'Redev Land Control': 'Redev Land Control',
  'Redev Stage Gate': 'Redev Stage Gate',
  'Redev Lead': 'Redev Lead',
  'Redev Support': 'Redev Support',
  'Co-Locate/Repower': 'Co-Locate/Repower',

  // Scoring inputs (raw values)
  'Thermal Optimization': 'Thermal Optimization',
  'Envionmental Score': 'Environmental Score', // Note: Original has typo "Envionmental"
  'Environmental Score': 'Environmental Score',
  'Market Score': 'Market Score',
  'Infra': 'Infra',
  'IX': 'IX',

  // M&A
  'M&A Tier': 'M&A Tier',
  'POI Voltage (KV)': 'POI Voltage (kV)',
  'POI Voltage (kV)': 'POI Voltage (kV)'
};

// Columns to SKIP (pre-calculated scores that will be re-calculated on import)
const SKIP_COLUMNS = [
  'Overall Project Score',
  'Thermal Operating Score',
  'Redevelopment Score',
  'Redevelopment (Load) Score',
  'I&C Score',
  'Plant  COD', // This is the SCORE (0-3), not the year - SKIP
  'Plant COD',  // Same
  'COD', // Score column
  'Capacity Factor', // This is the SCORE, not the percentage - SKIP
  'Markets', // This is the SCORE calculated from ISO - SKIP
  'Market_1', // Duplicate/score column
  '__EMPTY', // Excel artifacts
  '__EMPTY_1',
  '__EMPTY_2',
  'Hardcoded Rank', // Not needed
  'Scored Rank' // Not needed
];

/**
 * Clean a cell value - handle Excel errors and empty values
 */
function cleanValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;

  const str = String(val).trim();

  // Handle Excel errors
  if (str === '' || str === '#N/A' || str === 'N/A' || str === '#VALUE!' || str === '#REF!') {
    return null;
  }

  // Handle formula strings that weren't evaluated
  if (str.includes('XLOOKUP') || str.includes('xlfn') || str.startsWith('=')) {
    return null;
  }

  return str;
}

/**
 * Transform a single row from original format to template format
 */
function transformRow(originalRow) {
  const newRow = {};

  // Go through each original column
  for (const [originalCol, value] of Object.entries(originalRow)) {
    const trimmedCol = originalCol.trim();

    // Skip pre-calculated score columns
    if (SKIP_COLUMNS.includes(trimmedCol)) {
      continue;
    }

    // Find the mapping to template column
    const templateCol = ORIGINAL_TO_TEMPLATE_MAP[trimmedCol];

    if (templateCol) {
      const cleanedValue = cleanValue(value);
      // Only add if we have a value
      if (cleanedValue !== null) {
        newRow[templateCol] = cleanedValue;
      }
    }
  }

  return newRow;
}

/**
 * Main transformation function
 */
async function transformOriginalToTemplate(options = {}) {
  const {
    inputPath = path.join(__dirname, '../../public/powertransitions_data.xlsx'),
    outputPath = path.join(__dirname, '../../public/transformed_data.xlsx'),
    sheetName = 'MASTER - Operating Plants',
    headerRow = 4 // Headers are on row 4 in original file
  } = options;

  console.log('='.repeat(60));
  console.log('TRANSFORM ORIGINAL DATA TO TEMPLATE FORMAT');
  console.log('='.repeat(60));

  // Read original file
  console.log(`\n📁 Reading: ${inputPath}`);
  let workbook;
  try {
    workbook = XLSX.readFile(inputPath);
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    return { success: false, error: error.message };
  }

  // List available sheets
  console.log(`📋 Available sheets: ${workbook.SheetNames.join(', ')}`);

  // Find the right sheet
  let worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    // Try first sheet if named sheet not found
    console.log(`⚠️ Sheet "${sheetName}" not found, using first sheet: ${workbook.SheetNames[0]}`);
    worksheet = workbook.Sheets[workbook.SheetNames[0]];
  }

  // Convert to JSON - handle the header row offset
  let data = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
    range: headerRow - 1 // 0-indexed, so row 4 = range 3
  });

  console.log(`📊 Found ${data.length} rows in original file`);

  // Trim column names (handle trailing spaces)
  data = data.map(row => {
    const cleanRow = {};
    Object.keys(row).forEach(key => {
      cleanRow[key.trim()] = row[key];
    });
    return cleanRow;
  });

  // Show original columns
  if (data.length > 0) {
    const originalCols = Object.keys(data[0]);
    console.log(`\n📋 Original columns (${originalCols.length}):`);
    originalCols.forEach((col, i) => {
      const mapped = ORIGINAL_TO_TEMPLATE_MAP[col];
      const skip = SKIP_COLUMNS.includes(col);
      if (skip) {
        console.log(`   ${i + 1}. ${col} → [SKIP - calculated on import]`);
      } else if (mapped) {
        console.log(`   ${i + 1}. ${col} → ${mapped}`);
      } else {
        console.log(`   ${i + 1}. ${col} → [NOT MAPPED]`);
      }
    });
  }

  // Transform all rows
  console.log('\n🔄 Transforming data...');
  const transformedData = data.map((row, idx) => {
    const transformed = transformRow(row);
    if (idx === 0) {
      console.log('   First row sample:', JSON.stringify(transformed).substring(0, 200) + '...');
    }
    return transformed;
  });

  // Filter out rows without Project Name (required field)
  const validData = transformedData.filter(row => row['Project Name']);
  console.log(`✅ ${validData.length} valid rows (with Project Name)`);
  console.log(`⚠️ ${transformedData.length - validData.length} rows skipped (missing Project Name)`);

  // Create output workbook
  const outputWorkbook = XLSX.utils.book_new();

  // Create worksheet with transformed data
  // First ensure all template columns exist (for consistent column order)
  const orderedData = validData.map(row => {
    const ordered = {};
    TEMPLATE_COLUMNS.forEach(col => {
      ordered[col] = row[col] !== undefined ? row[col] : '';
    });
    return ordered;
  });

  const ws = XLSX.utils.json_to_sheet(orderedData, { header: TEMPLATE_COLUMNS });

  // Set column widths
  ws['!cols'] = TEMPLATE_COLUMNS.map(col => ({ wch: Math.max(col.length + 2, 15) }));

  XLSX.utils.book_append_sheet(outputWorkbook, ws, 'Import Data');

  // Write output file
  XLSX.writeFile(outputWorkbook, outputPath);

  console.log(`\n✅ Transformed data saved to: ${outputPath}`);
  console.log(`   - ${validData.length} projects`);
  console.log(`   - ${TEMPLATE_COLUMNS.length} columns`);

  // Return summary
  return {
    success: true,
    inputFile: inputPath,
    outputFile: outputPath,
    totalRows: data.length,
    validRows: validData.length,
    skippedRows: transformedData.length - validData.length,
    columns: TEMPLATE_COLUMNS.length
  };
}

// Run if called directly
if (require.main === module) {
  transformOriginalToTemplate().then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('TRANSFORMATION COMPLETE');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { transformOriginalToTemplate, ORIGINAL_TO_TEMPLATE_MAP, cleanValue };
