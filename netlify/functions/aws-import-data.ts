import type { Handler, HandlerEvent } from "@netlify/functions";
import { Pool } from 'pg';
import * as https from 'https';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse';

// Configuration
const DATA_URL = 'https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip';
const BATCH_SIZE = 250; // Process records in smaller batches to avoid conflicts

// AWS PostgreSQL configuration
const AWS_DB_CONFIG = {
  host: process.env.AWS_DB_HOST || "moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com",
  port: parseInt(process.env.AWS_DB_PORT || "5432"),
  database: process.env.AWS_DB_NAME || "postgres",
  user: process.env.AWS_DB_USER || "postgres",
  password: process.env.AWS_DB_PASSWORD || "Latimer1!",
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize PostgreSQL client pool
const pool = new Pool(AWS_DB_CONFIG);

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
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO data_imports (source_url, total_records, import_status, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [DATA_URL, totalRecords, 'in_progress']
    );
    
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function updateImportStatus(importId: number, status: string, successful: number = 0, failed: number = 0, errorMessage?: string) {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE data_imports 
       SET import_status = $1, successful_records = $2, failed_records = $3, error_message = $4, updated_at = NOW() 
       WHERE id = $5`,
      [status, successful, failed, errorMessage, importId]
    );
  } finally {
    client.release();
  }
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
    console.log('🔍 Creating indexes...');
    await client.query(`
      CREATE INDEX idx_unclaimed_properties_owner_name ON unclaimed_properties USING gin(to_tsvector('english', owner_name));
      CREATE INDEX idx_unclaimed_properties_holder_name ON unclaimed_properties USING gin(to_tsvector('english', holder_name));
      CREATE INDEX idx_unclaimed_properties_property_type ON unclaimed_properties(property_type);
      CREATE INDEX idx_unclaimed_properties_current_cash_balance ON unclaimed_properties(current_cash_balance);
      CREATE INDEX idx_unclaimed_properties_owner_city ON unclaimed_properties(owner_city);
    `);

    console.log('✅ Tables and indexes created successfully');
  } finally {
    client.release();
  }
}

function convertRecordToDatabase(record: any, index: number) {
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

async function insertBatch(records: any[], importId: number) {
  const client = await pool.connect();
  try {
    const values = records.map((record, index) => {
      const offset = index * 25; // 25 fields per record
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19}, $${offset + 20}, $${offset + 21}, $${offset + 22}, $${offset + 23}, $${offset + 24}, $${offset + 25})`;
    }).join(', ');

    const query = `
      INSERT INTO unclaimed_properties (
        id, property_type, cash_reported, shares_reported, name_of_securities_reported,
        number_of_owners, owner_name, owner_street_1, owner_street_2, owner_street_3,
        owner_city, owner_state, owner_zip, owner_country_code, current_cash_balance,
        number_of_pending_claims, number_of_paid_claims, holder_name, holder_street_1,
        holder_street_2, holder_street_3, holder_city, holder_state, holder_zip, cusip
      ) VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `;

    const params = records.flatMap(record => [
      record.id, record.property_type, record.cash_reported, record.shares_reported, record.name_of_securities_reported,
      record.number_of_owners, record.owner_name, record.owner_street_1, record.owner_street_2, record.owner_street_3,
      record.owner_city, record.owner_state, record.owner_zip, record.owner_country_code, record.current_cash_balance,
      record.number_of_pending_claims, record.number_of_paid_claims, record.holder_name, record.holder_street_1,
      record.holder_street_2, record.holder_street_3, record.holder_city, record.holder_state, record.holder_zip, record.cusip
    ]);

    await client.query(query, params);
  } finally {
    client.release();
  }
}

async function parseCSVFile(csvContent: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    
    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    .on('data', (record) => {
      records.push(record);
    })
    .on('end', () => {
      console.log(`📊 Parsed ${records.length} records from CSV`);
      resolve(records);
    })
    .on('error', (error) => {
      reject(error);
    });
  });
}

async function startImport(): Promise<ImportResponse> {
  try {
    console.log('🚀 Starting AWS database import...');
    
    // Step 1: Create tables
    await createTables();
    
    // Step 2: Download and extract data
    console.log('📥 Downloading data...');
    const zipBuffer = await downloadFile(DATA_URL);
    const csvFiles = findCSVFilesInZip(zipBuffer);
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found in ZIP');
    }
    
    // Step 3: Parse all CSV files
    let allRecords: any[] = [];
    for (const csvFile of csvFiles) {
      console.log(`📄 Processing ${csvFile.name}...`);
      const records = await parseCSVFile(csvFile.content);
      allRecords = allRecords.concat(records);
    }
    
    console.log(`📊 Total records to process: ${allRecords.length}`);
    
    // Step 4: Create import record
    const importId = await createImportRecord(allRecords.length);
    
    // Step 5: Process records in batches
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE);
      const convertedBatch = batch.map((record, index) => convertRecordToDatabase(record, i + index));
      
      try {
        await insertBatch(convertedBatch, importId);
        successful += batch.length;
        console.log(`✅ Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allRecords.length / BATCH_SIZE)} (${successful}/${allRecords.length})`);
      } catch (error) {
        failed += batch.length;
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
      }
      
      // Update progress
      await updateImportStatus(importId, 'in_progress', successful, failed);
    }
    
    // Step 6: Finalize import
    await updateImportStatus(importId, 'completed', successful, failed);
    
    console.log(`✅ Import completed: ${successful} successful, ${failed} failed`);
    
    return {
      success: true,
      message: `Import completed successfully. ${successful} records imported, ${failed} failed.`,
      importId,
      status: 'completed',
      progress: {
        total: allRecords.length,
        successful,
        failed
      }
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'failed'
    };
  }
}

async function getImportStatus(importId: number): Promise<ImportResponse> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM data_imports WHERE id = $1',
        [importId]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Import not found'
        };
      }
      
      const importRecord = result.rows[0];
      
      return {
        success: true,
        message: `Import status: ${importRecord.import_status}`,
        importId,
        status: importRecord.import_status,
        progress: {
          total: importRecord.total_records,
          successful: importRecord.successful_records,
          failed: importRecord.failed_records
        }
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return {
      success: false,
      message: `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, importId } = body as ImportRequest;

    let response: ImportResponse;

    switch (action) {
      case 'start':
        response = await startImport();
        break;
      case 'status':
        if (!importId) {
          response = {
            success: false,
            message: 'Import ID is required for status check'
          };
        } else {
          response = await getImportStatus(importId);
        }
        break;
      default:
        response = {
          success: false,
          message: 'Invalid action. Use "start" or "status"'
        };
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: `Function error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    };
  }
};

