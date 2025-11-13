# Supabase Migration Guide

This guide will help you migrate your AutoParts Kenya data from local PostgreSQL to your production Supabase database.

## Prerequisites

✅ Your Supabase project already has:
- Brands table (seeded)
- Categories table (seeded)
- Subcategories table (seeded)

⏳ Need to migrate:
- Products (3,200 records)
- Product Images (6,454 records)
- E-commerce tables (users, carts, orders, blog)

## Migration Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. You'll run all migration commands here

### Step 2: Verify Existing Tables

Run this query to check what tables you already have:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 3: Create Missing Tables

If you don't have the e-commerce and blog tables, run the complete schema:

```sql
-- Copy the entire content from sql/001_complete_schema.sql
-- and paste it into Supabase SQL Editor

-- The script is idempotent (safe to run multiple times)
-- It will DROP existing tables and recreate them
```

**Note:** The schema file is located at `sql/001_complete_schema.sql` in your project.

### Step 4: Prepare Products Data for Export

Since your Supabase already has brands, categories, and subcategories, you only need to migrate products and images.

**Option A: Export via CSV (Recommended)**

1. In your Replit console, run:

```bash
# Export products to CSV
psql $DATABASE_URL -c "COPY (SELECT * FROM products ORDER BY id) TO STDOUT WITH CSV HEADER" > products_export.csv

# Export product_images to CSV
psql $DATABASE_URL -c "COPY (SELECT * FROM product_images ORDER BY product_id, display_order) TO STDOUT WITH CSV HEADER" > images_export.csv
```

2. Download these files from Replit

3. In Supabase dashboard:
   - Go to **Table Editor** → **products**
   - Click **Insert** → **Import data from CSV**
   - Upload `products_export.csv`

4. Repeat for product_images table

**Option B: Use Supabase Client SDK**

Create a migration script:

```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const localPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateProducts() {
  console.log('Migrating products...');
  
  // Get all products from local DB
  const result = await localPool.query('SELECT * FROM products ORDER BY id');
  const products = result.rows;
  
  // Insert in batches of 100
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error at batch ${i}:`, error);
    } else {
      console.log(`Migrated ${i + batch.length}/${products.length} products`);
    }
  }
}

async function migrateProductImages() {
  console.log('Migrating product images...');
  
  const result = await localPool.query('SELECT * FROM product_images ORDER BY product_id');
  const images = result.rows;
  
  // Insert in batches of 200
  for (let i = 0; i < images.length; i += 200) {
    const batch = images.slice(i, i + 200);
    const { error } = await supabase
      .from('product_images')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error at batch ${i}:`, error);
    } else {
      console.log(`Migrated ${i + batch.length}/${images.length} images`);
    }
  }
}

async function main() {
  try {
    await migrateProducts();
    await migrateProductImages();
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await localPool.end();
  }
}

main();
```

Run the migration:
```bash
# Set your Supabase credentials first
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Run migration
tsx scripts/migrate-to-supabase.ts
```

### Step 5: Verify Migration

After migration, verify in Supabase SQL Editor:

```sql
-- Check record counts
SELECT 
    (SELECT COUNT(*) FROM brands) as brands,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM subcategories) as subcategories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM product_images) as images;

-- Should show:
-- brands: 10
-- categories: 10
-- subcategories: 47
-- products: 3200
-- images: 6454
```

Sample data check:
```sql
SELECT 
    p.id,
    p.name,
    p.price,
    b.name as brand,
    c.name as category,
    p.vehicle_make,
    p.vehicle_model
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
LIMIT 10;
```

### Step 6: Update Production Environment Variables

In your deployment platform (Vercel, Railway, etc.):

```env
# Replace local DATABASE_URL with Supabase connection string
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Or use Supabase connection pooler for better performance
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?pgbouncer=true

# Add Supabase client credentials (if using Supabase client)
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**Important:** The code doesn't need changes! It uses PostgreSQL connection pool which works with both local and Supabase databases.

### Step 7: Set Up Row Level Security (Optional but Recommended)

Enable RLS for user data privacy:

```sql
-- Enable RLS on user-specific tables
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access to catalog
CREATE POLICY "Public products access" ON products FOR SELECT USING (true);
CREATE POLICY "Public brands access" ON brands FOR SELECT USING (true);
CREATE POLICY "Public categories access" ON categories FOR SELECT USING (true);

-- Users can only access their own carts
CREATE POLICY "Users can view own cart" ON carts FOR SELECT
  USING (user_id = auth.uid() OR session_id = current_setting('request.jwt.claim.session_id', true));

-- Users can only access their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT
  USING (user_id = auth.uid() OR session_id = current_setting('request.jwt.claim.session_id', true));
```

## Testing Production Database

After migration, test your API endpoints:

```bash
# Test products endpoint
curl https://your-domain.com/api/products?limit=5

# Test categories
curl https://your-domain.com/api/categories

# Test search
curl https://your-domain.com/api/search?q=brake
```

## Rollback Plan

If something goes wrong, you can rollback:

1. **Keep your local database running** - It's your source of truth
2. **Re-run the migration** - The scripts use `UPSERT` which is safe to re-run
3. **Restore from backup**:

```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;

-- Then re-run the schema creation and migration
```

## Performance Considerations

### Connection Pooling

Supabase provides a connection pooler on port `6543`. Use it for production:

```
postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?pgbouncer=true
```

Benefits:
- Handles more concurrent connections
- Better performance under load
- Automatic connection management

### Indexes

The schema includes optimized indexes for:
- Full-text search: `idx_products_search`
- Vehicle lookup: `idx_products_vehicle`
- Price filtering: `idx_products_price`
- Category browsing: `idx_products_category`, `idx_products_subcategory`
- Brand filtering: `idx_products_brand`

### Caching Strategy

Consider implementing:
1. **Edge caching** for product listings (Vercel Edge, Cloudflare)
2. **Redis** for frequently accessed data
3. **CDN** for product images

## Monitoring

Set up monitoring in Supabase dashboard:
- **Database** → Performance
- Check query execution times
- Monitor connection pool usage
- Set up alerts for slow queries

## Cost Optimization

Supabase pricing tips:
1. **Free tier** includes:
   - 500MB database storage
   - 1GB file storage
   - 2GB bandwidth

2. **Pro tier** ($25/month) for production:
   - 8GB database storage
   - 100GB file storage
   - 250GB bandwidth

Your dataset:
- Database: ~150MB (3,200 products + 6,454 images metadata)
- Images: Store URLs (not files) in database to save storage

## Support

If you encounter issues:

1. **Check Supabase logs**: Dashboard → Logs
2. **Test connection**: Use SQL Editor to run simple `SELECT NOW()`
3. **Verify credentials**: Double-check connection strings
4. **Contact support**: Supabase has excellent Discord community

## Next Steps After Migration

- [ ] ✅ Verify all data migrated correctly
- [ ] Set up automatic backups in Supabase
- [ ] Configure RLS policies
- [ ] Set up monitoring and alerts
- [ ] Test all API endpoints in production
- [ ] Update documentation with production URLs
- [ ] Set up staging environment (optional)
