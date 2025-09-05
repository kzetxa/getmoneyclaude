# AWS Database Setup Guide

This guide will help you switch your application from Supabase to AWS RDS PostgreSQL.

## Current AWS Database Configuration

Your AWS RDS PostgreSQL instance is already configured with these details:

- **Host**: `moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: `Latimer1!`

## Step 1: Set Environment Variables

Create a `.env` file in your project root with the following AWS database variables:

```env
# AWS Database Configuration
VITE_AWS_DB_HOST=moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com
VITE_AWS_DB_PORT=5432
VITE_AWS_DB_NAME=postgres
VITE_AWS_DB_USER=postgres
VITE_AWS_DB_PASSWORD=Latimer1!

# For Netlify Functions
AWS_DB_HOST=moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com
AWS_DB_PORT=5432
AWS_DB_NAME=postgres
AWS_DB_USER=postgres
AWS_DB_PASSWORD=Latimer1!
```

## Step 2: Set Netlify Environment Variables

In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

### Production Environment:
- `VITE_AWS_DB_HOST` = `moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com`
- `VITE_AWS_DB_PORT` = `5432`
- `VITE_AWS_DB_NAME` = `postgres`
- `VITE_AWS_DB_USER` = `postgres`
- `VITE_AWS_DB_PASSWORD` = `Latimer1!`
- `AWS_DB_HOST` = `moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com`
- `AWS_DB_PORT` = `5432`
- `AWS_DB_NAME` = `postgres`
- `AWS_DB_USER` = `postgres`
- `AWS_DB_PASSWORD` = `Latimer1!`

### Staging Environment:
- Same variables as production

## Step 3: Switch to AWS Database

### Option A: Complete Switch (Recommended)

1. **Update imports in your code**:
   ```typescript
   // Change from:
   import { PropertySearchService } from '../services/supabaseClient';
   
   // To:
   import { PropertySearchService } from '../services/awsClient';
   ```

2. **Use AWS import function**:
   ```typescript
   // Change from:
   fetch('/.netlify/functions/import-data', {
     method: 'POST',
     body: JSON.stringify({ action: 'start' })
   });
   
   // To:
   fetch('/.netlify/functions/aws-import-data', {
     method: 'POST',
     body: JSON.stringify({ action: 'start' })
   });
   ```

### Option B: Gradual Migration

You can keep both clients and switch gradually by updating the imports in specific files.

## Step 4: Import Data to AWS

### Using the AWS Import Script

```bash
# Import data to AWS RDS
node scripts/import-data-aws.js

# For local development (if you have local PostgreSQL)
node scripts/import-data-aws.js --local
```

### Using Netlify Function

```bash
# Start import
curl -X POST https://your-site.netlify.app/.netlify/functions/aws-import-data \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Check status (replace IMPORT_ID with the ID returned from start)
curl -X POST https://your-site.netlify.app/.netlify/functions/aws-import-data \
  -H "Content-Type: application/json" \
  -d '{"action": "status", "importId": IMPORT_ID}'
```

## Step 5: Test the Connection

1. **Start your development server**:
   ```bash
   pnpm dev
   ```

2. **Test the search functionality** - it should now connect to AWS instead of Supabase

3. **Check the browser console** for any connection errors

## Step 6: Deploy to Netlify

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Switch to AWS database"
   git push origin main
   ```

2. **Monitor the deployment** in your Netlify dashboard

3. **Test the production site** to ensure it's using AWS

## Database Schema

The AWS database will have the same schema as Supabase:

### Tables:
- `unclaimed_properties` - Main property data
- `data_imports` - Import tracking

### Indexes:
- Full-text search on owner and holder names
- Property type and amount indexes
- City search indexes

## Performance Considerations

### AWS RDS Advantages:
- **Scalability**: Can easily scale up/down based on usage
- **Backup**: Automated backups and point-in-time recovery
- **Monitoring**: CloudWatch integration for performance monitoring
- **Security**: VPC isolation and encryption at rest

### Connection Pooling:
- The AWS client uses connection pooling (max 20 connections)
- Connections are automatically managed and reused
- Idle connections are closed after 30 seconds

## Troubleshooting

### Common Issues:

1. **Connection Timeout**:
   - Check if the AWS RDS instance is running
   - Verify security group allows connections from your IP/Netlify
   - Ensure the database credentials are correct

2. **SSL Issues**:
   - The client is configured with `rejectUnauthorized: false`
   - For production, consider using proper SSL certificates

3. **Performance Issues**:
   - Monitor CloudWatch metrics
   - Consider adding more indexes if needed
   - Scale up the RDS instance if necessary

### Debug Commands:

```bash
# Test database connection
psql -h moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com -U postgres -d postgres

# Check table structure
\d unclaimed_properties

# Test search query
SELECT COUNT(*) FROM unclaimed_properties WHERE owner_name ILIKE '%test%';
```

## Security Best Practices

1. **Environment Variables**: Never commit database credentials to version control
2. **Network Security**: Use VPC and security groups to restrict access
3. **Encryption**: Enable encryption at rest and in transit
4. **IAM**: Consider using IAM database authentication instead of passwords
5. **Backup**: Enable automated backups and test restore procedures

## Cost Optimization

1. **Instance Size**: Start with smaller instances and scale up as needed
2. **Storage**: Monitor storage usage and optimize
3. **Backup Retention**: Adjust backup retention periods based on requirements
4. **Multi-AZ**: Only enable for production workloads

## Migration Checklist

- [ ] Set environment variables in `.env` file
- [ ] Set environment variables in Netlify dashboard
- [ ] Update imports to use `awsClient` instead of `supabaseClient`
- [ ] Test local development with AWS database
- [ ] Import data to AWS database
- [ ] Deploy to Netlify
- [ ] Test production deployment
- [ ] Monitor performance and errors
- [ ] Update any remaining Supabase references

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Netlify function logs
3. Test database connectivity directly
4. Verify environment variables are set correctly

