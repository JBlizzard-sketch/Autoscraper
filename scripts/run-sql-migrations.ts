import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function runMigrations() {
  console.log('\n🔧 Running SQL Migrations on Supabase');
  console.log('=' .repeat(80) + '\n');
  
  // Extract connection details from Supabase URL
  const dbUrl = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const projectRef = dbUrl;
  
  // Construct PostgreSQL connection string
  // Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  const password = SUPABASE_SERVICE_KEY; // Service key acts as password for direct connections
  
  console.log('📝 Note: For direct SQL execution, you have two options:\n');
  console.log('Option 1: Run SQL scripts manually in Supabase SQL Editor');
  console.log('  1. Go to https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('  2. Copy contents of sql/000_create_schema.sql');
  console.log('  3. Paste and run in SQL Editor');
  console.log('  4. Repeat for sql/001_create_rls_and_policies.sql\n');
  
  console.log('Option 2: Use the connection string you provided:');
  console.log('  postgresql://postgres:Shady868@db.uzxnaqfeouwfzimqrvxh.supabase.co:5432/postgres\n');
  
  console.log('📄 SQL files to run:');
  console.log('  - sql/000_create_schema.sql');
  console.log('  - sql/001_create_rls_and_policies.sql\n');
  
  // Try to execute using pg Pool with the user's connection string
  const connectionString = 'postgresql://postgres:Shady868@db.uzxnaqfeouwfzimqrvxh.supabase.co:5432/postgres';
  
  try {
    console.log('🔌 Attempting direct PostgreSQL connection...\n');
    
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    
    console.log('✅ Connected to database!\n');
    
    // Run schema creation
    console.log('📝 Executing schema creation...');
    const schemaSQL = fs.readFileSync(path.join(process.cwd(), 'sql', '000_create_schema.sql'), 'utf-8');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully!\n');
    
    // Run RLS policies
    console.log('🔒 Executing RLS policies...');
    const rlsSQL = fs.readFileSync(path.join(process.cwd(), 'sql', '001_create_rls_and_policies.sql'), 'utf-8');
    await client.query(rlsSQL);
    console.log('✅ RLS policies created successfully!\n');
    
    client.release();
    await pool.end();
    
    console.log('✅ All migrations completed!\n');
    console.log('You can now run: tsx scripts/seed-supabase.ts\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Please run SQL scripts manually in Supabase SQL Editor');
    console.log('Visit: https://supabase.com/dashboard/project/' + projectRef + '/sql\n');
  }
}

runMigrations();
