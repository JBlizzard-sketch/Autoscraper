import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

interface CSVRow {
  supplier: string;
  product_name: string;
  price: string;
  price_raw: string;
  vehicle_make: string;
  vehicle_model: string;
  year_range: string;
  main_category: string;
  subcategory: string;
  brand: string;
  engine_size: string;
  oem_part_number: string;
  category: string;
  description: string;
  product_url: string;
  image_urls: string;
  scrape_date: string;
}

interface SeedStats {
  totalRows: number;
  suppliers: { inserted: number; errors: number };
  brands: { inserted: number; errors: number };
  categories: { inserted: number; errors: number };
  products: { inserted: number; errors: number };
  errors: Array<{ row: number; error: string; data: any }>;
  startTime: Date;
  endTime?: Date;
}

const stats: SeedStats = {
  totalRows: 0,
  suppliers: { inserted: 0, errors: 0 },
  brands: { inserted: 0, errors: 0 },
  categories: { inserted: 0, errors: 0 },
  products: { inserted: 0, errors: 0 },
  errors: [],
  startTime: new Date(),
};

async function loadCSV(): Promise<CSVRow[]> {
  console.log('📂 Loading CSV file...');
  const csvPath = path.join(process.cwd(), 'attached_assets', 'combined_master_1762595051951.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  stats.totalRows = records.length;
  console.log(`✅ Loaded ${stats.totalRows} rows from CSV\n`);
  return records;
}

async function runMigrations() {
  console.log('🔧 Running database migrations...\n');
  
  const schemaSQL = fs.readFileSync(path.join(process.cwd(), 'sql', '000_create_schema.sql'), 'utf-8');
  const rlsSQL = fs.readFileSync(path.join(process.cwd(), 'sql', '001_create_rls_and_policies.sql'), 'utf-8');
  
  console.log('  → Executing schema creation...');
  const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL }).single();
  
  if (schemaError) {
    // Try direct execution if RPC doesn't exist
    const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
    if (directError) {
      console.log('  ⚠️  Note: Run SQL scripts manually in Supabase SQL Editor');
      console.log('  📄 Scripts located in: sql/000_create_schema.sql and sql/001_create_rls_and_policies.sql\n');
    }
  } else {
    console.log('  ✅ Schema created successfully');
    
    console.log('  → Executing RLS policies...');
    await supabase.rpc('exec_sql', { sql: rlsSQL });
    console.log('  ✅ RLS policies created successfully\n');
  }
}

async function upsertSuppliers(records: CSVRow[]): Promise<Map<string, string>> {
  console.log('👥 Upserting suppliers...');
  const supplierMap = new Map<string, string>();
  const uniqueSuppliers = Array.from(new Set(records.map(r => r.supplier).filter(Boolean)));
  
  for (const supplierName of uniqueSuppliers) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .upsert({ name: supplierName }, { onConflict: 'name' })
        .select('id, name')
        .single();
      
      if (error) throw error;
      if (data) {
        supplierMap.set(supplierName, data.id);
        stats.suppliers.inserted++;
      }
    } catch (error: any) {
      stats.suppliers.errors++;
      stats.errors.push({ row: 0, error: `Supplier error: ${error.message}`, data: { supplierName } });
    }
  }
  
  console.log(`  ✅ ${stats.suppliers.inserted} suppliers processed\n`);
  return supplierMap;
}

async function upsertBrands(records: CSVRow[]): Promise<Map<string, string>> {
  console.log('🏷️  Upserting brands...');
  const brandMap = new Map<string, string>();
  const uniqueBrands = Array.from(
    new Set(records.map(r => r.brand).filter(b => b && b.trim() && b !== 'Unknown'))
  );
  
  for (const brandName of uniqueBrands) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .upsert({ name: brandName }, { onConflict: 'name' })
        .select('id, name')
        .single();
      
      if (error) throw error;
      if (data) {
        brandMap.set(brandName, data.id);
        stats.brands.inserted++;
      }
    } catch (error: any) {
      stats.brands.errors++;
      stats.errors.push({ row: 0, error: `Brand error: ${error.message}`, data: { brandName } });
    }
  }
  
  console.log(`  ✅ ${stats.brands.inserted} brands processed\n`);
  return brandMap;
}

