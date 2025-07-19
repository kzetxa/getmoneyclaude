#!/usr/bin/env node

import fs from 'fs';
import { parse } from 'csv-parse';
import AdmZip from 'adm-zip';

const ZIP_PATH = './scripts/04_From_500_To_Beyond.zip';

const seenMap = new Map(); // key => count
let totalRows = 0;
let duplicateCount = 0;

function getKey(record) {
	const pid = (record.PROPERTY_ID || '').trim();
	const owner = (record.OWNER_NAME || '').trim().toUpperCase(); // Normalize case
	return `${pid}::${owner}`;
}

async function processEntry(entry) {
	const content = entry.getData().toString('utf8');
	const parser = parse(content, {
		columns: true,
		skip_empty_lines: true
	});

	for await (const record of parser) {
		totalRows++;

		const key = getKey(record);
		const count = seenMap.get(key) || 0;
		seenMap.set(key, count + 1);

		if (count >= 1) {
			duplicateCount++;
		}
	}
}

async function main() {
	console.log(`🔍 Scanning ZIP for unique PROPERTY_ID + OWNER_NAME combinations...`);
	const zip = new AdmZip(ZIP_PATH);
	const entries = zip.getEntries().filter(e => e.entryName.endsWith('.csv'));

	if (entries.length === 0) {
		console.error('❌ No CSV files found in the ZIP.');
		process.exit(1);
	}

	for (let i = 0; i < entries.length; i++) {
		console.log(`📂 Processing [${i + 1}/${entries.length}]: ${entries[i].entryName}`);
		await processEntry(entries[i]);
	}

	// Analyze top duplicates
	const duplicates = [...seenMap.entries()].filter(([_, count]) => count > 1);
	const top5 = duplicates
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([key, count], i) => {
			const [pid, owner] = key.split('::');
			return `  ${i + 1}. PROPERTY_ID=${pid}, OWNER_NAME="${owner}" (${count}x)`;
		});

	console.log(`\n📊 COMBINED KEY DUPLICATE SUMMARY`);
	console.log(`- Total rows processed: ${totalRows.toLocaleString()}`);
	console.log(`- Total duplicates (same PROPERTY_ID + OWNER_NAME): ${duplicateCount.toLocaleString()}`);
	console.log(`- Unique property-owner pairs with duplicates: ${duplicates.length.toLocaleString()}`);
	console.log(`- Top 5 most duplicated property-owner pairs:\n${top5.join('\n')}`);
}

main().catch(err => {
	console.error('❌ Error:', err);
	process.exit(1);
});
