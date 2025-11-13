#!/usr/bin/env tsx
/**
 * AutoParts Kenya - Database Setup Script
 * 
 * This script sets up the database from scratch:
 * 1. Creates database schema (15 tables)
 * 2. Imports CSV data (600 products by default, or all 3,200 with --full flag)
 * 
 * Usage:
 *   tsx scripts/setup-database.ts          # Import 600 products (fast, avoids timeout)
 *   tsx scripts/setup-database.ts --full   # Import all 3,200 products
 */

import { Pool } from 'pg';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkIfSchemaExists(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'products'
    `);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    return false;
  }
}

async function checkIfDataExists(): Promise<{ exists: boolean; count: number }> {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM products');
    const count = parseInt(result.rows[0].count);
    return { exists: count > 0, count };
  } catch (error) {
    return { exists: false, count: 0 };
  }
}

async function createSchema() {
  console.log('\n📝 Creating database schema...');
  
  const schemaPath = path.join(process.cwd(), 'sql', '001_complete_schema.sql');
  
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  
  console.log('✅ Database schema created successfully!');
  
  // Verify tables were created
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log('\n📊 Created tables:');
  result.rows.forEach(row => console.log(`  - ${row.table_name}`));
}

async function importData(fullImport: boolean) {
  console.log('\n📦 Importing CSV data...');
  
  const importScriptPath = path.join(process.cwd(), 'scripts', 'import-csvs.ts');
  
  if (!existsSync(importScriptPath)) {
    throw new Error(`Import script not found: ${importScriptPath}`);
  }
  
  const command = fullImport 
    ? 'tsx scripts/import-csvs.ts --full'
    : 'tsx scripts/import-csvs.ts';
  
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  console.log('🚀 AutoParts Kenya - Database Setup\n');
  console.log('=' .repeat(60));
  
  const args = process.argv.slice(2);
  const fullImport = args.includes('--full');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if schema exists
    const schemaExists = await checkIfSchemaExists();
    
    if (schemaExists) {
      console.log('\n⚠️  Database schema already exists');
      
      // Check if data exists
      const { exists: dataExists, count } = await checkIfDataExists();
      
      if (dataExists) {
        console.log(`⚠️  Database already has ${count} products`);
        console.log('\nOptions:');
        console.log('  1. Skip setup (database is ready)');
        console.log('  2. Re-import data (will add duplicates unless you drop tables first)');
        console.log('\n💡 If you want to start fresh, run:');
        console.log('   psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"');
        console.log('   Then run this script again.\n');
        
        process.exit(0);
      } else {
        console.log('ℹ️  Schema exists but no data found. Importing data...');
        await importData(fullImport);
      }
    } else {
      console.log('\n📝 No schema found. Creating from scratch...');
      await createSchema();
      await importData(fullImport);
    }
    
    // Final verification
    const { count: finalCount } = await checkIfDataExists();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Products in database: ${finalCount}`);
    console.log('✅ API endpoints ready');
    console.log('✅ Server can be started with: npm run dev');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit the homepage to see real data');
    console.log('   2. Build authentication, cart, and order features');
    if (!fullImport) {
      console.log('   3. Import remaining products: tsx scripts/import-csvs.ts --full');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
