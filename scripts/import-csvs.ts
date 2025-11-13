import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { Pool } from 'pg';
import path from 'path';

// Database connection - works with Supabase PostgreSQL
// For initial import, use SUPABASE_SERVICE_KEY and connection string from Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('🔗 Connecting to:', process.env.DATABASE_URL ? 'Supabase PostgreSQL' : 'Local PostgreSQL');

interface ImportStats {
  brands: number;
  categories: number;
  subcategories: number;
  products: number;
  product_images: number;
  errors: string[];
}

const stats: ImportStats = {
  brands: 0,
  categories: 0,
  subcategories: 0,
  products: 0,
  product_images: 0,
  errors: [],
};

// Helper function to generate slug from text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to read and parse CSV
function readCSV(filename: string): any[] {
  const filePath = path.join(process.cwd(), 'attached_assets', filename);
  const content = readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

// Import brands
async function importBrands() {
  console.log('\n📦 Importing brands...');
  const records = readCSV('auto_parts_dataset_brands_1762616065050.csv');
  
  for (const record of records) {
    try {
      await pool.query(
        `INSERT INTO brands (id, name, slug, logo_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         logo_url = EXCLUDED.logo_url,
         updated_at = CURRENT_TIMESTAMP`,
        [record.id, record.name, record.slug, null]
      );
      stats.brands++;
    } catch (error: any) {
      stats.errors.push(`Brand ${record.id}: ${error.message}`);
    }
  }
  console.log(`✅ Imported ${stats.brands} brands`);
}

// Import categories
async function importCategories() {
  console.log('\n📦 Importing categories...');
  const records = readCSV('auto_parts_dataset_categories_1762616065048.csv');
  
  for (const record of records) {
    try {
      await pool.query(
        `INSERT INTO categories (id, name, slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         updated_at = CURRENT_TIMESTAMP`,
        [record.id, record.name, record.slug]
      );
      stats.categories++;
    } catch (error: any) {
      stats.errors.push(`Category ${record.id}: ${error.message}`);
    }
  }
  console.log(`✅ Imported ${stats.categories} categories`);
}

// Import subcategories
async function importSubcategories() {
  console.log('\n📦 Importing subcategories...');
  const records = readCSV('auto_parts_dataset_subcategories_1762616065046.csv');
  
  for (const record of records) {
    try {
      await pool.query(
        `INSERT INTO subcategories (id, name, slug, category_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         category_id = EXCLUDED.category_id,
         updated_at = CURRENT_TIMESTAMP`,
        [record.id, record.name, record.slug, record.category_id]
      );
      stats.subcategories++;
    } catch (error: any) {
      stats.errors.push(`Subcategory ${record.id}: ${error.message}`);
    }
  }
  console.log(`✅ Imported ${stats.subcategories} subcategories`);
}

// Import products
async function importProducts(limit?: number) {
  console.log('\n📦 Importing products (this may take a moment)...');
  const allRecords = readCSV('auto_parts_dataset_products_1762616065044.csv');
  
  // Limit products if specified (default 600 for faster development)
  const records = limit ? allRecords.slice(0, limit) : allRecords;
  console.log(`  Importing ${records.length} of ${allRecords.length} products`);
  
  // Use batch inserts for better performance
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      await pool.query('BEGIN');
      
      for (const record of batch) {
        try {
          // Set random stock quantity between 0 and 50
          const stockQuantity = Math.floor(Math.random() * 51);
          const available = stockQuantity > 0;
          
          // Generate slug from product name and ID
          const slug = slugify(`${record.name}-${record.id}`);
          
          await pool.query(
            `INSERT INTO products (
              id, name, slug, price, vehicle_make, vehicle_model, year_range,
              brand_id, category_id, subcategory_id, engine_size, oem_part_number,
              description, product_url, image_url, stock_quantity, available,
              created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            price = EXCLUDED.price,
            vehicle_make = EXCLUDED.vehicle_make,
            vehicle_model = EXCLUDED.vehicle_model,
            year_range = EXCLUDED.year_range,
            brand_id = EXCLUDED.brand_id,
            category_id = EXCLUDED.category_id,
            subcategory_id = EXCLUDED.subcategory_id,
            engine_size = EXCLUDED.engine_size,
            oem_part_number = EXCLUDED.oem_part_number,
            description = EXCLUDED.description,
            product_url = EXCLUDED.product_url,
            image_url = EXCLUDED.image_url,
            stock_quantity = EXCLUDED.stock_quantity,
            available = EXCLUDED.available,
            updated_at = CURRENT_TIMESTAMP`,
            [
              record.id,
              record.name,
              slug,
              record.price,
              record.vehicle_make,
              record.vehicle_model,
              record.year_range,
              record.brand_id,
              record.category_id,
              record.subcategory_id,
              record.engine_size,
              record.oem_part_number,
              record.description,
              record.product_url,
              record.image_url,
              stockQuantity,
              available,
              record.created_at,
              record.updated_at,
            ]
          );
          stats.products++;
        } catch (error: any) {
          stats.errors.push(`Product ${record.id}: ${error.message}`);
        }
      }
      
      await pool.query('COMMIT');
      
      if ((i + batchSize) % 500 === 0 || i + batchSize >= records.length) {
        console.log(`  ... imported ${Math.min(i + batchSize, records.length)}/${records.length} products`);
      }
    } catch (error: any) {
      await pool.query('ROLLBACK');
      stats.errors.push(`Batch at ${i}: ${error.message}`);
    }
  }
  console.log(`✅ Imported ${stats.products} products`);
}

