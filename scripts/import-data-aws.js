#!/usr/bin/env node

/**
 * California Unclaimed Property Data Import Script (AWS PostgreSQL Version)
 * 
 * This script downloads the latest data from California State Controller's Office
 * and imports it into our AWS RDS PostgreSQL database.
 * 
 * Usage: node scripts/import-data-aws.js [--local]
 * 
 * Environment Variables Required:
 * - AWS_DB_HOST: AWS RDS endpoint
 * - AWS_DB_PORT: Database port (default: 5432)
 * - AWS_DB_NAME: Database name
 * - AWS_DB_USER: Database username
 * - AWS_DB_PASSWORD: Database password
 * - AWS_DB_SSL: SSL mode (default: require)
 */

import pg from 'pg';
import https from 'https';
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
const isLocal = process.argv.includes('--local');

// Configuration
const DATA_URLS = [
  'https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip',
  'https://dpupd.sco.ca.gov/03_From_100_To_Below_500.zip'
];
const DOWNLOAD_DIR = path.join(__dirname, '../temp');
const ZIP_FILES = DATA_URLS.map((_, index) => path.join(DOWNLOAD_DIR, `california_data_${index + 1}.zip`));
const BATCH_SIZE = 250; // Process records in smaller batches to avoid conflicts

// AWS PostgreSQL configuration
const AWS_DB_CONFIG = {
  host: "moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Latimer1!",
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Local PostgreSQL configuration (for development)
const LOCAL_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'unclaimed_properties',
  user: 'postgres',
  password: 'postgres',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const DB_CONFIG = isLocal ? LOCAL_DB_CONFIG : AWS_DB_CONFIG;

if (isLocal) {
  console.log('--- Using LOCAL PostgreSQL instance ---');
  console.log(`Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`Database: ${DB_CONFIG.database}`);
} else {
  console.log('--- Using AWS RDS PostgreSQL instance ---');
  console.log(`Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`Database: ${DB_CONFIG.database}`);
}

// Initialize PostgreSQL client pool
const pool = new pg.Pool(DB_CONFIG);

// Create download directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded to ${destination}`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        console.log(`↗️ Redirecting to ${redirectUrl}`);
        downloadFile(redirectUrl, destination).then(resolve).catch(reject);
      } else {
        reject(new Error(`Download failed with status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
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
  
  // Create a unique subdirectory for this ZIP file to avoid conflicts
  const zipFileName = path.basename(zipPath, '.zip');
  const uniqueExtractDir = path.join(extractDir, zipFileName);
  
  if (!fs.existsSync(uniqueExtractDir)) {
    fs.mkdirSync(uniqueExtractDir, { recursive: true });
  }
  
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(uniqueExtractDir, true);
  
  // Find CSV files recursively in this specific extraction directory
  const csvFiles = findCSVFilesRecursively(uniqueExtractDir);
  
  console.log(`✅ Extracted ${path.basename(zipPath)} and found ${csvFiles.length} CSV files`);
  
  // Log the found files for debugging
  csvFiles.forEach(file => {
    console.log(`   📄 Found: ${path.relative(extractDir, file)}`);
  });
  
  return csvFiles;
}

async function createTables() {
  const client = await pool.connect();
  try {
    // Drop existing tables if they exist
    console.log('🗑️ Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS unclaimed_properties CASCADE');
    await client.query('DROP TABLE IF EXISTS data_imports CASCADE');
    console.log('✅ Existing tables dropped');

    // Create data_imports table
    await client.query(`
      CREATE TABLE data_imports (
        id SERIAL PRIMARY KEY,
        source_url TEXT NOT NULL,
        total_records INTEGER NOT NULL,
        successful_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        import_status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create unclaimed_properties table
    await client.query(`
      CREATE TABLE unclaimed_properties (
        id TEXT PRIMARY KEY,
        property_type TEXT,
        cash_reported DECIMAL(15,2) DEFAULT 0,
        shares_reported DECIMAL(15,2) DEFAULT 0,
        name_of_securities_reported TEXT,
        number_of_owners TEXT DEFAULT '1',
        owner_name TEXT NOT NULL,
        owner_street_1 TEXT,
        owner_street_2 TEXT,
        owner_street_3 TEXT,
        owner_city TEXT,
        owner_state TEXT,
        owner_zip TEXT,
        owner_country_code TEXT,
        current_cash_balance DECIMAL(15,2) DEFAULT 0,
        number_of_pending_claims INTEGER DEFAULT 0,
        number_of_paid_claims INTEGER DEFAULT 0,
        holder_name TEXT NOT NULL,
        holder_street_1 TEXT,
        holder_street_2 TEXT,
        holder_street_3 TEXT,
        holder_city TEXT,
        holder_state TEXT,
        holder_zip TEXT,
        cusip TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX idx_unclaimed_properties_owner_name 
      ON unclaimed_properties USING gin(to_tsvector('english', owner_name));
    `);

    await client.query(`
      CREATE INDEX idx_unclaimed_properties_holder_name 
      ON unclaimed_properties USING gin(to_tsvector('english', holder_name));
    `);

    await client.query(`
      CREATE INDEX idx_unclaimed_properties_current_cash_balance 
      ON unclaimed_properties(current_cash_balance);
    `);

    console.log('✅ Database tables and indexes created');
  } finally {
    client.release();
  }
}

async function createImportRecord(totalRecords) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO data_imports (source_url, total_records, import_status)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [DATA_URLS.join('; '), totalRecords, 'in_progress']);
    
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function updateImportRecord(importId, updates) {
  const client = await pool.connect();
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(importId);

    const query = `
      UPDATE data_imports 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await client.query(query, values);
  } catch (error) {
    console.error('Failed to update import record:', error);
  } finally {
    client.release();
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
  // Generate a unique ID if the property ID is missing or empty
  const baseId = record.PROPERTY_ID || record.id || '';
  const uniqueId = baseId || `generated_${Date.now()}_${index}`;
  
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
  const deduplicatedRecords = deduplicateBatch(records);
  const columns = [
    'id', 'property_type', 'cash_reported', 'shares_reported',
    'name_of_securities_reported', 'number_of_owners', 'owner_name',
    'owner_street_1', 'owner_street_2', 'owner_street_3', 'owner_city',
    'owner_state', 'owner_zip', 'owner_country_code', 'current_cash_balance',
    'number_of_pending_claims', 'number_of_paid_claims', 'holder_name',
    'holder_street_1', 'holder_street_2', 'holder_street_3', 'holder_city',
    'holder_state', 'holder_zip', 'cusip'
  ];
  const colCount = columns.length; // 25

  // Build the placeholder groups dynamically
  const valuePlaceholders = deduplicatedRecords
    .map((_, rowIdx) => {
      const placeholders = Array(colCount)
        .fill(0)
        .map((__, colIdx) => `$${rowIdx * colCount + colIdx + 1}`);
      return `(${placeholders.join(', ')})`;
    })
    .join(', ');

  const query = `
    INSERT INTO unclaimed_properties (${columns.join(', ')})
    VALUES ${valuePlaceholders}
    ON CONFLICT (id) DO NOTHING
  `;

  const values = [];
  for (const record of deduplicatedRecords) {
    // push in exactly the same order as "columns"
    values.push(
      record.id,
      record.property_type,
      record.cash_reported,
      record.shares_reported,
      record.name_of_securities_reported,
      record.number_of_owners,
      record.owner_name,
      record.owner_street_1,
      record.owner_street_2,
      record.owner_street_3,
      record.owner_city,
      record.owner_state,
      record.owner_zip,
      record.owner_country_code,
      record.current_cash_balance,
      record.number_of_pending_claims,
      record.number_of_paid_claims,
      record.holder_name,
      record.holder_street_1,
      record.holder_street_2,
      record.holder_street_3,
      record.holder_city,
      record.holder_state,
      record.holder_zip,
      record.cusip
    );
  }

  // sanity‐check
  const expectedValues = deduplicatedRecords.length * colCount;
  if (values.length !== expectedValues) {
    console.error(`❌ Values mismatch: expected ${expectedValues}, got ${values.length}`);
    throw new Error('Values array length mismatch');
  }

  const client = await pool.connect();
  try {
    await client.query(query, values);
    return deduplicatedRecords.length;
  } finally {
    client.release();
  }
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

async function truncateUnclaimedProperties() {
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE TABLE unclaimed_properties RESTART IDENTITY CASCADE');
    console.log('✅ Cleared existing unclaimed properties data');
  } catch (error) {
    console.warn('Warning: Could not clear existing data:', error.message);
  } finally {
    client.release();
  }
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
  console.log('🚀 Starting California Unclaimed Property Data Import (AWS PostgreSQL)');
  console.log('Sources:');
  DATA_URLS.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });
  
  let importId = null;
  const extractDir = path.join(DOWNLOAD_DIR, 'extracted');
  let csvFiles = [];
  
  try {
    // Step 1: Create/verify database tables
    await createTables();
    
    // Step 2: Check for existing data to resume/reuse
    if (fs.existsSync(extractDir)) {
      console.log('🔎 Found existing extracted data directory.');
      csvFiles = findCSVFilesRecursively(extractDir);
      if (csvFiles.length > 0) {
        console.log(`  Found ${csvFiles.length} CSV files. Skipping download and extraction.`);
      } else {
        console.warn('⚠️ Extracted data directory is empty. Will attempt to re-process from ZIP if available.');
      }
    }

    // Step 3: Download and/or extract if needed
    if (csvFiles.length === 0) {
      console.log(`📥 Processing ${DATA_URLS.length} ZIP files...`);
      for (let i = 0; i < DATA_URLS.length; i++) {
        const dataUrl = DATA_URLS[i];
        const zipFile = ZIP_FILES[i];
        
        console.log(`\n🔄 Processing ZIP file ${i + 1}/${DATA_URLS.length}: ${path.basename(zipFile)}`);
        
        if (fs.existsSync(zipFile)) {
          console.log(`🔎 Found existing ZIP file: ${path.basename(zipFile)}. Skipping download.`);
        } else {
          console.log(`📥 Downloading ${path.basename(zipFile)}...`);
          await downloadFile(dataUrl, zipFile);
        }
        const extractedFiles = await extractZipFile(zipFile, extractDir);
        csvFiles = csvFiles.concat(extractedFiles);
        console.log(`📊 Total CSV files found so far: ${csvFiles.length}`);
        console.log(`✅ Completed processing ${path.basename(zipFile)}`);
      }
    }
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found to process.');
    }
    
    // Step 4: Count total records first (without loading them)
    let totalRecords = 0;
    for (const csvFile of csvFiles) {
      const recordCount = await countCSVRecords(csvFile);
      totalRecords += recordCount;
      console.log(`📊 ${path.basename(csvFile)}: ${recordCount.toLocaleString()} records`);
    }
    
    console.log(`📊 Total records to process: ${totalRecords.toLocaleString()}`);
    
    // Step 5: Create import tracking record
    importId = await createImportRecord(totalRecords);
    console.log(`📝 Created import record with ID: ${importId}`);
    
    // Step 6: Clear existing data
    await truncateUnclaimedProperties();
    
    // Step 7: Process each CSV file individually to avoid memory issues
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
    
    // Step 8: Update final import status
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
    await pool.end();
  }
}

// Run the import
main().catch(console.error); 