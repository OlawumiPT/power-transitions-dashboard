/**
 * Script to create the ideal Excel import template with proper column headers
 *
 * This template defines the IDEAL format for project data import.
 * Scores like markets, plant_cod, capacity_factor are CALCULATED on import,
 * not stored in Excel.
 */

const XLSX = require('xlsx');
const path = require('path');

// Define the ideal column structure (42 columns as per plan)
const TEMPLATE_COLUMNS = [
  // Required
  'Project Name',

  // Project Identification
  'Project Codename',
  'Plant Owner',
  'Contact',
  'Project Type',

  // Location & Market
  'ISO',
  'Zone/Submarket',
  'Location',

  // Technical Specifications
  'Legacy Capacity (MW)',
  'Tech',
  'Fuel',
  'Heat Rate (Btu/kWh)',
  'Legacy COD (Year)',
  'Capacity Factor (%)',
  'Site Acreage',
  'Number of Sites',

  // Transaction Details
  'Process Type',
  'Transactability',
  'Gas Reference',

  // Redevelopment Details
  'Redev Base Case',
  'Redev Tier',
  'Redev Capacity (MW)',
  'Redev Tech',
  'Redev Fuel',
  'Redev Heat Rate',
  'Redev COD',
  'Redev Land Control',
  'Redev Stage Gate',
  'Redev Lead',
  'Redev Support',
  'Co-Locate/Repower',

  // Scoring Inputs (Raw values that get converted to scores)
  'Thermal Optimization',
  'Environmental Score',
  'Market Score',
  'Infra',
  'IX',

  // M&A Details
  'M&A Tier',
  'POI Voltage (kV)'
];

// Column descriptions for reference (could be used in a second sheet)
const COLUMN_DESCRIPTIONS = {
  'Project Name': 'Unique identifier (REQUIRED)',
  'Project Codename': 'Internal code',
  'Plant Owner': 'Company name',
  'Contact': 'Contact person',
  'Project Type': 'M&A, Redev, Owned, etc.',
  'ISO': 'PJM, NYISO, ISONE, MISO, ERCOT, CAISO, SPP',
  'Zone/Submarket': 'Market zone',
  'Location': 'City, State',
  'Legacy Capacity (MW)': 'Plant capacity in megawatts',
  'Tech': 'ST, GT, CCGT, Hydro, Wind, Solar, BESS',
  'Fuel': 'Gas, Oil, Coal, Nuclear, etc.',
  'Heat Rate (Btu/kWh)': 'Heat rate',
  'Legacy COD (Year)': 'Commercial operation year (e.g., 1993)',
  'Capacity Factor (%)': '0-1 or 0-100',
  'Site Acreage': 'Developable acres',
  'Number of Sites': 'Site count',
  'Process Type': 'P (Process) or B (Bilateral)',
  'Transactability': '1=Bilateral developed, 2=Bilateral new, 3=Competitive',
  'Gas Reference': 'Gas reference point',
  'Redev Base Case': 'BESS, Solar, etc.',
  'Redev Tier': '0-3 or I-V',
  'Redev Capacity (MW)': 'Redevelopment capacity',
  'Redev Tech': 'Technology',
  'Redev Fuel': 'Fuel type',
  'Redev Heat Rate': 'Heat rate (Btu/kWh)',
  'Redev COD': 'Year or date',
  'Redev Land Control': 'Y/N',
  'Redev Stage Gate': '0, 1, 2, 3, P',
  'Redev Lead': 'Lead PM',
  'Redev Support': 'Support contact',
  'Co-Locate/Repower': 'Codevelopment, Repower',
  'Thermal Optimization': '0, 1, or 2',
  'Environmental Score': '0-3',
  'Market Score': '0-3 (for redev calculation)',
  'Infra': '0-3',
  'IX': '0-3',
  'M&A Tier': 'Owned, Exclusivity, second round, first round, pipeline, passed',
  'POI Voltage (kV)': 'Interconnection voltage'
};

