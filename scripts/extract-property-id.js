#!/usr/bin/env node

import fs from 'fs';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';
import AdmZip from 'adm-zip';

const ZIP_PATH = './scripts/04_From_500_To_Beyond.zip';
const PROPERTY_ID_TO_EXTRACT = '1011303779';
const OUTPUT_FILE = `${PROPERTY_ID_TO_EXTRACT}.csv`;

async function extractRowsFromEntry(entry, targetId, collectedRows) {
	const content = entry.getData().toString('utf8');

	const parser = parse(content, {
		columns: true,
		skip_empty_lines: true,
	});

	for await (const record of parser) {
		const id = (record.PROPERTY_ID || '').trim();
		if (id === targetId) {
			collectedRows.push(record);
		}
	}
}

async function main() {
	console.log(`🔍 Extracting rows with PROPERTY_ID = ${PROPERTY_ID_TO_EXTRACT}`);

	const zip = new AdmZip(ZIP_PATH);
	const entries = zip.getEntries().filter(e => e.entryName.endsWith('.csv'));

	if (entries.length === 0) {
		console.error('❌ No CSV files found in ZIP archive.');
		process.exit(1);
	}

	const matchingRows = [];

	for (const entry of entries) {
		console.log(`📂 Scanning: ${entry.entryName}`);
		await extractRowsFromEntry(entry, PROPERTY_ID_TO_EXTRACT, matchingRows);
	}

	if (matchingRows.length === 0) {
		console.warn(`⚠️ No rows found for PROPERTY_ID ${PROPERTY_ID_TO_EXTRACT}`);
		return;
	}

	// Write to CSV
	const output = stringify(matchingRows, { header: true });
	fs.writeFileSync(OUTPUT_FILE, output);

	console.log(`✅ Done. Wrote ${matchingRows.length} rows to ${OUTPUT_FILE}`);
}

main().catch(err => {
	console.error('❌ Error:', err);
	process.exit(1);
});
