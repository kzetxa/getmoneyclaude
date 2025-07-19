#!/usr/bin/env node

/**
 * California Unclaimed Property Data Import Script (Local Supabase Sync)
 * 
 * This script processes the local ZIP file from California State Controller's Office
 * and imports it into your local Supabase database using streaming to avoid memory issues.
 * 
 * Usage: node scripts/import-data-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse';

// Configuration
const LOCAL_ZIP_PATH = './scripts/04_From_500_To_Beyond.zip';
const BATCH_SIZE = 100; // Smaller batch size for memory efficiency

// Local Supabase configuration
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Initialize Supabase client with service key for admin operations
const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_SERVICE_KEY);

console.log('--- Using LOCAL Supabase instance ---');
console.log(`URL: ${LOCAL_SUPABASE_URL}`);

// Global counter for unique ID generation
let globalRecordCounter = 0;

function findCSVFilesInZip(zipPath) {
  console.log(`📦 Reading ZIP file: ${zipPath}`);
  
  if (!fs.existsSync(zipPath)) {
    throw new Error(`ZIP file not found: ${zipPath}`);
  }
  
  const zip = new AdmZip(zipPath);
  const csvFiles = [];
  
  zip.getEntries().forEach(entry => {
    if (entry.entryName.toLowerCase().endsWith('.csv')) {
      csvFiles.push({
        name: entry.entryName,
        content: entry.getData()
      });
    }
  });
  
  console.log(`✅ Found ${csvFiles.length} CSV files`);
  csvFiles.forEach(file => {
    console.log(`   📄 Found: ${file.name}`);
  });
  
  return csvFiles;
}

async function createImportRecord(totalRecords) {
  const { data, error } = await supabase
    .from('data_imports')
    .insert([{
      source_url: LOCAL_ZIP_PATH,
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

async function countCSVRecords(csvContent) {
  return new Promise((resolve, reject) => {
    let recordCount = 0;
    let isFirstRow = true;
    
    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      columns: false,
      skip_empty_lines: true
    });
    
    parser.on('data', (row) => {
      if (isFirstRow) {
        isFirstRow = false;
      } else {
        recordCount++;
      }
    });
    
    parser.on('end', () => {
      resolve(recordCount);
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    parser.write(csvContent);
    parser.end();
  });
}

async function clearAnalysisTables() {
  console.log('🗑️ Clearing analysis tables...');
  
  try {
    // Clear discarded records table
    const { error: discardedError } = await supabase
      .from('discarded_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (discardedError) {
      console.warn('Warning: Could not clear discarded_records table:', discardedError.message);
    } else {
      console.log('✅ Cleared discarded_records table');
    }
    
    // Clear import analysis table
    const { error: analysisError } = await supabase
      .from('import_analysis')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (analysisError) {
      console.warn('Warning: Could not clear import_analysis table:', analysisError.message);
    } else {
      console.log('✅ Cleared import_analysis table');
    }
    
  } catch (error) {
    console.warn('Warning: Error clearing analysis tables:', error);
  }
}

async function recordDiscardedRecord(record, reason, importId, errorMessage, fileName, rowNumber) {
  try {
    const discardedRecord = {
      original_data: record,
      discard_reason: reason,
      error_message: errorMessage,
      file_name: fileName,
      row_number: rowNumber,
      import_id: importId
    };
    
    const { error } = await supabase
      .from('discarded_records')
      .insert([discardedRecord]);
      
    if (error) {
      console.error('Failed to record discarded record:', error);
    }
  } catch (error) {
    console.error('Error recording discarded record:', error);
  }
}

async function recordImportAnalysis(importId, analysis) {
  try {
    const analysisRecord = {
      import_id: importId,
      total_records: analysis.totalRecords,
      records_with_ids: analysis.recordsWithIds,
      records_without_ids: analysis.recordsWithoutIds,
      percentage_with_ids: ((analysis.recordsWithIds / analysis.totalRecords) * 100).toFixed(2),
      percentage_without_ids: ((analysis.recordsWithoutIds / analysis.totalRecords) * 100).toFixed(2),
      sample_records: analysis.sampleRecords
    };
    
    const { error } = await supabase
      .from('import_analysis')
      .insert([analysisRecord]);
      
    if (error) {
      console.error('Failed to record import analysis:', error);
    } else {
      console.log('✅ Recorded import analysis');
    }
  } catch (error) {
    console.error('Error recording import analysis:', error);
  }
}

function convertRecordToDatabase(record, globalIndex) {
  // Generate a unique ID if the property ID is missing or empty
  const baseId = record.PROPERTY_ID || record.id || '';
  
  // Use a more robust ID generation strategy
  let uniqueId;
  if (baseId && baseId.trim() !== '') {
    uniqueId = baseId.trim();
  } else {
    // Generate a truly unique ID using global counter and timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    uniqueId = `generated_${timestamp}_${globalIndex}_${randomSuffix}`;
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
    const duplicateCount = records.length - deduplicatedRecords.length;
    console.log(`   🔧 Deduplicated batch: ${records.length} -> ${deduplicatedRecords.length} records (${duplicateCount} duplicates)`);
    
    // Record duplicate records for analysis
    const duplicates = records.filter(record => 
      !deduplicatedRecords.some(dedup => dedup.id === record.id)
    );
    
    for (const duplicate of duplicates) {
      await recordDiscardedRecord(duplicate, 'duplicate_id', importId, 'Duplicate ID within batch');
    }
  }
  
  // Use upsert to handle conflicts gracefully
  const { data, error } = await supabase
    .from('unclaimed_properties')
    .upsert(deduplicatedRecords, { 
      onConflict: 'id'
    });
    
  if (error) {
    console.error('Batch insert error:', error);
    
    // Record failed records for analysis
    for (const record of deduplicatedRecords) {
      await recordDiscardedRecord(record, 'insertion_error', importId, error.message);
    }
    
    throw error;
  }
  
  // Return the actual number of records processed
  return deduplicatedRecords.length;
}

// Stream-based CSV processing to avoid memory issues
async function processCSVStream(csvContent, fileName, importId) {
  return new Promise((resolve, reject) => {
    const headers = [];
    let isFirstRow = true;
    let rowNumber = 0;
    let discardedCount = 0;
    let successfulRecords = 0;
    let failedRecords = 0;
    let currentBatch = [];
    
    console.log(`📄 Processing CSV file: ${fileName}`);
    
    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      columns: false,
      skip_empty_lines: true
    });
    
    parser.on('data', async (row) => {
      rowNumber++;
      
      if (isFirstRow) {
        headers.push(...row);
        console.log(`   📋 Headers: ${headers.slice(0, 5).join(', ')}... (${headers.length} total)`);
        isFirstRow = false;
      } else {
        try {
          // Convert row array to object using headers
          const record = {};
          headers.forEach((header, index) => {
            record[header] = row[index] || '';
          });
          
          // Validate record has minimum required data
          if (!record.OWNER_NAME || record.OWNER_NAME.trim() === '') {
            await recordDiscardedRecord(record, 'missing_required_fields', importId, 'Missing owner name', fileName, rowNumber);
            discardedCount++;
            return;
          }
          
          // Check for malformed data
          if (Object.keys(record).length < 5) {
            await recordDiscardedRecord(record, 'malformed_data', importId, 'Record has too few fields', fileName, rowNumber);
            discardedCount++;
            return;
          }
          
          // Convert to database format
          const globalIndex = globalRecordCounter++;
          const dbRecord = convertRecordToDatabase(record, globalIndex);
          currentBatch.push(dbRecord);
          
          // Process batch when it reaches the size limit
          if (currentBatch.length >= BATCH_SIZE) {
            try {
              const insertedCount = await insertBatch(currentBatch, importId);
              successfulRecords += insertedCount;
              failedRecords += (currentBatch.length - insertedCount);
              
              // Log progress every 1000 records
              if (successfulRecords % 1000 === 0) {
                console.log(`   ✅ Processed ${successfulRecords.toLocaleString()} records so far...`);
              }
              
              // Update progress
              await updateImportRecord(importId, {
                successful_records: successfulRecords,
                failed_records: failedRecords
              });
              
            } catch (error) {
              console.error(`❌ Batch processing error:`, error.message);
              failedRecords += currentBatch.length;
            }
            
            // Clear the batch
            currentBatch = [];
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
          await recordDiscardedRecord({ raw_row: row }, 'parse_error', importId, errorMessage, fileName, rowNumber);
          discardedCount++;
        }
      }
    });
    
    parser.on('end', async () => {
      // Process any remaining records in the final batch
      if (currentBatch.length > 0) {
        try {
          const insertedCount = await insertBatch(currentBatch, importId);
          successfulRecords += insertedCount;
          failedRecords += (currentBatch.length - insertedCount);
        } catch (error) {
          console.error(`❌ Final batch processing error:`, error.message);
          failedRecords += currentBatch.length;
        }
      }
      
      console.log(`✅ Completed processing: ${successfulRecords.toLocaleString()} successful, ${failedRecords} failed, ${discardedCount} discarded`);
      resolve({ successfulRecords, failedRecords, discardedCount });
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    parser.write(csvContent);
    parser.end();
  });
}

async function analyzeDataLoss(csvFiles) {
  console.log('\n🔍 Analyzing data for potential loss...');
  
  let totalRecords = 0;
  let recordsWithIds = 0;
  let recordsWithoutIds = 0;
  const sampleRecords = [];
  
  for (const csvFile of csvFiles) {
    console.log(`📊 Analyzing ${csvFile.name}...`);
    
    // Use a simple count for analysis (don't track discarded records here)
    const recordCount = await countCSVRecords(csvFile.content);
    totalRecords += recordCount;
    
    // Parse a sample to check for IDs (use 0 as placeholder for analysis)
    const { records } = await parseCSVFile(csvFile.content, csvFile.name, 0);
    
    for (const record of records) {
      const propertyId = record.PROPERTY_ID || record.id || '';
      if (propertyId && propertyId.trim() !== '') {
        recordsWithIds++;
      } else {
        recordsWithoutIds++;
        // Collect sample records without IDs for analysis
        if (sampleRecords.length < 10) {
          sampleRecords.push({
            file: csvFile.name,
            owner_name: record.OWNER_NAME || 'N/A',
            current_cash_balance: record.CURRENT_CASH_BALANCE || 'N/A',
            holder_name: record.HOLDER_NAME || 'N/A',
            property_type: record.PROPERTY_TYPE || 'N/A'
          });
        }
      }
    }
  }
  
  console.log(`📊 Analysis Results:`);
  console.log(`   Total records: ${totalRecords.toLocaleString()}`);
  console.log(`   Records with IDs: ${recordsWithIds.toLocaleString()} (${((recordsWithIds / totalRecords) * 100).toFixed(2)}%)`);
  console.log(`   Records without IDs: ${recordsWithoutIds.toLocaleString()} (${((recordsWithoutIds / totalRecords) * 100).toFixed(2)}%)`);
  
  if (sampleRecords.length > 0) {
    console.log(`\n📋 Sample records without IDs:`);
    sampleRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. File: ${record.file}`);
      console.log(`      Owner: ${record.owner_name}`);
      console.log(`      Amount: ${record.current_cash_balance}`);
      console.log(`      Holder: ${record.holder_name}`);
      console.log(`      Type: ${record.property_type}`);
      console.log('');
    });
  }
  
  return { totalRecords, recordsWithIds, recordsWithoutIds, sampleRecords };
}

// Legacy function for analysis only
async function parseCSVFile(csvContent, fileName, importId) {
  return new Promise((resolve, reject) => {
    const records = [];
    const headers = [];
    let isFirstRow = true;
    let debugCount = 0;
    let rowNumber = 0;
    let discardedCount = 0;
    
    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      columns: false,
      skip_empty_lines: true
    });
    
    parser.on('data', async (row) => {
      rowNumber++;
      
      if (isFirstRow) {
        headers.push(...row);
        isFirstRow = false;
      } else {
        try {
          // Convert row array to object using headers
          const record = {};
          headers.forEach((header, index) => {
            record[header] = row[index] || '';
          });
          
          // Validate record has minimum required data
          if (!record.OWNER_NAME || record.OWNER_NAME.trim() === '') {
            discardedCount++;
            return;
          }
          
          // Check for malformed data
          if (Object.keys(record).length < 5) {
            discardedCount++;
            return;
          }
          
          records.push(record);
          
          // Debug first few records
          if (debugCount < 3) {
            console.log(`   🔍 Sample record ${debugCount + 1}: ID=${record.PROPERTY_ID || 'N/A'}, Owner=${record.OWNER_NAME || 'N/A'}, Amount=${record.CURRENT_CASH_BALANCE || 'N/A'}`);
            debugCount++;
          }
        } catch (error) {
          discardedCount++;
        }
      }
    });
    
    parser.on('end', () => {
      console.log(`✅ Parsed ${records.length.toLocaleString()} records, discarded ${discardedCount} records`);
      resolve({ records, discardedCount });
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
    
    parser.write(csvContent);
    parser.end();
  });
}

async function main() {
  try {
    console.log('🚀 Starting California Unclaimed Property Data Import (Local Supabase)');
    console.log('Source:', LOCAL_ZIP_PATH);
    
    // Reset global counter for this import
    globalRecordCounter = 0;
    
    // Step 1: Extract and find CSV files from local ZIP
    const csvFiles = findCSVFilesInZip(LOCAL_ZIP_PATH);
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found to process.');
    }
    
    // Step 2: Analyze data for potential loss
    const analysis = await analyzeDataLoss(csvFiles);
    const totalRecords = analysis.totalRecords;
    
    console.log(`📊 Total records to process: ${totalRecords.toLocaleString()}`);
    
    // Step 3: Create import tracking record
    const importId = await createImportRecord(totalRecords);
    console.log(`📝 Created import record with ID: ${importId}`);
    
    // Record the analysis
    await recordImportAnalysis(importId, analysis);
    
    // Step 4: Clear existing data and analysis tables
    console.log('🗑️ Clearing existing data via TRUNCATE...');
    const { error: truncateError } = await supabase.rpc('truncate_unclaimed_properties');
      
    if (truncateError) {
      console.warn('Warning: Could not clear existing data:', truncateError.message);
    }
    
    // Clear analysis tables
    await clearAnalysisTables();
    
    // Step 5: Process each CSV file using streaming
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalDiscarded = 0;
    
    for (let i = 0; i < csvFiles.length; i++) {
      const csvFile = csvFiles[i];
      console.log(`\n🔄 Processing file ${i + 1}/${csvFiles.length}: ${csvFile.name}`);
      
      const { successfulRecords, failedRecords, discardedCount } = await processCSVStream(csvFile.content, csvFile.name, importId);
      totalSuccessful += successfulRecords;
      totalFailed += failedRecords;
      totalDiscarded += discardedCount;
      
      // Update progress after each file
      await updateImportRecord(importId, {
        successful_records: totalSuccessful,
        failed_records: totalFailed
      });
      
      console.log(`✅ File ${i + 1} completed: ${successfulRecords.toLocaleString()} successful, ${failedRecords} failed, ${discardedCount} discarded`);
    }
    
    // Step 6: Update final import status
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
    console.log(`   Discarded: ${totalDiscarded.toLocaleString()}`);
    console.log(`   Success rate: ${((totalSuccessful / totalRecords) * 100).toFixed(2)}%`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Import failed:', errorMessage);
    process.exit(1);
  }
}

// Run the import
main().catch(console.error); 