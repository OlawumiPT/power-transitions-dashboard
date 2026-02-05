/**
 * Script to create the custom_additions.xlsx file
 *
 * This file contains projects that are NOT in the original powertransitions_data.xlsx
 * but were added manually to pt_cleanedrecords.xlsx
 *
 * These need to be kept separate to track custom additions.
 * Format matches the ideal import template.
 */

const XLSX = require('xlsx');
const path = require('path');
const { TEMPLATE_COLUMNS } = require('./createImportTemplate');

// Custom projects that don't exist in the original file
// These should be verified and completed with actual data
const CUSTOM_PROJECTS = [
  // Placeholder entries - these need to be filled in with actual data
  // from the pt_cleanedrecords.xlsx that don't exist in powertransitions_data.xlsx
  {
    'Project Name': 'Custom Project 1',
    'Project Codename': '',
    'Plant Owner': '',
    'Contact': '',
    'Project Type': '',
    'ISO': '',
    'Zone/Submarket': '',
    'Location': '',
    'Legacy Capacity (MW)': '',
    'Tech': '',
    'Fuel': '',
    'Heat Rate (Btu/kWh)': '',
    'Legacy COD (Year)': '',
    'Capacity Factor (%)': '',
    'Site Acreage': '',
    'Number of Sites': '',
    'Process Type': '',
    'Transactability': '',
    'Gas Reference': '',
    'Redev Base Case': '',
    'Redev Tier': '',
    'Redev Capacity (MW)': '',
    'Redev Tech': '',
    'Redev Fuel': '',
    'Redev Heat Rate': '',
    'Redev COD': '',
    'Redev Land Control': '',
    'Redev Stage Gate': '',
    'Redev Lead': '',
    'Redev Support': '',
    'Co-Locate/Repower': '',
    'Thermal Optimization': '',
    'Environmental Score': '',
    'Market Score': '',
    'Infra': '',
    'IX': '',
    'M&A Tier': '',
    'POI Voltage (kV)': ''
  }
  // Add more custom projects as needed
];

function createCustomAdditionsFile() {
  console.log('Creating custom additions file...');

  // Create worksheet with custom projects
  const ws = XLSX.utils.json_to_sheet(CUSTOM_PROJECTS, { header: TEMPLATE_COLUMNS });

  // Set column widths
  ws['!cols'] = TEMPLATE_COLUMNS.map(col => ({ wch: Math.max(col.length + 2, 15) }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Custom Projects');

  // Add instructions sheet
  const instructions = [
    ['Custom Additions File'],
    [''],
    ['This file contains projects that are NOT in the original powertransitions_data.xlsx'],
    ['but need to be tracked separately.'],
    [''],
    ['Instructions:'],
    ['1. Add custom project data to the "Custom Projects" sheet'],
    ['2. Use the same column structure as the import template'],
    ['3. Import via the dashboard or use the import script'],
    [''],
    ['Note: Scores (thermal, redev, overall) will be calculated automatically on import.'],
    ['Only provide the raw data values, not pre-calculated scores.']
  ];
  const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
  ws_instructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws_instructions, 'Instructions');

  // Write file
  const outputPath = path.join(__dirname, '../../public/custom_additions.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log(`✅ Custom additions file created: ${outputPath}`);
  console.log('   Note: File contains placeholder data - fill in with actual custom projects');

  return outputPath;
}

// Run if called directly
if (require.main === module) {
  createCustomAdditionsFile();
}

module.exports = { createCustomAdditionsFile, CUSTOM_PROJECTS };
