#!/usr/bin/env node

/**
 * California Unclaimed Property Data Import Script (Local Mode)
 * 
 * This script imports data from a local ZIP file containing California State Controller's Office
 * data into our Supabase database. The ZIP file should be placed in the temp/ directory.
 * 
 * Usage: node scripts/import-data-local.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AdmZip from 'adm-zip';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Argument parsing for --local flag
const isLocal = true;

// Configuration
const DOWNLOAD_DIR = path.join(__dirname, '../temp');
const ZIP_FILE = path.join(DOWNLOAD_DIR, 'california_data.zip');
const BATCH_SIZE = 250; // Process records in smaller batches to avoid conflicts

// Supabase configuration
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const SUPABASE_URL = LOCAL_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = LOCAL_SUPABASE_SERVICE_KEY;

console.log('--- Using LOCAL Supabase instance ---');
console.log(`URL: ${SUPABASE_URL}`);

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Create download directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
	fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}



function findCSVFilesRecursively(dir) {
	let csvFiles = [];

	const files = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// Recursively search subdirectories
			csvFiles = csvFiles.concat(findCSVFilesRecursively(fullPath));
		} else if (file.toLowerCase().endsWith('.csv')) {
			csvFiles.push(fullPath);
		}
	}

	return csvFiles;
}

async function extractZipFile(zipPath, extractDir) {
	console.log(`📦 Extracting ${zipPath}...`);

	if (!fs.existsSync(extractDir)) {
		fs.mkdirSync(extractDir, { recursive: true });
	}

	const zip = new AdmZip(zipPath);
	zip.extractAllTo(extractDir, true);

	// Find CSV files recursively
	const csvFiles = findCSVFilesRecursively(extractDir);

	console.log(`✅ Extracted and found ${csvFiles.length} CSV files`);

	// Log the found files for debugging
	csvFiles.forEach(file => {
		console.log(`   📄 Found: ${path.relative(extractDir, file)}`);
	});

	return csvFiles;
}

async function createImportRecord(totalRecords) {
	const { data, error } = await supabase
		.from('data_imports')
		.insert([{
			source_url: 'local_zip_file',
			total_records: totalRecords,
			import_status: 'in_progress'
		}])
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create import record: ${error.message}`);
	}

	return data.id;
}

async function updateImportRecord(importId, updates) {
	const { error } = await supabase
		.from('data_imports')
		.update(updates)
		.eq('id', importId);

	if (error) {
		console.error('Failed to update import record:', error);
	}
}

async function countCSVRecords(filePath) {
	return new Promise((resolve, reject) => {
		let recordCount = 0;
		let isFirstRow = true;

		createReadStream(filePath)
			.pipe(parse({
				delimiter: ',',
				quote: '"',
				escape: '"',
				columns: false,
				skip_empty_lines: true
			}))
			.on('data', (row) => {
				if (isFirstRow) {
					isFirstRow = false;
				} else {
					recordCount++;
				}
			})
			.on('end', () => {
				resolve(recordCount);
			})
			.on('error', (error) => {
				reject(error);
			});
	});
}

async function processCSVFileStreaming(filePath, importId) {
	const records = await parseCSVFile(filePath);
	const { successfulRecords, failedRecords } = await processRecords(records, importId);
	return { successfulRecords, failedRecords };
}

async function parseCSVFile(filePath) {
	return new Promise((resolve, reject) => {
		const records = [];
		const headers = [];
		let isFirstRow = true;
		let debugCount = 0;

		console.log(`📄 Parsing ${path.basename(filePath)}...`);

		createReadStream(filePath)
			.pipe(parse({
				delimiter: ',',
				quote: '"',
				escape: '"',
				columns: false,
				skip_empty_lines: true
			}))
			.on('data', (row) => {
				if (isFirstRow) {
					headers.push(...row);
					console.log(`   📋 Headers: ${headers.slice(0, 5).join(', ')}... (${headers.length} total)`);
					isFirstRow = false;
				} else {
					// Convert row array to object using headers
					const record = {};
					headers.forEach((header, index) => {
						record[header] = row[index] || '';
					});
					records.push(record);

					// Debug first few records
					if (debugCount < 3) {
						console.log(`   🔍 Sample record ${debugCount + 1}: ID=${record.PROPERTY_ID || 'N/A'}, Owner=${record.OWNER_NAME || 'N/A'}, Amount=${record.CURRENT_CASH_BALANCE || 'N/A'}`);
						debugCount++;
					}
				}
			})
			.on('end', () => {
				console.log(`✅ Parsed ${records.length.toLocaleString()} records from ${path.basename(filePath)}`);
				resolve(records);
			})
			.on('error', (error) => {
				reject(error);
			});
	});
}

function convertRecordToDatabase(record, index) {
	// Generate a unique ID based on property_id and owner_name
	const propertyId = record.PROPERTY_ID || record.id || '';
	const ownerName = record.OWNER_NAME || '';
	
	// Create a deterministic unique ID from property_id and owner_name
	let uniqueId;
	if (propertyId && ownerName) {
		// Use a hash-like approach to create a consistent ID
		const combined = `${propertyId}_${ownerName}`;
		uniqueId = combined.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
	} else if (propertyId) {
		uniqueId = propertyId;
	} else if (ownerName) {
		uniqueId = `owner_${ownerName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}`;
	} else {
		// Fallback for records with no property_id or owner_name
		uniqueId = `generated_${index}`;
	}

	return {
		id: uniqueId,
		property_type: record.PROPERTY_TYPE || '',
		cash_reported: parseFloat(record.CASH_REPORTED || '0') || 0,
		shares_reported: parseFloat(record.SHARES_REPORTED || '0') || 0,
		name_of_securities_reported: record.NAME_OF_SECURITIES_REPORTED || null,
		number_of_owners: record.NO_OF_OWNERS || '1',
		owner_name: record.OWNER_NAME || '',
		owner_street_1: record.OWNER_STREET_1 || null,
		owner_street_2: record.OWNER_STREET_2 || null,
		owner_street_3: record.OWNER_STREET_3 || null,
		owner_city: record.OWNER_CITY || null,
		owner_state: record.OWNER_STATE || null,
		owner_zip: record.OWNER_ZIP || null,
		owner_country_code: record.OWNER_COUNTRY_CODE || null,
		current_cash_balance: parseFloat(record.CURRENT_CASH_BALANCE || '0') || 0,
		number_of_pending_claims: parseInt(record.NUMBER_OF_PENDING_CLAIMS || '0') || 0,
		number_of_paid_claims: parseInt(record.NUMBER_OF_PAID_CLAIMS || '0') || 0,
		holder_name: record.HOLDER_NAME || '',
		holder_street_1: record.HOLDER_STREET_1 || null,
		holder_street_2: record.HOLDER_STREET_2 || null,
		holder_street_3: record.HOLDER_STREET_3 || null,
		holder_city: record.HOLDER_CITY || null,
		holder_state: record.HOLDER_STATE || null,
		holder_zip: record.HOLDER_ZIP || null,
		cusip: record.CUSIP || null
	};
}

function deduplicateBatch(records) {
	const seen = new Set();
	const deduplicated = [];

	for (const record of records) {
		if (!seen.has(record.id)) {
			seen.add(record.id);
			deduplicated.push(record);
		}
	}

	return deduplicated;
}

async function insertBatch(records, importId) {
	// Deduplicate records within the batch
	const deduplicatedRecords = deduplicateBatch(records);

	if (deduplicatedRecords.length < records.length) {
		console.log(`   🔧 Deduplicated batch: ${records.length} -> ${deduplicatedRecords.length} records`);
	}

	// Use upsert with ignoreDuplicates to handle conflicts gracefully
	const { data, error } = await supabase
		.from('unclaimed_properties')
		.upsert(deduplicatedRecords, {
			onConflict: 'id',
			ignoreDuplicates: true
		});

	if (error) {
		console.error('Batch insert error:', error);
		throw error;
	}

	return deduplicatedRecords.length;
}

async function processRecords(records, importId) {
	console.log(`🔄 Processing ${records.length} total records...`);

	let successfulRecords = 0;
	let failedRecords = 0;

	// Process in batches
	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		const convertedBatch = batch.map((record, index) => convertRecordToDatabase(record, i + index));

		try {
			const insertedCount = await insertBatch(convertedBatch, importId);
			successfulRecords += insertedCount;

			console.log(`✅ Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)} (${insertedCount} records)`);

			// Update progress
			await updateImportRecord(importId, {
				successful_records: successfulRecords
			});

		} catch (error) {
			const errorMessage = error.message || JSON.stringify(error, null, 2);
			console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errorMessage);
			failedRecords += batch.length;

			await updateImportRecord(importId, {
				failed_records: failedRecords
			});
		}
	}

	return { successfulRecords, failedRecords };
}

async function cleanup() {
	console.log('🧹 Cleaning up temporary files...');
	try {
		if (fs.existsSync(DOWNLOAD_DIR)) {
			fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
		}
		console.log('✅ Cleanup completed');
	} catch (error) {
		console.error('⚠️ Cleanup failed:', error.message);
	}
}

async function main() {
	console.log('🚀 Starting California Unclaimed Property Data Import (Local Mode)');
	console.log('Using local ZIP file (no download)');

	let importId = null;
	const extractDir = path.join(DOWNLOAD_DIR, 'extracted');
	let csvFiles = [];

	try {
		// Step 1: Check for existing data to resume/reuse
		if (fs.existsSync(extractDir)) {
			console.log('🔎 Found existing extracted data directory.');
			csvFiles = findCSVFilesRecursively(extractDir);
			if (csvFiles.length > 0) {
				console.log(`  Found ${csvFiles.length} CSV files. Skipping download and extraction.`);
			} else {
				console.warn('⚠️ Extracted data directory is empty. Will attempt to re-process from ZIP if available.');
			}
		}

		// Step 2: Extract from existing ZIP file (no download needed)
		if (csvFiles.length === 0) {
			if (fs.existsSync(ZIP_FILE)) {
				console.log('🔎 Found existing ZIP file. Extracting...');
				csvFiles = await extractZipFile(ZIP_FILE, extractDir);
			} else {
				throw new Error('ZIP file not found. Please ensure the data file is available locally.');
			}
		}

		if (csvFiles.length === 0) {
			throw new Error('No CSV files found to process.');
		}

		// Step 3: Count total records first (without loading them)
		let totalRecords = 0;
		for (const csvFile of csvFiles) {
			const recordCount = await countCSVRecords(csvFile);
			totalRecords += recordCount;
			console.log(`📊 ${path.basename(csvFile)}: ${recordCount.toLocaleString()} records`);
		}

		console.log(`📊 Total records to process: ${totalRecords.toLocaleString()}`);

		// Step 4: Create import tracking record
		importId = await createImportRecord(totalRecords);
		console.log(`📝 Created import record with ID: ${importId}`);

		// Step 5: Clear existing data using the truncate function
		console.log('🗑️ Clearing existing data via TRUNCATE...');
		const { error: truncateError } = await supabase.rpc('truncate_unclaimed_properties');

		if (truncateError) {
			// Don't throw an error, but log a warning. The table might not exist on first run.
			console.warn('Warning: Could not clear existing data:', truncateError.message);
		}

		// Step 6: Process each CSV file individually to avoid memory issues
		let totalSuccessful = 0;
		let totalFailed = 0;

		for (let i = 0; i < csvFiles.length; i++) {
			const csvFile = csvFiles[i];
			console.log(`\n🔄 Processing file ${i + 1}/${csvFiles.length}: ${path.basename(csvFile)}`);

			const { successfulRecords, failedRecords } = await processCSVFileStreaming(csvFile, importId);
			totalSuccessful += successfulRecords;
			totalFailed += failedRecords;

			// Update progress after each file
			await updateImportRecord(importId, {
				successful_records: totalSuccessful,
				failed_records: totalFailed
			});

			console.log(`✅ File ${i + 1} completed: ${successfulRecords.toLocaleString()} successful, ${failedRecords} failed`);
		}

		// Step 7: Update final import status
		await updateImportRecord(importId, {
			successful_records: totalSuccessful,
			failed_records: totalFailed,
			import_status: totalFailed > 0 ? 'completed_with_errors' : 'completed'
		});

		console.log('\n✅ Import completed successfully!');
		console.log(`📊 Final Summary:`);
		console.log(`   Total records: ${totalRecords.toLocaleString()}`);
		console.log(`   Successful: ${totalSuccessful.toLocaleString()}`);
		console.log(`   Failed: ${totalFailed.toLocaleString()}`);
		console.log(`   Success rate: ${((totalSuccessful / totalRecords) * 100).toFixed(2)}%`);

	} catch (error) {
		console.error('❌ Import failed:', error.message);

		if (importId) {
			await updateImportRecord(importId, {
				import_status: 'failed',
				error_message: error.message
			});
		}

		process.exit(1);
	} finally {
		await cleanup();
	}
}

// Run the import
main().catch(console.error); 