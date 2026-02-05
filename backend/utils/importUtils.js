/**
 * Import Utilities - Helper functions for Excel import
 *
 * Handles:
 * - Column name mapping (Excel → DB)
 * - Score calculations from raw values
 * - Data cleaning and validation
 */

const { calculateAllScores } = require('./scoreCalculations');

// Mapping from Excel template columns to database columns
const EXCEL_TO_DB_MAP = {
  // Required
  'Project Name': 'project_name',

  // Project Identification
  'Project Codename': 'project_codename',
  'Plant Owner': 'plant_owner',
  'Contact': 'contact',
  'Project Type': 'project_type',

  // Location & Market
  'ISO': 'iso',
  'Zone/Submarket': 'zone_submarket',
  'Location': 'location',

  // Technical Specifications
  'Legacy Capacity (MW)': 'legacy_nameplate_capacity_mw',
  'Tech': 'tech',
  'Fuel': 'fuel',
  'Heat Rate (Btu/kWh)': 'heat_rate_btu_kwh',
  'Legacy COD (Year)': 'legacy_cod',
  'Capacity Factor (%)': 'capacity_factor_2024',
  'Site Acreage': 'site_acreage',
  'Number of Sites': 'number_of_sites',

  // Transaction Details
  'Process Type': 'process_type',
  'Transactability': 'transactability_scores',
  'Gas Reference': 'gas_reference',

  // Redevelopment Details
  'Redev Base Case': 'redevelopment_base_case',
  'Redev Tier': 'redev_tier',
  'Redev Capacity (MW)': 'redev_capacity_mw',
  'Redev Tech': 'redev_tech',
  'Redev Fuel': 'redev_fuel',
  'Redev Heat Rate': 'redev_heatrate_btu_kwh',
  'Redev COD': 'redev_cod',
  'Redev Land Control': 'redev_land_control',
  'Redev Stage Gate': 'redev_stage_gate',
  'Redev Lead': 'redev_lead',
  'Redev Support': 'redev_support',
  'Co-Locate/Repower': 'co_locate_repower',

  // Scoring Inputs
  'Thermal Optimization': 'thermal_optimization',
  'Environmental Score': 'environmental_score',
  'Market Score': 'market_score',
  'Infra': 'infra',
  'IX': 'ix',

  // M&A Details
  'M&A Tier': 'ma_tier',
  'POI Voltage (kV)': 'poi_voltage_kv',

  // Legacy column names (from old format)
  'Legacy Nameplate Capacity (MW)': 'legacy_nameplate_capacity_mw',
  '2024 Capacity Factor': 'capacity_factor_2024',
  'Legacy COD': 'legacy_cod',
  'Process (P) or Bilateral (B)': 'process_type',
  'Transactability Scores': 'transactability_scores',
  'Redevelopment Base Case': 'redevelopment_base_case',
  'Redev Heatrate (Btu/kWh)': 'redev_heatrate_btu_kwh',
  'Envionmental Score': 'environmental_score', // Handle typo
  'POI Voltage (KV)': 'poi_voltage_kv'
};

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
 * Extract numeric value from various formats
 */
