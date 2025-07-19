# AWS PostgreSQL Data Import Script

This document explains how to use the `import-data-aws.js` script to import California unclaimed property data into an AWS RDS PostgreSQL database.

## Prerequisites

1. **AWS RDS PostgreSQL Instance**: You need a running PostgreSQL database on AWS RDS
2. **Node.js**: Version 16 or higher
3. **Dependencies**: Install the required packages with `npm install`

## Environment Variables

Set the following environment variables for AWS RDS connection:

```bash
# Required AWS RDS Configuration
export AWS_DB_HOST="your-rds-endpoint.region.rds.amazonaws.com"
export AWS_DB_PORT="5432"  # Default PostgreSQL port
export AWS_DB_NAME="your_database_name"
export AWS_DB_USER="your_database_username"
export AWS_DB_PASSWORD="your_database_password"
export AWS_DB_SSL="require"  # or "false" for local development

# Optional: AWS Credentials (if using IAM authentication)
# export AWS_ACCESS_KEY_ID="your-access-key"
# export AWS_SECRET_ACCESS_KEY="your-secret-key"
# export AWS_SESSION_TOKEN="your-session-token"  # Only for temporary credentials
```
```

## Usage

### Production (AWS RDS)
```bash
node scripts/import-data-aws.js
```

### Local Development
```bash
node scripts/import-data-aws.js --local
```

## What the Script Does

1. **Downloads Data**: Downloads the latest California unclaimed property data from the state controller's office
2. **Extracts CSV Files**: Extracts and processes CSV files from the downloaded ZIP
3. **Creates Database Tables**: Automatically creates the required tables if they don't exist:
   - `data_imports`: Tracks import progress and status
   - `unclaimed_properties`: Stores the actual property data
4. **Imports Data**: Processes records in batches and imports them into PostgreSQL
5. **Creates Indexes**: Sets up full-text search indexes for better performance
6. **Tracks Progress**: Monitors import progress and provides detailed logging

## Database Schema

### data_imports Table
```sql
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
```

### unclaimed_properties Table
```sql
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
```

## Performance Optimizations

The script includes several performance optimizations:

1. **Connection Pooling**: Uses PostgreSQL connection pooling for efficient database connections
2. **Batch Processing**: Processes records in batches of 250 to avoid memory issues
3. **Full-Text Search Indexes**: Creates GIN indexes for fast text search on owner and holder names
4. **Deduplication**: Removes duplicate records within batches
5. **Streaming CSV Parsing**: Uses streaming to handle large CSV files efficiently

## Monitoring and Logging

The script provides detailed logging including:
- Download progress
- File extraction status
- Record counting
- Batch processing progress
- Success/failure rates
- Final import summary

## Error Handling

- **Connection Failures**: Graceful handling of database connection issues
- **Data Validation**: Validates and cleans data before insertion
- **Duplicate Handling**: Uses `ON CONFLICT DO NOTHING` to handle duplicate records
- **Progress Tracking**: Saves progress to resume from failures

## Security Considerations

1. **SSL Connections**: Uses SSL for production database connections
2. **Environment Variables**: Database credentials are stored in environment variables
3. **Connection Pooling**: Limits the number of concurrent connections
4. **Parameterized Queries**: Uses parameterized queries to prevent SQL injection

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Increase `connectionTimeoutMillis` in the database config
2. **Memory Issues**: Reduce `BATCH_SIZE` if processing large datasets
3. **SSL Errors**: Set `AWS_DB_SSL=false` for local development
4. **Permission Errors**: Ensure the database user has CREATE TABLE and INSERT permissions

### Debug Mode

For additional debugging, you can modify the script to log more details:
- Set `debugCount` to a higher number to see more sample records
- Add more detailed error logging in the `insertBatch` function

## Data Source

The script downloads data from:
- **URL**: https://dpupd.sco.ca.gov/04_From_500_To_Beyond.zip
- **Source**: California State Controller's Office
- **Format**: ZIP file containing CSV files
- **Update Frequency**: Check the source website for update schedules

## Performance Expectations

- **Download**: ~50-100MB ZIP file
- **Processing**: ~100,000-500,000 records
- **Import Time**: 10-30 minutes depending on data size and database performance
- **Storage**: ~1-5GB depending on data size

## Next Steps

After successful import:
1. Verify data integrity with sample queries
2. Set up regular import schedules if needed
3. Configure backup strategies for the database
4. Monitor database performance and adjust indexes as needed 