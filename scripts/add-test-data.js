#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zunezecqnsoileitnifl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bmV6ZWNxbnNvaWxlaXRuaWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxOTkyMywiZXhwIjoyMDY3NDk1OTIzfQ.-MZyNeCHc_jcsBSUYxzxuUzqMNBuYDM1r8VLBAbT81w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const testData = [
  {
    id: 'TEST001',
    property_type: 'BANK',
    cash_reported: 1500.00,
    shares_reported: 0,
    name_of_securities_reported: null,
    number_of_owners: '1',
    owner_name: 'John Smith',
    owner_street_1: '123 Main St',
    owner_street_2: null,
    owner_street_3: null,
    owner_city: 'Los Angeles',
    owner_state: 'CA',
    owner_zip: '90210',
    owner_country_code: 'US',
    current_cash_balance: 1500.00,
    number_of_pending_claims: 0,
    number_of_paid_claims: 0,
    holder_name: 'Bank of America',
    holder_street_1: '100 N Tryon St',
    holder_street_2: null,
    holder_street_3: null,
    holder_city: 'Charlotte',
    holder_state: 'NC',
    holder_zip: '28255',
    cusip: null
  },
  {
    id: 'TEST002',
    property_type: 'INSURANCE',
    cash_reported: 2500.00,
    shares_reported: 0,
    name_of_securities_reported: null,
    number_of_owners: '1',
    owner_name: 'Jane Doe',
    owner_street_1: '456 Oak Avenue',
    owner_street_2: 'Apt 2B',
    owner_street_3: null,
    owner_city: 'San Francisco',
    owner_state: 'CA',
    owner_zip: '94102',
    owner_country_code: 'US',
    current_cash_balance: 2500.00,
    number_of_pending_claims: 0,
    number_of_paid_claims: 0,
    holder_name: 'State Farm Insurance',
    holder_street_1: '1 State Farm Plaza',
    holder_street_2: null,
    holder_street_3: null,
    holder_city: 'Bloomington',
    holder_state: 'IL',
    holder_zip: '61710',
    cusip: null
  },
  {
    id: 'TEST003',
    property_type: 'UTILITY',
    cash_reported: 750.00,
    shares_reported: 0,
    name_of_securities_reported: null,
    number_of_owners: '1',
    owner_name: 'Michael Johnson',
    owner_street_1: '789 Pine Street',
    owner_street_2: null,
    owner_street_3: null,
    owner_city: 'Sacramento',
    owner_state: 'CA',
    owner_zip: '95814',
    owner_country_code: 'US',
    current_cash_balance: 750.00,
    number_of_pending_claims: 0,
    number_of_paid_claims: 0,
    holder_name: 'Pacific Gas & Electric',
    holder_street_1: '77 Beale St',
    holder_street_2: null,
    holder_street_3: null,
    holder_city: 'San Francisco',
    holder_state: 'CA',
    holder_zip: '94105',
    cusip: null
  },
  {
    id: 'TEST004',
    property_type: 'WAGES',
    cash_reported: 3200.00,
    shares_reported: 0,
    name_of_securities_reported: null,
    number_of_owners: '1',
    owner_name: 'Sarah Williams',
    owner_street_1: '321 Elm Drive',
    owner_street_2: null,
    owner_street_3: null,
    owner_city: 'San Diego',
    owner_state: 'CA',
    owner_zip: '92101',
    owner_country_code: 'US',
    current_cash_balance: 3200.00,
    number_of_pending_claims: 0,
    number_of_paid_claims: 0,
    holder_name: 'Tech Corp Inc',
    holder_street_1: '100 Technology Way',
    holder_street_2: null,
    holder_street_3: null,
    holder_city: 'San Jose',
    holder_state: 'CA',
    holder_zip: '95110',
    cusip: null
  },
  {
    id: 'TEST005',
    property_type: 'BANK',
    cash_reported: 8500.00,
    shares_reported: 0,
    name_of_securities_reported: null,
    number_of_owners: '1',
    owner_name: 'Robert Brown',
    owner_street_1: '654 Sunset Blvd',
    owner_street_2: null,
    owner_street_3: null,
    owner_city: 'Hollywood',
    owner_state: 'CA',
    owner_zip: '90028',
    owner_country_code: 'US',
    current_cash_balance: 8500.00,
    number_of_pending_claims: 0,
    number_of_paid_claims: 0,
    holder_name: 'Wells Fargo Bank',
    holder_street_1: '420 Montgomery St',
    holder_street_2: null,
    holder_street_3: null,
    holder_city: 'San Francisco',
    holder_state: 'CA',
    holder_zip: '94104',
    cusip: null
  }
];

async function addTestData() {
  console.log('🧪 Adding test data to verify search functionality...');
  
  try {
    // Clear any existing test data
    const { error: deleteError } = await supabase
      .from('unclaimed_properties')
      .delete()
      .like('id', 'TEST%');
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('Warning clearing test data:', deleteError.message);
    }

    // Insert test data
    const { data, error } = await supabase
      .from('unclaimed_properties')
      .insert(testData);

    if (error) {
      throw new Error(`Failed to insert test data: ${error.message}`);
    }

    console.log(`✅ Successfully added ${testData.length} test records`);
    
    // Test the search function
    console.log('\n🔍 Testing search function...');
    
    const { data: searchResults, error: searchError } = await supabase.rpc('search_properties', {
      search_name: 'John Smith',
      search_limit: 10
    });

    if (searchError) {
      throw new Error(`Search test failed: ${searchError.message}`);
    }

    console.log(`✅ Search test passed! Found ${searchResults?.length || 0} results for "John Smith"`);
    
    if (searchResults && searchResults.length > 0) {
      console.log('   Sample result:');
      console.log(`   - Name: ${searchResults[0].owner_name}`);
      console.log(`   - Amount: $${searchResults[0].current_cash_balance}`);
      console.log(`   - City: ${searchResults[0].owner_city}`);
      console.log(`   - Similarity: ${searchResults[0].similarity_score}`);
    }

    console.log('\n🎉 Test data setup complete! You can now test the search functionality.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTestData(); 