// Import product images
async function importProductImages(limit?: number) {
  console.log('\n📦 Importing product images (this may take a moment)...');
  const allRecords = readCSV('auto_parts_dataset_product_images_1762616065042.csv');
  
  // If limiting products, limit images proportionally
  const records = limit ? allRecords.slice(0, Math.min(limit * 2, allRecords.length)) : allRecords;
  console.log(`  Importing ${records.length} of ${allRecords.length} product images`);
  
  // Use batch inserts for better performance
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      await pool.query('BEGIN');
      
      for (const record of batch) {
        try {
          // Determine display order based on the index
          const displayOrder = i % 10;
          
          await pool.query(
            `INSERT INTO product_images (id, product_id, image_url, display_order, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
             product_id = EXCLUDED.product_id,
             image_url = EXCLUDED.image_url,
             display_order = EXCLUDED.display_order`,
            [record.id, record.product_id, record.image_url, displayOrder, record.created_at]
          );
          stats.product_images++;
        } catch (error: any) {
          stats.errors.push(`Product Image ${record.id}: ${error.message}`);
        }
      }
      
      await pool.query('COMMIT');
      
      if ((i + batchSize) % 1000 === 0 || i + batchSize >= records.length) {
        console.log(`  ... imported ${Math.min(i + batchSize, records.length)}/${records.length} images`);
      }
    } catch (error: any) {
      await pool.query('ROLLBACK');
      stats.errors.push(`Image batch at ${i}: ${error.message}`);
    }
  }
  console.log(`✅ Imported ${stats.product_images} product images`);
}

// Main import function
async function main() {
  console.log('🚀 Starting CSV import to PostgreSQL...\n');
  console.log('Database:', process.env.PGDATABASE);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const fullImport = args.includes('--full');
  
  // Default to 600 products for development, or full if --full flag
  const productLimit = fullImport ? undefined : (limitArg ? parseInt(limitArg.split('=')[1]) : 600);
  
  if (productLimit) {
    console.log(`\n⚡ DEVELOPMENT MODE: Importing ${productLimit} products`);
    console.log('   (Use --full to import all 3,200 products)\n');
  } else {
    console.log('\n📚 FULL IMPORT: Importing all products\n');
  }
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');
    
    // Import in order (respecting foreign keys)
    await importBrands();
    await importCategories();
    await importSubcategories();
    await importProducts(productLimit);
    await importProductImages(productLimit);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Brands:          ${stats.brands}`);
    console.log(`✅ Categories:      ${stats.categories}`);
    console.log(`✅ Subcategories:   ${stats.subcategories}`);
    console.log(`✅ Products:        ${stats.products}`);
    console.log(`✅ Product Images:  ${stats.product_images}`);
    console.log('='.repeat(60));
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  ${stats.errors.length} errors occurred:`);
      stats.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`);
      }
    } else {
      console.log('\n🎉 All data imported successfully!');
    }
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as importCSVs };