// Mapping from template columns to DB columns
const COLUMN_TO_DB_MAP = {
  'Project Name': 'project_name',
  'Project Codename': 'project_codename',
  'Plant Owner': 'plant_owner',
  'Contact': 'contact',
  'Project Type': 'project_type',
  'ISO': 'iso',
  'Zone/Submarket': 'zone_submarket',
  'Location': 'location',
  'Legacy Capacity (MW)': 'legacy_nameplate_capacity_mw',
  'Tech': 'tech',
  'Fuel': 'fuel',
  'Heat Rate (Btu/kWh)': 'heat_rate_btu_kwh',
  'Legacy COD (Year)': 'legacy_cod',
  'Capacity Factor (%)': 'capacity_factor_2024',
  'Site Acreage': 'site_acreage',
  'Number of Sites': 'number_of_sites',
  'Process Type': 'process_type',
  'Transactability': 'transactability_scores',
  'Gas Reference': 'gas_reference',
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
  'Thermal Optimization': 'thermal_optimization',
  'Environmental Score': 'environmental_score',
  'Market Score': 'market_score',
  'Infra': 'infra',
  'IX': 'ix',
  'M&A Tier': 'ma_tier',
  'POI Voltage (kV)': 'poi_voltage_kv'
};

function createTemplate() {
  console.log('Creating import template...');

  // Create main data sheet with headers only
  const ws_data = [TEMPLATE_COLUMNS];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Set column widths
  const colWidths = TEMPLATE_COLUMNS.map(col => ({ wch: Math.max(col.length + 2, 15) }));
  ws['!cols'] = colWidths;

  // Create documentation sheet
  const docData = [
    ['Column Name', 'DB Column', 'Description', 'Required'],
    ...TEMPLATE_COLUMNS.map(col => [
      col,
      COLUMN_TO_DB_MAP[col] || '',
      COLUMN_DESCRIPTIONS[col] || '',
      col === 'Project Name' ? 'YES' : 'No'
    ])
  ];
  const ws_doc = XLSX.utils.aoa_to_sheet(docData);
  ws_doc['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 10 }];

  // Create calculated fields sheet (for reference)
  const calcData = [
    ['Calculated Field', 'Source Field', 'Calculation'],
    ['markets', 'ISO', 'PJM/NYISO/ISONE→3, MISO N/SERC→2, SPP/MISO S→1, ERCOT/WECC/CAISO→0'],
    ['plant_cod (score)', 'Legacy COD (Year)', '<2000→3, 2000-2005→2, >2005→1'],
    ['capacity_factor (score)', 'Capacity Factor (%)', '<10%→3, 10-25%→2, >25%→1'],
    ['fuel_score', 'Fuel', 'Gas/Oil→1, Solar/Wind/Coal/BESS→0'],
    ['capacity_size', 'Legacy Capacity (MW)', '>50MW→1, ≤50MW→0'],
    ['thermal_score', 'Multiple', '(COD×0.20)+(Markets×0.30)+(Transactability×0.30)+(ThermalOpt×0.05)+(Environmental×0.15)'],
    ['redev_score', 'Multiple', 'IF(Market/Infra/IX=0, 0, (Market×0.40+Infra×0.30+IX×0.30)×multiplier)'],
    ['overall_score', 'thermal + redev', 'thermal_score + redev_score'],
    ['overall_rating', 'overall_score', '≥4.5→Strong, ≥3.0→Moderate, <3.0→Weak'],
    ['status', 'COD dates', 'Operating/Future based on COD years vs current year']
  ];
  const ws_calc = XLSX.utils.aoa_to_sheet(calcData);
  ws_calc['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 60 }];

  // Create workbook with all sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import Data');
  XLSX.utils.book_append_sheet(wb, ws_doc, 'Column Reference');
  XLSX.utils.book_append_sheet(wb, ws_calc, 'Calculated Fields');

  // Write to file
  const outputPath = path.join(__dirname, '../../public/import_template.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log(`✅ Template created: ${outputPath}`);
  console.log(`   - ${TEMPLATE_COLUMNS.length} columns defined`);
  console.log('   - Sheets: Import Data, Column Reference, Calculated Fields');

  return { columns: TEMPLATE_COLUMNS, dbMap: COLUMN_TO_DB_MAP };
}

// Export for use by other modules
module.exports = { TEMPLATE_COLUMNS, COLUMN_TO_DB_MAP, COLUMN_DESCRIPTIONS };

// Run if called directly
if (require.main === module) {
  createTemplate();
}
