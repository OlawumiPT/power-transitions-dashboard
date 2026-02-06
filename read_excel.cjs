const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'dashboard-design', 'valuation_matrix.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('='.repeat(80));
console.log('SHEET NAMES:', workbook.SheetNames);
console.log('='.repeat(80));

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  console.log('\n' + '#'.repeat(80));
  console.log(`SHEET: "${sheetName}"`);
  console.log('#'.repeat(80));

  // Column headers (row 1 values)
  const columnHeaders = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: c });
    const cell = sheet[cellAddr];
    columnHeaders.push(cell ? cell.v : undefined);
  }
  console.log('\nCOLUMN HEADERS (Row 1 values):');
  columnHeaders.forEach((h, i) => {
    console.log(`  Col ${XLSX.utils.encode_col(i)}: ${h}`);
  });

  // Row headers (column A values)
  const rowHeaders = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellAddr = XLSX.utils.encode_cell({ r: r, c: 0 });
    const cell = sheet[cellAddr];
    rowHeaders.push(cell ? cell.v : undefined);
  }
  console.log('\nROW HEADERS (Column A values):');
  rowHeaders.forEach((h, i) => {
    console.log(`  Row ${i + 1}: ${h}`);
  });

  // Full data as JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log('\nFULL DATA (JSON):');
  console.log(JSON.stringify(jsonData, null, 2));
});
