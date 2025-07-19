#!/usr/bin/env node

import fs from 'fs';
import { parse } from 'csv-parse';
import { stringify } from "csv-stringify/sync";
import AdmZip from 'adm-zip';

let totalRows = 0;
let totalDuplicates = 0;
const duplicateCounts = new Map(); // PROPERTY_ID => count

const ZIP_PATH = './scripts/04_From_500_To_Beyond.zip';
const OUTPUT_FILE = './duplicates.csv';

// Temp file to track how many times each PROPERTY_ID appears
const seenMap = new Map(); // PROPERTY_ID => count
const rowCache = new Map(); // PROPERTY_ID => [rows]
const writeStream = fs.createWriteStream(OUTPUT_FILE);

let headersWritten = false;

function writeDuplicateRow(row, key) {
	if (!headersWritten) {
		const headers = ['duplicate_key', ...Object.keys(row)];
		const headerLine = stringify([headers], { header: false });
		writeStream.write(headerLine);
		headersWritten = true;
	}

	const rowWithKey = { duplicate_key: key, ...row };
	const line = stringify([rowWithKey], { header: false });
	writeStream.write(line);
}

async function processEntry(entry) {
	const content = entry.getData().toString('utf8');
	const parser = parse(content, {
		columns: true,
		skip_empty_lines: true
	});

	for await (const record of parser) {
		const propertyId = (record.PROPERTY_ID || '').trim();
		if (!propertyId) continue;

		totalRows++;

		const count = seenMap.get(propertyId) || 0;

		if (count === 0) {
			rowCache.set(propertyId, record);
			seenMap.set(propertyId, 1);
		} else if (count === 1) {
			const first = rowCache.get(propertyId);
			if (first) {
				writeDuplicateRow(first, propertyId);
				rowCache.delete(propertyId);
			}
			writeDuplicateRow(record, propertyId);
			seenMap.set(propertyId, 2);
			duplicateCounts.set(propertyId, 2);
			totalDuplicates += 2;
		} else {
			writeDuplicateRow(record, propertyId);
			const newCount = (duplicateCounts.get(propertyId) || count) + 1;
			duplicateCounts.set(propertyId, newCount);
			seenMap.set(propertyId, count + 1);
			totalDuplicates++;
		}
	}

}


async function main() {
	console.log(`🚀 Scanning ZIP for CSV files: ${ZIP_PATH}`);
	const zip = new AdmZip(ZIP_PATH);
	const entries = zip.getEntries().filter(e => e.entryName.endsWith('.csv'));

	if (entries.length === 0) {
		console.error('❌ No CSV files found in the ZIP.');
		process.exit(1);
	}

	for (let i = 0; i < entries.length; i++) {
		console.log(`🔍 Processing [${i + 1}/${entries.length}]: ${entries[i].entryName}`);
		await processEntry(entries[i]);
	}

	writeStream.end();
	console.log(`✅ Done. Duplicates written to: ${OUTPUT_FILE}`);

	console.log(`\n📊 DUPLICATE SUMMARY`);
	console.log(`- Total rows processed: ${totalRows}`);
	console.log(`- Total duplicates written: ${totalDuplicates}`);
	console.log(`- Unique PROPERTY_IDs with duplicates: ${duplicateCounts.size}`);

	const sortedDupes = [...duplicateCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	console.log(`- Top 5 most duplicated PROPERTY_IDs:`);
	sortedDupes.forEach(([id, count], i) => {
		console.log(`  ${i + 1}. ${id} (${count}x)`);
	});

}

main().catch(err => {
	console.error('❌ Error:', err);
	process.exit(1);
});