function extractNumericValue(val) {
  const cleaned = cleanValue(val);
  if (cleaned === null) return null;
  if (typeof cleaned === 'number') return cleaned;

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Calculate market score from ISO
 * PJM/NYISO/ISONE → 3, MISO North/SERC → 2, SPP/MISO South → 1, ERCOT/WECC/CAISO → 0
 */
function calculateMarketScore(iso) {
  if (!iso) return null;
  const isoStr = String(iso).trim().toUpperCase();

  const premiumMarkets = ['PJM', 'NYISO', 'ISO-NE', 'ISONE'];
  const goodMarkets = ['MISO NORTH', 'SERC', 'MISO N'];
  const neutralMarkets = ['SPP', 'MISO SOUTH', 'MISO S'];
  const poorMarkets = ['ERCOT', 'WECC', 'CAISO'];

  if (premiumMarkets.some(m => isoStr.includes(m))) return 3;
  if (goodMarkets.some(m => isoStr.includes(m))) return 2;
  if (neutralMarkets.some(m => isoStr.includes(m))) return 1;
  if (poorMarkets.some(m => isoStr.includes(m))) return 0;

  return 1; // Default
}

/**
 * Calculate COD score from year
 * <2000 → 3, 2000-2005 → 2, >2005 → 1
 */
function calculateCODScore(year) {
  if (!year) return null;
  const yearNum = parseInt(String(year).replace(/\D/g, '').substring(0, 4));
  if (isNaN(yearNum) || yearNum < 1900) return null;

  if (yearNum < 2000) return 3;
  if (yearNum <= 2005) return 2;
  return 1;
}

/**
 * Calculate capacity factor score
 * <10% → 3, 10-25% → 2, >25% → 1
 */
function calculateCapacityFactorScore(cf) {
  if (!cf && cf !== 0) return null;
  let cfNum = parseFloat(cf);
  if (isNaN(cfNum)) return null;

  // Normalize if given as percentage (>1)
  if (cfNum > 1) cfNum = cfNum / 100;

  if (cfNum < 0.1) return 3;
  if (cfNum <= 0.25) return 2;
  return 1;
}

/**
 * Calculate transactability score from value
 * Handles both numeric dropdown values (1, 2, 3) and text descriptions
 *
 * Mapping:
 * - Dropdown "1" / "Bilateral w/ developed relationship" → 3
 * - Dropdown "2" / "Bilateral w/ new relationship" or "Process w/ <10 bidders" → 2
 * - Dropdown "3" / "Competitive >10 bidders" → 1
 */
function calculateTransactabilityScore(value) {
  if (value === null || value === undefined || value === '') return null;

  // Handle numeric values (dropdown values 1, 2, 3)
  const num = parseInt(value);
  if (!isNaN(num)) {
    // Dropdown value 1 = Bilateral w/ developed = highest score (3)
    // Dropdown value 2 = Bilateral new/Process <10 = score 2
    // Dropdown value 3 = Competitive >10 = lowest score (1)
    if (num === 1) return 3;
    if (num === 2) return 2;
    if (num === 3) return 1;
    // If it's already the actual score (1, 2, 3), return as-is
    if (num >= 1 && num <= 3) return num;
  }

  // Handle text descriptions (from Excel imports)
  const valueStr = String(value).trim();
  if (valueStr === '' || valueStr === '#N/A' || valueStr === 'N/A' || valueStr === '#VALUE!') return null;

  const lowerValue = valueStr.toLowerCase();
  if (lowerValue.includes("bilateral") && lowerValue.includes("developed")) return 3;
  if (lowerValue.includes("bilateral") || lowerValue.includes("process")) return 2;
  if (lowerValue.includes("competitive")) return 1;

  return 2; // Default
}

/**
 * Calculate status from COD dates
 */
function calculateStatus(legacyCOD, redevCOD) {
  const currentYear = new Date().getFullYear();

  const extractYear = (cod) => {
    if (!cod) return null;
    const match = String(cod).match(/\b(\d{4})\b/);
    return match ? parseInt(match[1]) : null;
  };

  const redevYear = extractYear(redevCOD);
  if (redevYear != null) {
    return redevYear > currentYear ? 'Future' : 'Operating';
  }

  const legacyYear = extractYear(legacyCOD);
  if (legacyYear != null) {
    return legacyYear > currentYear ? 'Future' : 'Operating';
  }

  return 'Unknown';
}

/**
 * Transform an Excel row to database format with calculated scores
 *
 * @param {Object} excelRow - Raw row from Excel
 * @returns {Object} - Transformed row with DB column names and calculated scores
 */
function transformExcelRow(excelRow) {
  const dbRow = {};

  // Map Excel columns to DB columns
  for (const [excelCol, value] of Object.entries(excelRow)) {
    const trimmedCol = excelCol.trim();
    const dbCol = EXCEL_TO_DB_MAP[trimmedCol];

    if (dbCol) {
      const cleanedValue = cleanValue(value);
      if (cleanedValue !== null) {
        dbRow[dbCol] = cleanedValue;
      }
    }
  }

  // Skip if no project name
  if (!dbRow.project_name) {
    return null;
  }

  // Calculate derived scores from raw values
  const iso = dbRow.iso;
  const legacyCOD = dbRow.legacy_cod;
  const capacityFactor = dbRow.capacity_factor_2024;
  const redevCOD = dbRow.redev_cod;

  // Markets score (calculated from ISO)
  const marketsScore = calculateMarketScore(iso);
  if (marketsScore !== null) {
    dbRow.markets = marketsScore.toString();
  }

  // COD score (calculated from Legacy COD year)
  const codScore = calculateCODScore(legacyCOD);
  if (codScore !== null) {
    dbRow.plant_cod = codScore.toString();
  }

  // Capacity factor score
  const cfScore = calculateCapacityFactorScore(capacityFactor);
  if (cfScore !== null) {
    dbRow.capacity_factor = cfScore.toString();
  }

  // Status (Operating/Future)
  dbRow.status = calculateStatus(legacyCOD, redevCOD);

  // Calculate composite scores using the canonical formula
  const scoresInput = {
    plant_cod: dbRow.plant_cod,
    markets: dbRow.markets,
    transactability_scores: dbRow.transactability_scores,
    thermal_optimization: dbRow.thermal_optimization,
    environmental_score: dbRow.environmental_score,
    market_score: dbRow.market_score,
    infra: dbRow.infra,
    ix: dbRow.ix,
    co_locate_repower: dbRow.co_locate_repower
  };

  const calculatedScores = calculateAllScores(scoresInput);

  // Add calculated scores
  if (calculatedScores.thermal_score !== null) {
    dbRow.thermal_score = calculatedScores.thermal_score.toString();
  }
  if (calculatedScores.redevelopment_score !== null) {
    dbRow.redev_score = calculatedScores.redevelopment_score.toString();
  }
  if (calculatedScores.overall_score !== null) {
    dbRow.overall_score = calculatedScores.overall_score.toString();
  }

  return dbRow;
}

/**
 * Transform multiple Excel rows
 *
 * @param {Array} excelRows - Array of Excel rows
 * @returns {Object} - { valid: [], invalid: [], errors: [] }
 */
function transformExcelData(excelRows) {
  const result = {
    valid: [],
    invalid: [],
    errors: []
  };

  for (let i = 0; i < excelRows.length; i++) {
    try {
      const transformed = transformExcelRow(excelRows[i]);

      if (transformed) {
        result.valid.push(transformed);
      } else {
        result.invalid.push({
          row: i + 1,
          reason: 'Missing project name'
        });
      }
    } catch (error) {
      result.errors.push({
        row: i + 1,
        error: error.message
      });
    }
  }

  return result;
}

module.exports = {
  EXCEL_TO_DB_MAP,
  cleanValue,
  extractNumericValue,
  calculateMarketScore,
  calculateCODScore,
  calculateCapacityFactorScore,
  calculateTransactabilityScore,
  calculateStatus,
  transformExcelRow,
  transformExcelData
};
