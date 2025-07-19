import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse';

// Configuration
const DATA_URL = 'https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip';
const BATCH_SIZE = 250; // Process records in smaller batches to avoid conflicts

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zunezecqnsoileitnifl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bmV6ZWNxbnNvaWxlaXRuaWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxOTkyMywiZXhwIjoyMDY3NDk1OTIzfQ.-MZyNeCHc_jcsBSUYxzxuUzqMNBuYDM1r8VLBAbT81w';

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ImportRequest {
  action: 'start' | 'status' | 'cancel';
  importId?: number;
}

interface ImportResponse {
  success: boolean;
  message: string;
  importId?: number;
  status?: string;
  progress?: {
    total: number;
    successful: number;
    failed: number;
  };
}

async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
          resolve(buffer);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`↗️ Redirecting to ${redirectUrl}`);
          downloadFile(redirectUrl).then(resolve).catch(reject);
        } else {
          reject(new Error('Redirect URL not found'));
        }
      } else {
        reject(new Error(`Download failed with status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function findCSVFilesInZip(zipBuffer: Buffer): { name: string; content: Buffer }[] {
  console.log(`📦 Extracting ZIP file...`);
  
  const zip = new (AdmZip as any)(zipBuffer);
  const csvFiles: { name: string; content: Buffer }[] = [];
  
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

async function createImportRecord(totalRecords: number): Promise<number> {
  const { data, error } = await supabase
    .from('data_imports')
    .insert([{
      source_url: DATA_URL,
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

async function updateImportRecord(importId: number, updates: any): Promise<void> {
  const { error } = await supabase
    .from('data_imports')
    .update(updates)
    .eq('id', importId);
    
  if (error) {
    console.error('Failed to update import record:', error);
  }
}

async function countCSVRecords(csvContent: Buffer): Promise<number> {
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

async function parseCSVFile(csvContent: Buffer, fileName: string, importId: number): Promise<{ records: any[]; discardedCount: number }> {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    const headers: string[] = [];
    let isFirstRow = true;
    let debugCount = 0;
    let rowNumber = 0;
    let discardedCount = 0;
    
    console.log(`📄 Parsing CSV file: ${fileName}`);
    
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
          const record: any = {};
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
          
          records.push(record);
          
          // Debug first few records
          if (debugCount < 3) {
            console.log(`   🔍 Sample record ${debugCount + 1}: ID=${record.PROPERTY_ID || 'N/A'}, Owner=${record.OWNER_NAME || 'N/A'}, Amount=${record.CURRENT_CASH_BALANCE || 'N/A'}`);
            debugCount++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
          await recordDiscardedRecord({ raw_row: row }, 'parse_error', importId, errorMessage, fileName, rowNumber);
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

// Add global counter for unique ID generation
let globalRecordCounter = 0;

// Track discarded records for analysis
interface DiscardedRecord {
  id: string;
  original_data: any;
  discard_reason: 'parse_error' | 'validation_error' | 'insertion_error' | 'duplicate_id' | 'missing_required_fields' | 'malformed_data';
  error_message?: string;
  file_name?: string;
  row_number?: number;
  import_id: number;
  created_at: string;
}

async function clearAnalysisTables(): Promise<void> {
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

async function recordDiscardedRecord(
  record: any, 
  reason: DiscardedRecord['discard_reason'], 
  importId: number, 
  errorMessage?: string,
  fileName?: string,
  rowNumber?: number
): Promise<void> {
  try {
    const discardedRecord: Omit<DiscardedRecord, 'id' | 'created_at'> = {
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

async function recordImportAnalysis(
  importId: number,
  analysis: { totalRecords: number; recordsWithIds: number; recordsWithoutIds: number; sampleRecords: any[] }
): Promise<void> {
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

function convertRecordToDatabase(record: any, globalIndex: number): any {
  // Generate a unique ID if the property ID is missing or empty
  const baseId = record.PROPERTY_ID || record.id || '';
  
  // Use a more robust ID generation strategy
  let uniqueId: string;
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

function deduplicateBatch(records: any[]): any[] {
  const seen = new Set();
  const deduplicated: any[] = [];
  
  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      deduplicated.push(record);
    }
  }
  
  return deduplicated;
}

async function insertBatch(records: any[], importId: number): Promise<number> {
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

async function processRecords(records: any[], importId: number): Promise<{ successfulRecords: number; failedRecords: number }> {
  console.log(`🔄 Processing ${records.length} total records...`);
  
  let successfulRecords = 0;
  let failedRecords = 0;
  
  // Process in batches with global counter
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const convertedBatch = batch.map((record, batchIndex) => {
      const globalIndex = globalRecordCounter++;
      return convertRecordToDatabase(record, globalIndex);
    });
    
    try {
      const insertedCount = await insertBatch(convertedBatch, importId);
      successfulRecords += insertedCount;
      
      console.log(`✅ Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)} (${insertedCount} records, global counter: ${globalRecordCounter})`);
      
      // Update progress
      await updateImportRecord(importId, {
        successful_records: successfulRecords
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errorMessage);
      failedRecords += batch.length;
      
      await updateImportRecord(importId, {
        failed_records: failedRecords
      });
    }
  }
  
  return { successfulRecords, failedRecords };
}

async function getImportStatus(importId: number): Promise<ImportResponse> {
  const { data, error } = await supabase
    .from('data_imports')
    .select('*')
    .eq('id', importId)
    .single();
    
  if (error) {
    return {
      success: false,
      message: `Failed to get import status: ${error.message}`
    };
  }
  
  return {
    success: true,
    message: 'Import status retrieved',
    importId: data.id,
    status: data.import_status,
    progress: {
      total: data.total_records || 0,
      successful: data.successful_records || 0,
      failed: data.failed_records || 0
    }
  };
}

async function startImport(): Promise<ImportResponse> {
  try {
    console.log('🚀 Starting California Unclaimed Property Data Import');
    console.log('Source:', DATA_URL);
    
    // Reset global counter for this import
    globalRecordCounter = 0;
    
    // Step 1: Download the ZIP file
    const zipBuffer = await downloadFile(DATA_URL);
    
    // Step 2: Extract and find CSV files
    const csvFiles = findCSVFilesInZip(zipBuffer);
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found to process.');
    }
    
    // Step 3: Analyze data for potential loss
    const analysis = await analyzeDataLoss(csvFiles);
    const totalRecords = analysis.totalRecords;
    
    console.log(`📊 Total records to process: ${totalRecords.toLocaleString()}`);
    
    // Step 4: Create import tracking record
    const importId = await createImportRecord(totalRecords);
    console.log(`📝 Created import record with ID: ${importId}`);
    
    // Record the analysis
    await recordImportAnalysis(importId, analysis);
    
    // Step 5: Clear existing data and analysis tables
    console.log('🗑️ Clearing existing data via TRUNCATE...');
    const { error: truncateError } = await supabase.rpc('truncate_unclaimed_properties');
      
    if (truncateError) {
      console.warn('Warning: Could not clear existing data:', truncateError.message);
    }
    
    // Clear analysis tables
    await clearAnalysisTables();
    
    // Step 6: Process each CSV file
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < csvFiles.length; i++) {
      const csvFile = csvFiles[i];
      console.log(`\n🔄 Processing file ${i + 1}/${csvFiles.length}: ${csvFile.name}`);
      
      const { records, discardedCount } = await parseCSVFile(csvFile.content, csvFile.name, importId);
      const { successfulRecords, failedRecords } = await processRecords(records, importId);
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
    
    return {
      success: true,
      message: 'Import completed successfully',
      importId: importId,
      status: totalFailed > 0 ? 'completed_with_errors' : 'completed',
      progress: {
        total: totalRecords,
        successful: totalSuccessful,
        failed: totalFailed
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Import failed:', errorMessage);
    
    return {
      success: false,
      message: `Import failed: ${errorMessage}`
    };
  }
}

async function analyzeDataLoss(csvFiles: { name: string; content: Buffer }[]): Promise<{ totalRecords: number; recordsWithIds: number; recordsWithoutIds: number; sampleRecords: any[] }> {
  console.log('\n🔍 Analyzing data for potential loss...');
  
  let totalRecords = 0;
  let recordsWithIds = 0;
  let recordsWithoutIds = 0;
  const sampleRecords: any[] = [];
  
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

const responseHeaders = {
	"Content-Type": "application/json"
};

const handler: Handler = async (event: HandlerEvent) => {
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { ...responseHeaders, 'Allow': 'POST' }
    };
  }

  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }
    
    const request: ImportRequest = JSON.parse(event.body);

    if (!request.action) {
      throw new Error("Missing 'action' in the request body.");
    }

    console.log(`[Function Start] Received ${request.action} request`);

    let response: ImportResponse;

    switch (request.action) {
      case 'start':
        response = await startImport();
        break;
        
      case 'status':
        if (!request.importId) {
          throw new Error("Missing 'importId' for status request.");
        }
        response = await getImportStatus(request.importId);
        break;
        
      case 'cancel':
        if (!request.importId) {
          throw new Error("Missing 'importId' for cancel request.");
        }
        await updateImportRecord(request.importId, {
          import_status: 'cancelled'
        });
        response = {
          success: true,
          message: 'Import cancelled successfully',
          importId: request.importId,
          status: 'cancelled'
        };
        break;
        
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: { "Content-Type": "application/json" },
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

export { handler }; 