async function upsertCategories(records: CSVRow[]): Promise<{ mainMap: Map<string, string>; subMap: Map<string, string> }> {
  console.log('📁 Upserting categories...');
  const mainMap = new Map<string, string>();
  const subMap = new Map<string, string>();
  
  // Get unique main categories
  const uniqueMainCategories = Array.from(
    new Set(records.map(r => r.main_category).filter(c => c && c.trim() && c !== 'Uncategorized'))
  );
  
  // Insert main categories first
  for (const categoryName of uniqueMainCategories) {
    try {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      const { data, error } = await supabase
        .from('categories')
        .upsert({ name: categoryName, slug, parent_id: null }, { onConflict: 'slug' })
        .select('id, name')
        .single();
      
      if (error) throw error;
      if (data) {
        mainMap.set(categoryName, data.id);
        stats.categories.inserted++;
      }
    } catch (error: any) {
      stats.categories.errors++;
      stats.errors.push({ row: 0, error: `Category error: ${error.message}`, data: { categoryName } });
    }
  }
  
  // Get unique subcategories with their parent categories
  const subcategoryPairs = records
    .filter(r => r.subcategory && r.subcategory.trim() && r.main_category)
    .map(r => ({ sub: r.subcategory, main: r.main_category }));
  
  const uniqueSubcategories = Array.from(
    new Map(subcategoryPairs.map(p => [p.sub, p])).values()
  );
  
  // Insert subcategories
  for (const { sub, main } of uniqueSubcategories) {
    try {
      const slug = sub.toLowerCase().replace(/\s+/g, '-');
      const parentId = mainMap.get(main);
      
      const { data, error } = await supabase
        .from('categories')
        .upsert({ name: sub, slug, parent_id: parentId || null }, { onConflict: 'slug' })
        .select('id, name')
        .single();
      
      if (error) throw error;
      if (data) {
        subMap.set(sub, data.id);
        stats.categories.inserted++;
      }
    } catch (error: any) {
      stats.categories.errors++;
      stats.errors.push({ row: 0, error: `Subcategory error: ${error.message}`, data: { sub, main } });
    }
  }
  
  console.log(`  ✅ ${stats.categories.inserted} categories processed\n`);
  return { mainMap, subMap };
}

async function insertProducts(
  records: CSVRow[],
  supplierMap: Map<string, string>,
  brandMap: Map<string, string>,
  categoryMaps: { mainMap: Map<string, string>; subMap: Map<string, string> }
) {
  console.log('📦 Inserting products...');
  const { mainMap, subMap } = categoryMaps;
  
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    
    try {
      // Parse price
      let price = 0;
      if (row.price && !isNaN(Number(row.price))) {
        price = Number(row.price);
      }
      
      // Parse image URLs
      let imageUrls: string[] = [];
      if (row.image_urls && row.image_urls.trim() && row.image_urls.length > 5) {
        imageUrls = [row.image_urls.trim()];
      }
      
      // Determine availability from category field (contains stock status)
      const available = !row.category?.toLowerCase().includes('out of stock');
      
      const product = {
        supplier_id: supplierMap.get(row.supplier) || null,
        brand_id: brandMap.get(row.brand) || null,
        product_name: row.product_name || 'Untitled Product',
        sku: null,
        oem_part_number: row.oem_part_number || null,
        description: row.description || null,
        price,
        currency: 'KES',
        available,
        stock_quantity: available ? 10 : 0,
        main_category_id: mainMap.get(row.main_category) || null,
        subcategory_id: subMap.get(row.subcategory) || null,
        vehicle_make: row.vehicle_make || null,
        vehicle_model: row.vehicle_model || null,
        year_range: row.year_range || null,
        engine_size: row.engine_size || null,
        image_urls: imageUrls,
        product_url: row.product_url || null,
        extra_attributes: {
          category_info: row.category || null,
          scrape_date: row.scrape_date || null,
          price_raw: row.price_raw || null,
        },
      };
      
      const { error } = await supabase.from('products').insert(product);
      
      if (error) throw error;
      stats.products.inserted++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`  → ${i + 1}/${records.length} products processed...`);
      }
    } catch (error: any) {
      stats.products.errors++;
      stats.errors.push({
        row: i + 1,
        error: `Product error: ${error.message}`,
        data: { product_name: row.product_name }
      });
    }
  }
  
  console.log(`  ✅ ${stats.products.inserted} products inserted\n`);
}

async function generateReports() {
  stats.endTime = new Date();
  const duration = ((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Duration: ${duration}s`);
  console.log(`📝 Total CSV rows: ${stats.totalRows}`);
  console.log(`\n✅ Success:`);
  console.log(`   Suppliers: ${stats.suppliers.inserted}`);
  console.log(`   Brands: ${stats.brands.inserted}`);
  console.log(`   Categories: ${stats.categories.inserted}`);
  console.log(`   Products: ${stats.products.inserted}`);
  console.log(`\n❌ Errors:`);
  console.log(`   Suppliers: ${stats.suppliers.errors}`);
  console.log(`   Brands: ${stats.brands.errors}`);
  console.log(`   Categories: ${stats.categories.errors}`);
  console.log(`   Products: ${stats.products.errors}`);
  console.log(`   Total: ${stats.errors.length}`);
  
  // Save detailed logs
  const reportsDir = path.join(process.cwd(), 'seed-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const logPath = path.join(reportsDir, 'seed_log.json');
  fs.writeFileSync(logPath, JSON.stringify(stats, null, 2));
  console.log(`\n📄 Detailed log saved to: ${logPath}`);
  
  if (stats.errors.length > 0) {
    const errorsPath = path.join(reportsDir, 'seed_errors.json');
    fs.writeFileSync(errorsPath, JSON.stringify(stats.errors, null, 2));
    console.log(`📄 Error details saved to: ${errorsPath}`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('\n🚀 AutoParts Kenya - Supabase Seeding Script');
  console.log('='.repeat(80) + '\n');
  
  try {
    // Load CSV data
    const records = await loadCSV();
    
    // Run migrations (will note if manual run needed)
    await runMigrations();
    
    // Seed data in dependency order
    const supplierMap = await upsertSuppliers(records);
    const brandMap = await upsertBrands(records);
    const categoryMaps = await upsertCategories(records);
    await insertProducts(records, supplierMap, brandMap, categoryMaps);
    
    // Generate reports
    await generateReports();
    
    console.log('✅ Seeding completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
