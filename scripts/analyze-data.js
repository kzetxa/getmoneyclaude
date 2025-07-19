#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

// === CONFIG ===
const ZIP_PATH = './scripts/04_From_500_To_Beyond.zip';

// === UTILS ===
function hashKey(...args) {
	return args.map(str => (str || '').trim().toUpperCase()).join('|');
}

// === ANALYSIS CONTAINERS ===
const counters = {
	total: 0,
	missingPropertyId: 0,
	keyStats: {
		propertyId: new Map(),
		ownerKey: new Map(),
		compositeKey: new Map(),
	}
};

// === MAIN ===
function processCSVFile(csvBuffer, fileName) {
	const records = parse(csvBuffer, {
		columns: true,
		skip_empty_lines: true
	});

	for (const record of records) {
		counters.total++;

		const propertyId = (record.PROPERTY_ID || '').trim();
		const ownerName = (record.OWNER_NAME || '').trim();
		const address = (record.OWNER_STREET_1 || '').trim();
		const city = (record.OWNER_CITY || '').trim();
		const zip = (record.OWNER_ZIP || '').trim();
		const cash = (record.CURRENT_CASH_BALANCE || '').trim();

		// Track missing property IDs
		if (!propertyId) {
			counters.missingPropertyId++;
		}

		// === Key 1: PROPERTY_ID
		if (propertyId) {
			const key = propertyId;
			counters.keyStats.propertyId.set(key, (counters.keyStats.propertyId.get(key) || 0) + 1);
		}

		// === Key 2: OWNER_NAME + ZIP
		const ownerKey = hashKey(ownerName, zip);
		counters.keyStats.ownerKey.set(ownerKey, (counters.keyStats.ownerKey.get(ownerKey) || 0) + 1);

		// === Key 3: Full Composite (owner + address + city + cash)
		const compositeKey = hashKey(ownerName, address, city, cash);
		counters.keyStats.compositeKey.set(compositeKey, (counters.keyStats.compositeKey.get(compositeKey) || 0) + 1);
	}

	console.log(`✅ Parsed ${records.length} rows from ${fileName}`);
}

function loadCSVFromZip(zipPath) {
	if (!fs.existsSync(zipPath)) {
		throw new Error(`File not found: ${zipPath}`);
	}

	const zip = new AdmZip(zipPath);
	const csvEntries = zip.getEntries().filter(entry => entry.entryName.endsWith('.csv'));

	if (csvEntries.length === 0) {
		console.warn('⚠️ No CSV files found in ZIP.');
		return;
	}

	for (const entry of csvEntries) {
		console.log(`📄 Found CSV: ${entry.entryName}`);
		const csvBuffer = entry.getData();
		processCSVFile(csvBuffer, entry.entryName);
	}
}

// === SUMMARY ===
function printSummary() {
	const dupes = (map) => [...map.entries()].filter(([_, count]) => count > 1);

	console.log('\n🔍 SUMMARY');
	console.log(`- Total records processed: ${counters.total}`);
	console.log(`- Records missing PROPERTY_ID: ${counters.missingPropertyId}`);

	console.log('\n🗝️ Key Duplicates:');

	const printDupes = (label, map) => {
		const duplicates = dupes(map);
		console.log(`\n> ${label}:`);
		console.log(`  - Unique values: ${map.size}`);
		console.log(`  - Duplicates: ${duplicates.length}`);
		if (duplicates.length > 0) {
			console.log('  - Top 5 duplicates:');
			duplicates.slice(0, 5).forEach(([key, count], i) => {
				console.log(`    ${i + 1}. ${key} (${count}x)`);
			});
		}
	};

	printDupes('PROPERTY_ID', counters.keyStats.propertyId);
	printDupes('OWNER_NAME + ZIP', counters.keyStats.ownerKey);
	printDupes('OWNER + ADDRESS + CITY + CASH', counters.keyStats.compositeKey);
}

// === RUN ===
console.log(`🚀 Starting analysis of ZIP: ${ZIP_PATH}`);
loadCSVFromZip(ZIP_PATH);
printSummary();
