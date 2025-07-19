# Data Import Netlify Function

This Netlify function handles the import of California unclaimed property data from the official state controller's office.

## Overview

The function downloads the latest data from California State Controller's Office (https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip), processes the CSV files, and imports the data into the Supabase database.

## API Endpoints

### POST `/api/import-data`

Handles data import operations with different actions.

#### Request Body

```json
{
  "action": "start" | "status" | "cancel",
  "importId": "string" // Required for status and cancel actions
}
```

#### Actions

1. **start** - Initiates a new data import
2. **status** - Gets the status of an existing import
3. **cancel** - Cancels an ongoing import

#### Response Format

```json
{
  "success": boolean,
  "message": "string",
  "importId": "string", // Present for start and status actions
  "status": "in_progress" | "completed" | "completed_with_errors" | "failed" | "cancelled",
  "progress": {
    "total": number,
    "successful": number,
    "failed": number
  }
}
```

## Usage Examples

### Start an Import

```bash
curl -X POST https://your-site.netlify.app/api/import-data \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

### Check Import Status

```bash
curl -X POST https://your-site.netlify.app/api/import-data \
  -H "Content-Type: application/json" \
  -d '{"action": "status", "importId": "your-import-id"}'
```

### Cancel an Import

```bash
curl -X POST https://your-site.netlify.app/api/import-data \
  -H "Content-Type: application/json" \
  -d '{"action": "cancel", "importId": "your-import-id"}'
```

## Environment Variables

The function requires the following environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

## Database Schema

The function expects the following tables to exist:

### `data_imports` table
```sql
CREATE TABLE data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  total_records INTEGER NOT NULL,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  import_status TEXT DEFAULT 'in_progress',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `unclaimed_properties` table
```sql
CREATE TABLE unclaimed_properties (
  id TEXT PRIMARY KEY,
  property_type TEXT,
  cash_reported DECIMAL,
  shares_reported DECIMAL,
  name_of_securities_reported TEXT,
  number_of_owners TEXT,
  owner_name TEXT,
  owner_street_1 TEXT,
  owner_street_2 TEXT,
  owner_street_3 TEXT,
  owner_city TEXT,
  owner_state TEXT,
  owner_zip TEXT,
  owner_country_code TEXT,
  current_cash_balance DECIMAL,
  number_of_pending_claims INTEGER,
  number_of_paid_claims INTEGER,
  holder_name TEXT,
  holder_street_1 TEXT,
  holder_street_2 TEXT,
  holder_street_3 TEXT,
  holder_city TEXT,
  holder_state TEXT,
  holder_zip TEXT,
  cusip TEXT
);
```

### `truncate_unclaimed_properties` function
```sql
CREATE OR REPLACE FUNCTION truncate_unclaimed_properties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE unclaimed_properties;
END;
$$;
```

### Analysis Tables

#### `discarded_records` table
Tracks all records that were discarded during the import process for analysis.

```sql
CREATE TABLE discarded_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_data JSONB NOT NULL,
  discard_reason TEXT NOT NULL CHECK (discard_reason IN ('parse_error', 'validation_error', 'insertion_error', 'duplicate_id', 'missing_required_fields', 'malformed_data')),
  error_message TEXT,
  file_name TEXT,
  row_number INTEGER,
  import_id UUID NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `import_analysis` table
Stores analysis results for each import including ID statistics.

```sql
CREATE TABLE import_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  total_records INTEGER NOT NULL,
  records_with_ids INTEGER NOT NULL,
  records_without_ids INTEGER NOT NULL,
  percentage_with_ids TEXT NOT NULL,
  percentage_without_ids TEXT NOT NULL,
  sample_records JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Analysis Functions

#### `get_import_analysis_summary(import_uuid UUID)`
Returns comprehensive summary of import results including discard breakdown.

#### `get_discarded_records(import_uuid UUID, reason_filter TEXT DEFAULT NULL)`
Returns detailed view of discarded records with key fields extracted.

## Process Flow

1. **Download**: Downloads the ZIP file from California State Controller's Office
2. **Extract**: Extracts CSV files from the ZIP in memory
3. **Analyze**: Analyzes data for potential loss and records statistics
4. **Create Record**: Creates an import tracking record in the database
5. **Clear Data**: Truncates existing unclaimed properties and analysis data
6. **Process**: Processes each CSV file in batches of 250 records
7. **Track Discards**: Records all discarded records for analysis
8. **Update Progress**: Updates import progress after each batch
9. **Complete**: Marks import as completed with final statistics

## Error Handling

- Network errors during download are retried with redirect handling
- Database errors are logged and tracked in the import record
- Individual batch failures don't stop the entire import
- Progress is saved after each batch to allow for resumption
- **All discarded records are tracked** in the `discarded_records` table for analysis
- **Detailed error messages** are stored with each discarded record
- **File and row information** is preserved for debugging

## Performance Considerations

- Processes records in batches of 250 to avoid memory issues
- Uses streaming CSV parsing to handle large files
- Downloads and processes files in memory (no temporary file storage)
- Updates progress frequently to allow monitoring

## Monitoring

Check the Netlify function logs to monitor the import process:

```bash
netlify functions:logs import-data
```

## Migration from Script

This function replaces the standalone `scripts/import-data.js` script. The main differences are:

1. **Serverless**: Runs on Netlify's infrastructure instead of locally
2. **Memory-based**: Processes files in memory instead of using temporary files
3. **API-based**: Provides REST API endpoints for control and monitoring
4. **Progress tracking**: Real-time progress updates via database
5. **Error resilience**: Better error handling and recovery
6. **Data loss tracking**: All discarded records are preserved for analysis
7. **Comprehensive analysis**: Detailed breakdown of why records were discarded

## Security

- Uses Supabase service role key for database operations
- Validates all input parameters
- Sanitizes CSV data before database insertion
- Implements proper error handling to prevent information leakage 