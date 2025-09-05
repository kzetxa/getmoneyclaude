#!/usr/bin/env node

/**
 * Test AWS Database Connection Script
 * 
 * This script tests the connection to your AWS RDS PostgreSQL database
 * and verifies that the required tables exist.
 */

import pg from 'pg';

// AWS PostgreSQL configuration
const AWS_DB_CONFIG = {
  host: "moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Latimer1!",
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

async function testConnection() {
  console.log('🔍 Testing AWS Database Connection...');
  console.log(`Host: ${AWS_DB_CONFIG.host}:${AWS_DB_CONFIG.port}`);
  console.log(`Database: ${AWS_DB_CONFIG.database}`);
  console.log(`User: ${AWS_DB_CONFIG.user}`);
  console.log('');

  const pool = new pg.Pool(AWS_DB_CONFIG);
  
  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test server version
    const versionResult = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL Version: ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Check if tables exist
    console.log('\n📋 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('unclaimed_properties', 'data_imports')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No required tables found. You may need to run the import script first.');
      console.log('   Run: node scripts/import-data-aws.js');
    } else {
      console.log('✅ Found tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
      // Check record counts
      console.log('\n📊 Checking record counts...');
      const countResult = await client.query('SELECT COUNT(*) as count FROM unclaimed_properties');
      console.log(`   unclaimed_properties: ${parseInt(countResult.rows[0].count).toLocaleString()} records`);
      
      const importResult = await client.query('SELECT COUNT(*) as count FROM data_imports');
      console.log(`   data_imports: ${parseInt(importResult.rows[0].count).toLocaleString()} records`);
    }
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM unclaimed_properties 
      WHERE owner_name ILIKE '%test%' 
      LIMIT 1
    `);
    console.log('✅ Search query executed successfully');
    
    // Test indexes
    console.log('\n🔍 Checking indexes...');
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'unclaimed_properties'
      ORDER BY indexname
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Found indexes:');
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log('⚠️  No indexes found. Performance may be slow.');
    }
    
    client.release();
    console.log('\n🎉 All tests passed! Your AWS database is ready to use.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check if the AWS RDS instance is running');
      console.log('   2. Verify the security group allows connections from your IP');
      console.log('   3. Ensure the database credentials are correct');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check your username and password.');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Check the database name.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

