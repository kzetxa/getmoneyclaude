#!/usr/bin/env node

/**
 * Analyze Discarded Records Script
 * 
 * This script helps analyze records that were discarded during the import process.
 * It provides insights into why records were lost and helps identify data quality issues.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zunezecqnsoileitnifl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bmV6ZWNxbnNvaWxlaXRuaWZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxOTkyMywiZXhwIjoyMDY3NDk1OTIzfQ.-MZyNeCHc_jcsBSUYxzxuUzqMNBuYDM1r8VLBAbT81w';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getImportSummary(importId) {
  console.log(`📊 Getting import summary for: ${importId}`);
  
  const { data, error } = await supabase.rpc('get_import_analysis_summary', { import_uuid: importId });
  
  if (error) {
    console.error('❌ Error getting import summary:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    const summary = data[0];
    console.log('\n📈 Import Summary:');
    console.log(`   Total records: ${summary.total_records?.toLocaleString() || 'N/A'}`);
    console.log(`   Successful: ${summary.successful_records?.toLocaleString() || 'N/A'}`);
    console.log(`   Failed: ${summary.failed_records?.toLocaleString() || 'N/A'}`);
    console.log(`   Discarded: ${summary.discarded_records?.toLocaleString() || 'N/A'}`);
    console.log(`   Records with IDs: ${summary.records_with_ids?.toLocaleString() || 'N/A'}`);
    console.log(`   Records without IDs: ${summary.records_without_ids?.toLocaleString() || 'N/A'}`);
    
    if (summary.discard_breakdown) {
      console.log('\n🗑️ Discard Breakdown:');
      Object.entries(summary.discard_breakdown).forEach(([reason, count]) => {
        console.log(`   ${reason}: ${count.toLocaleString()} records`);
      });
    }
    
    return summary;
  }
  
  return null;
}

async function getDiscardedRecords(importId, reason = null, limit = 50) {
  console.log(`🔍 Getting discarded records for: ${importId}${reason ? ` (reason: ${reason})` : ''}`);
  
  const { data, error } = await supabase.rpc('get_discarded_records', { 
    import_uuid: importId, 
    reason_filter: reason 
  });
  
  if (error) {
    console.error('❌ Error getting discarded records:', error);
    return [];
  }
  
  if (data && data.length > 0) {
    console.log(`\n📋 Found ${data.length} discarded records:`);
    
    data.slice(0, limit).forEach((record, index) => {
      console.log(`\n   ${index + 1}. ${record.discard_reason.toUpperCase()}`);
      console.log(`      File: ${record.file_name || 'N/A'}`);
      console.log(`      Row: ${record.row_number || 'N/A'}`);
      console.log(`      Owner: ${record.owner_name || 'N/A'}`);
      console.log(`      Amount: ${record.current_cash_balance || 'N/A'}`);
      console.log(`      Holder: ${record.holder_name || 'N/A'}`);
      console.log(`      Type: ${record.property_type || 'N/A'}`);
      if (record.error_message) {
        console.log(`      Error: ${record.error_message}`);
      }
    });
    
    if (data.length > limit) {
      console.log(`\n   ... and ${data.length - limit} more records`);
    }
  } else {
    console.log('✅ No discarded records found');
  }
  
  return data;
}

async function getRecentImports(limit = 10) {
  console.log(`📋 Getting recent imports (last ${limit})...`);
  
  const { data, error } = await supabase
    .from('data_imports')
    .select('id, created_at, import_status, total_records, successful_records, failed_records')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error getting recent imports:', error);
    return [];
  }
  
  if (data && data.length > 0) {
    console.log('\n📋 Recent Imports:');
    data.forEach((import_, index) => {
      const successRate = import_.total_records > 0 ? 
        ((import_.successful_records / import_.total_records) * 100).toFixed(2) : 0;
      
      console.log(`\n   ${index + 1}. ${import_.id}`);
      console.log(`      Date: ${new Date(import_.created_at).toLocaleString()}`);
      console.log(`      Status: ${import_.import_status}`);
      console.log(`      Records: ${import_.successful_records?.toLocaleString() || 0}/${import_.total_records?.toLocaleString() || 0} (${successRate}%)`);
      console.log(`      Failed: ${import_.failed_records?.toLocaleString() || 0}`);
    });
  } else {
    console.log('❌ No imports found');
  }
  
  return data;
}

async function analyzeDiscardPatterns(importId) {
  console.log(`🔍 Analyzing discard patterns for: ${importId}`);
  
  const { data, error } = await supabase
    .from('discarded_records')
    .select('discard_reason, file_name, error_message')
    .eq('import_id', importId);
  
  if (error) {
    console.error('❌ Error analyzing discard patterns:', error);
    return;
  }
  
  if (data && data.length > 0) {
    // Group by reason
    const reasonGroups = {};
    const fileGroups = {};
    const errorGroups = {};
    
    data.forEach(record => {
      // Group by reason
      reasonGroups[record.discard_reason] = (reasonGroups[record.discard_reason] || 0) + 1;
      
      // Group by file
      if (record.file_name) {
        fileGroups[record.file_name] = (fileGroups[record.file_name] || 0) + 1;
      }
      
      // Group by error message
      if (record.error_message) {
        errorGroups[record.error_message] = (errorGroups[record.error_message] || 0) + 1;
      }
    });
    
    console.log('\n📊 Discard Analysis:');
    console.log(`   Total discarded: ${data.length.toLocaleString()}`);
    
    console.log('\n🗑️ By Reason:');
    Object.entries(reasonGroups)
      .sort(([,a], [,b]) => b - a)
      .forEach(([reason, count]) => {
        console.log(`   ${reason}: ${count.toLocaleString()} (${((count / data.length) * 100).toFixed(1)}%)`);
      });
    
    console.log('\n📄 By File:');
    Object.entries(fileGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([file, count]) => {
        console.log(`   ${file}: ${count.toLocaleString()}`);
      });
    
    console.log('\n❌ Top Error Messages:');
    Object.entries(errorGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([error, count]) => {
        console.log(`   "${error}": ${count.toLocaleString()}`);
      });
  }
}

async function main() {
  const command = process.argv[2];
  const importId = process.argv[3];
  const reason = process.argv[4];
  
  console.log('🔍 Discarded Records Analysis Tool');
  console.log('==================================');
  
  switch (command) {
    case 'summary':
      if (!importId) {
        console.error('❌ Please provide an import ID: node analyze-discarded-records.js summary <import-id>');
        process.exit(1);
      }
      await getImportSummary(importId);
      break;
      
    case 'records':
      if (!importId) {
        console.error('❌ Please provide an import ID: node analyze-discarded-records.js records <import-id> [reason]');
        process.exit(1);
      }
      await getDiscardedRecords(importId, reason);
      break;
      
    case 'patterns':
      if (!importId) {
        console.error('❌ Please provide an import ID: node analyze-discarded-records.js patterns <import-id>');
        process.exit(1);
      }
      await analyzeDiscardPatterns(importId);
      break;
      
    case 'recent':
      const limit = parseInt(process.argv[3]) || 10;
      await getRecentImports(limit);
      break;
      
    case 'full-analysis':
      if (!importId) {
        console.error('❌ Please provide an import ID: node analyze-discarded-records.js full-analysis <import-id>');
        process.exit(1);
      }
      console.log('🔍 Running full analysis...\n');
      await getImportSummary(importId);
      await analyzeDiscardPatterns(importId);
      await getDiscardedRecords(importId, null, 20);
      break;
      
    default:
      console.log(`
Usage: node analyze-discarded-records.js <command> [import-id] [reason]

Commands:
  summary <import-id>                    Get import summary with discard breakdown
  records <import-id> [reason]           Get discarded records (optionally filtered by reason)
  patterns <import-id>                   Analyze discard patterns and trends
  recent [limit]                         Show recent imports (default: 10)
  full-analysis <import-id>              Run complete analysis

Environment Variables:
  SUPABASE_URL                          Your Supabase project URL
  SUPABASE_SERVICE_KEY                  Your Supabase service key

Examples:
  node analyze-discarded-records.js recent 5
  node analyze-discarded-records.js summary abc123
  node analyze-discarded-records.js records abc123 missing_required_fields
  node analyze-discarded-records.js full-analysis abc123

Discard Reasons:
  parse_error                           CSV parsing errors
  validation_error                      Data validation failures
  insertion_error                       Database insertion errors
  duplicate_id                          Duplicate record IDs
  missing_required_fields               Missing required data
  malformed_data                        Malformed or incomplete records
      `);
      break;
  }
}

// Run the script
main().catch(console.error); 