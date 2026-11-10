import XLSX from 'xlsx';
import path from 'path';
import {
  getAllKams,
  getKamByCountry,
  getCountriesByKam,
  getRegionsByKam,
  getCountryRegionInKam
} from '../src/data/kamData.js';

console.log('=== RUNNING COMPREHENSIVE KAM AUDIT ===\n');

// 1. Read Excel file directly as the ONLY source of truth
const excelPath = path.resolve('data-source/skygeni.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet1, { header: 1 });

const excelKamCountries = {};
const excelCountryKams = {};

for (let r = 6; r < rows.length; r++) {
  const row = rows[r];
  if (!row) continue;
  const rawCountry = row[2];
  const rawOwner = row[6];

  if (!rawCountry || !rawOwner) continue;
  const country = String(rawCountry).trim();
  const ownerStr = String(rawOwner).trim();

  if (!ownerStr || ownerStr.toLowerCase() === 'unknown' || ownerStr.toLowerCase() === 'not assigned') {
    continue;
  }

  const owners = ownerStr.split(',').map(s => s.trim()).filter(Boolean);
  for (const o of owners) {
    if (o.toLowerCase() === 'unknown' || o.toLowerCase() === 'not assigned') continue;
    if (!excelKamCountries[o]) excelKamCountries[o] = new Set();
    excelKamCountries[o].add(country);

    if (!excelCountryKams[country]) excelCountryKams[country] = new Set();
    excelCountryKams[country].add(o);
  }
}

let mismatches = 0;

// 2. Test Luay Arabi
console.log('--- TEST 1: Luay Arabi ---');
const luayExpected = ['Algeria', 'Iraq', 'Morocco', 'Qatar', 'Saudi Arabia'].sort();
const luayActual = getCountriesByKam('Luay Arabi').slice().sort();
console.log('Expected:', luayExpected);
console.log('Actual:  ', luayActual);
if (JSON.stringify(luayExpected) === JSON.stringify(luayActual)) {
  console.log('PASS: Luay Arabi has exactly the 5 expected countries.\n');
} else {
  console.error('FAIL: Luay Arabi country mismatch!\n');
  mismatches++;
}

// 3. Test Nishad Majeed
console.log('--- TEST 2: Nishad Majeed ---');
const nishadExpected = ['Bangladesh', 'Indonesia', 'Maldives', 'Singapore', 'Sri Lanka', 'Thailand'].sort();
const nishadActual = getCountriesByKam('Nishad Majeed').slice().sort();
console.log('Expected:', nishadExpected);
console.log('Actual:  ', nishadActual);
if (JSON.stringify(nishadExpected) === JSON.stringify(nishadActual)) {
  console.log('PASS: Nishad Majeed has exactly the 6 expected countries.\n');
} else {
  console.error('FAIL: Nishad Majeed country mismatch!\n');
  mismatches++;
}

// 4. Test countries with NO KAM
console.log('--- TEST 3: Countries with NO KAM in Excel ---');
const noKamCountries = ['Cyprus', 'Kazakhstan', 'Solomon Islands', 'Palau', 'Vanuatu'];
for (const c of noKamCountries) {
  const result = getKamByCountry(c);
  console.log(`Country "${c}" -> KAM: "${result}"`);
  if (result !== 'No Key Account Manager assigned') {
    console.error(`FAIL: Expected "No Key Account Manager assigned" for ${c}, got "${result}"`);
    mismatches++;
  }

  // Also verify it does not appear under ANY KAM
  const allKams = getAllKams();
  for (const k of allKams) {
    const kList = getCountriesByKam(k);
    if (kList.includes(c)) {
      console.error(`FAIL: ${c} erroneously found under KAM "${k}"!`);
      mismatches++;
    }
  }
}
console.log('PASS: All unassigned countries correctly return "No Key Account Manager assigned" and are in 0 KAM lists.\n');

// 5. Test Region tag for Sri Lanka
console.log('--- TEST 4: Region tag for Sri Lanka ---');
const sriLankaRegion = getCountryRegionInKam('Sri Lanka');
console.log(`Sri Lanka KAM panel region: "${sriLankaRegion}"`);
if (sriLankaRegion === 'APAC') {
  console.log('PASS: Sri Lanka correctly has region "APAC" from Excel.\n');
} else {
  console.error(`FAIL: Expected "APAC" for Sri Lanka, got "${sriLankaRegion}"\n`);
  mismatches++;
}

// 6. Test EVERY KAM in Excel vs Portal
console.log('--- TEST 5: Compare ALL KAMs in Excel with Portal ---');
const allExcelKams = Object.keys(excelKamCountries).sort();
const portalKams = getAllKams();

console.log(`Total KAMs in Excel: ${allExcelKams.length}`);
console.log(`Total KAMs in Portal: ${portalKams.length}`);

for (const kam of allExcelKams) {
  const expectedList = Array.from(excelKamCountries[kam]).sort();
  const actualList = getCountriesByKam(kam).slice().sort();

  const missingInPortal = expectedList.filter(c => !actualList.includes(c));
  const extraInPortal = actualList.filter(c => !expectedList.includes(c));

  if (missingInPortal.length > 0 || extraInPortal.length > 0) {
    console.error(`Mismatch for KAM "${kam}":`);
    if (missingInPortal.length > 0) console.error(`  Missing in portal: ${missingInPortal.join(', ')}`);
    if (extraInPortal.length > 0) console.error(`  Extra in portal: ${extraInPortal.join(', ')}`);
    mismatches++;
  }
}

console.log('\n========================================');
console.log(`FINAL RESULT: ${mismatches} mismatches`);
console.log('========================================\n');

