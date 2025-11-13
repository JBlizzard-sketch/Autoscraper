import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

async function createSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Creating database schema...\n');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');
    
    // Read SQL schema file
    const schemaPath = path.join(process.cwd(), 'sql', '001_complete_schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');
    
    console.log('📝 Executing schema creation...');
    await pool.query(schemaSql);
    
    console.log('✅ Database schema created successfully!\n');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSchema().catch(console.error);
