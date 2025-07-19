#!/usr/bin/env node

/**
 * Test script for the import-data Netlify function
 * 
 * This script helps test the new serverless import function
 * by making API calls to start, monitor, and cancel imports.
 */

import fetch from 'node-fetch';

// Configuration
const NETLIFY_URL = process.env.NETLIFY_URL || 'http://localhost:8888';
const FUNCTION_ENDPOINT = `${NETLIFY_URL}/api/import-data`;

async function makeRequest(action, importId = null) {
  const body = { action };
  if (importId) {
    body.importId = importId;
  }

  console.log(`\n🔄 Making ${action} request...`);
  console.log(`📡 Endpoint: ${FUNCTION_ENDPOINT}`);
  console.log(`📦 Body:`, JSON.stringify(body, null, 2));

  try {
    const response = await fetch(FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function startImport() {
  console.log('🚀 Starting new import...');
  const result = await makeRequest('start');
  
  if (result.success && result.data.success) {
    console.log(`✅ Import started successfully!`);
    console.log(`🆔 Import ID: ${result.data.importId}`);
    return result.data.importId;
  } else {
    console.error(`❌ Failed to start import:`, result.data?.message || result.error);
    return null;
  }
}

async function checkStatus(importId) {
  console.log(`📊 Checking status for import: ${importId}`);
  const result = await makeRequest('status', importId);
  
  if (result.success && result.data.success) {
    const { status, progress } = result.data;
    console.log(`📈 Status: ${status}`);
    
    if (progress) {
      const { total, successful, failed } = progress;
      const percentage = total > 0 ? ((successful / total) * 100).toFixed(2) : 0;
      console.log(`📊 Progress: ${successful.toLocaleString()}/${total.toLocaleString()} (${percentage}%)`);
      console.log(`❌ Failed: ${failed.toLocaleString()}`);
    }
    
    return result.data;
  } else {
    console.error(`❌ Failed to get status:`, result.data?.message || result.error);
    return null;
  }
}

async function cancelImport(importId) {
  console.log(`🛑 Cancelling import: ${importId}`);
  const result = await makeRequest('cancel', importId);
  
  if (result.success && result.data.success) {
    console.log(`✅ Import cancelled successfully!`);
    return true;
  } else {
    console.error(`❌ Failed to cancel import:`, result.data?.message || result.error);
    return false;
  }
}

async function monitorImport(importId, intervalMs = 5000) {
  console.log(`\n👀 Monitoring import ${importId} every ${intervalMs/1000} seconds...`);
  console.log(`Press Ctrl+C to stop monitoring\n`);
  
  const checkStatusAndContinue = async () => {
    const status = await checkStatus(importId);
    
    if (status && ['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(status.status)) {
      console.log(`\n🏁 Import finished with status: ${status.status}`);
      return false; // Stop monitoring
    }
    
    return true; // Continue monitoring
  };
  
  // Initial check
  let shouldContinue = await checkStatusAndContinue();
  
  // Set up interval for monitoring
  const interval = setInterval(async () => {
    shouldContinue = await checkStatusAndContinue();
    if (!shouldContinue) {
      clearInterval(interval);
    }
  }, intervalMs);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Monitoring stopped by user');
    clearInterval(interval);
    process.exit(0);
  });
}

async function main() {
  const command = process.argv[2];
  const importId = process.argv[3];
  
  console.log('🧪 Netlify Import Function Test Script');
  console.log('=====================================');
  
  switch (command) {
    case 'start':
      await startImport();
      break;
      
    case 'status':
      if (!importId) {
        console.error('❌ Please provide an import ID: node test-import-function.js status <import-id>');
        process.exit(1);
      }
      await checkStatus(importId);
      break;
      
    case 'cancel':
      if (!importId) {
        console.error('❌ Please provide an import ID: node test-import-function.js cancel <import-id>');
        process.exit(1);
      }
      await cancelImport(importId);
      break;
      
    case 'monitor':
      if (!importId) {
        console.error('❌ Please provide an import ID: node test-import-function.js monitor <import-id>');
        process.exit(1);
      }
      await monitorImport(importId);
      break;
      
    case 'full-test':
      console.log('🧪 Running full test sequence...');
      
      // Start import
      const newImportId = await startImport();
      if (!newImportId) {
        console.error('❌ Failed to start import, aborting test');
        process.exit(1);
      }
      
      // Wait a moment
      console.log('\n⏳ Waiting 3 seconds before checking status...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check status
      await checkStatus(newImportId);
      
      // Ask user if they want to monitor
      console.log('\n❓ Do you want to monitor this import? (y/n)');
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          await monitorImport(newImportId);
        } else {
          console.log('👋 Test completed. You can check status later with:');
          console.log(`   node test-import-function.js status ${newImportId}`);
          process.exit(0);
        }
      });
      break;
      
    default:
      console.log(`
Usage: node test-import-function.js <command> [import-id]

Commands:
  start                    Start a new import
  status <import-id>       Check status of an import
  cancel <import-id>       Cancel an import
  monitor <import-id>      Monitor an import with live updates
  full-test               Run a complete test sequence

Environment Variables:
  NETLIFY_URL             Base URL for Netlify (default: http://localhost:8888)

Examples:
  node test-import-function.js start
  node test-import-function.js status abc123
  node test-import-function.js monitor abc123
  node test-import-function.js full-test
      `);
      break;
  }
}

// Run the script
main().catch(console.error); 