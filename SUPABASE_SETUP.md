# Supabase Setup Instructions

Your Supabase project has been created and configured! Here's what you need to do to complete the setup:

## 1. Get Your Supabase API Keys

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zunezecqnsoileitnifl/settings/api
2. Copy the following values:
   - **Project URL**: `https://zunezecqnsoileitnifl.supabase.co`
   - **Anon public key**: starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role key**: starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (needed for data import)

## 2. Set Up Environment Variables

Create a `.env` file in your project root with the following content:

```env
VITE_SUPABASE_URL=https://zunezecqnsoileitnifl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# For data import script only
SUPABASE_URL=https://zunezecqnsoileitnifl.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 3. Database Schema

The database schema has already been created with the following features:

- **Main table**: `unclaimed_properties` - stores all California unclaimed property data
- **Search indexes**: Optimized for fast name and location searches
- **Full-text search**: Using PostgreSQL's built-in search capabilities
- **Fuzzy matching**: Uses pg_trgm extension for approximate string matching
- **Import tracking**: `data_imports` table tracks data import history

## 4. Import Real Data

To import the real California unclaimed property data:

```bash
# Make sure your environment variables are set first
node scripts/import-data.js
```

This script will:
- Download the latest data from California State Controller's Office (~900MB ZIP file)
- Extract and parse the CSV files
- Import all records into your Supabase database
- Provide progress updates and import tracking

⚠️ **Important**: The import will take several minutes and will temporarily use significant disk space.

## 5. Test the Application

Once the data is imported, start your development server:

```bash
npm run dev
```

You should now be able to search through real California unclaimed property data!

## 6. Features Available

With Supabase integration, your app now supports:

- **Fast fuzzy search**: Finds names even with typos or variations
- **Advanced filtering**: By amount, city, property type
- **Scalable database**: Can handle millions of records efficiently
- **Real-time updates**: If you decide to add live data updates later
- **Cart functionality**: Users can save properties to check multiple claims

## 7. Performance Notes

- The search function uses PostgreSQL's full-text search and trigram matching
- Results are limited to 50 records by default for performance
- Database indexes ensure fast queries even with large datasets
- The search function includes similarity scoring to rank results

## 8. Data Update Process

To update the data periodically:

1. Run the import script again: `node scripts/import-data.js`
2. The script will clear existing data and import fresh data
3. Check the `data_imports` table in Supabase dashboard to monitor import status

## 9. Troubleshooting

- **Environment variables not found**: Make sure your `.env` file is in the project root
- **Import script fails**: Check that you have the correct service role key
- **Search not working**: Verify the anon public key is correct
- **Performance issues**: Check the database indexes in Supabase dashboard

## Next Steps

Your California unclaimed property search application is now ready! The app can handle real data from the state and provides a professional-grade search experience.

Consider adding:
- Email notifications for saved searches
- PDF generation for claim forms
- Analytics tracking
- Automated data updates via scheduled functions 