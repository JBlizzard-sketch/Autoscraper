# Supabase Migration Guide

## Overview

This guide explains how to migrate the AutoParts Kenya database from Replit PostgreSQL to Supabase while maintaining data integrity and application functionality.

## Pre-Migration Checklist

- [ ] Verify Replit PostgreSQL database is seeded with 150 products
- [ ] Confirm all products meet minimum price requirement (≥KES 10,000)
- [ ] Test application with `USE_POSTGRES=true` locally
- [ ] Backup current database
- [ ] Create Supabase project
- [ ] Note Supabase connection credentials

## Migration Strategy

### Option 1: Fresh Migration (Recommended)

Start with the 150-product curated dataset from Replit PostgreSQL.

**Advantages:**
- Clean, high-quality data
- All products meet business requirements
- Complete SEO metadata
- Optimized for Kenyan market

**Steps:**

1. **Export Schema**
```bash
# Export only the schema structure
pg_dump $DATABASE_URL --schema-only > schema.sql
```

2. **Export Data**
```bash
# Export all data
pg_dump $DATABASE_URL --data-only > data.sql

# Or export specific tables
pg_dump $DATABASE_URL --data-only -t brands -t categories -t subcategories -t products -t product_images > product_data.sql
```

3. **Import to Supabase**
```bash
# Replace with your Supabase connection string
SUPABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"

# Import schema
psql $SUPABASE_URL -f sql/002_enhanced_schema.sql

# Import data
psql $SUPABASE_URL -f data.sql
```

4. **Verify Migration**
```bash
# Check product count
psql $SUPABASE_URL -c "SELECT COUNT(*) FROM products;"
# Expected: 150

# Verify price compliance
psql $SUPABASE_URL -c "SELECT COUNT(*) FROM products WHERE price < 10000;"
# Expected: 0

# Check images
psql $SUPABASE_URL -c "SELECT COUNT(*) FROM product_images;"
# Expected: ~450
```

### Option 2: Hybrid Migration

Combine Replit's 150 products with CSV data for a larger catalog.

**Steps:**

1. Start with fresh Supabase database (Option 1)
2. Bulk import additional products from CSV:
```typescript
// Use scripts/import-csvs.ts
// Modify to connect to Supabase instead of Replit
```

3. Ensure all imported products have:
   - Unique slugs
   - SEO metadata
   - Proper prices (≥KES 10,000 for premium items)

## Application Configuration

### Update Connection String

**Development (.env):**
```bash
# Replit PostgreSQL (current)
DATABASE_URL=postgresql://[replit-connection]

# Supabase (after migration)
DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
```

### Environment Variables

Set these in Supabase project settings:
- `DATABASE_URL` - Full connection string
- `USE_POSTGRES` - Set to `true` to use database

### Application Code Changes

No code changes required! The application uses the same `PostgresStorage` class for both Replit and Supabase since both are PostgreSQL databases.

## Schema Compatibility

The enhanced schema (`sql/002_enhanced_schema.sql`) is fully compatible with Supabase:

- ✅ Standard PostgreSQL data types
- ✅ Foreign key constraints with CASCADE/SET NULL
- ✅ Check constraints for data validation
- ✅ Indexes for performance
- ✅ UUID support for product_images
- ✅ Full-text search indexes
- ✅ Timestamp triggers

## Row Level Security (RLS)

After migration, enable RLS for security:

```sql
-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON blog_categories FOR SELECT USING (true);

-- User-specific cart access
CREATE POLICY "Users can view their own carts" ON carts 
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('request.headers')::json->>'session-id');
  
CREATE POLICY "Users can manage their cart items" ON cart_items 
  FOR ALL USING (cart_id IN (SELECT id FROM carts WHERE auth.uid() = user_id OR session_id = current_setting('request.headers')::json->>'session-id'));

-- User-specific order access
CREATE POLICY "Users can view their own orders" ON orders 
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('request.headers')::json->>'session-id');
  
CREATE POLICY "Users can view their order items" ON order_items 
  FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE auth.uid() = user_id OR session_id = current_setting('request.headers')::json->>'session-id'));
```

## Post-Migration Testing

### Automated Tests

```bash
# Test database connection
tsx scripts/test-supabase-connection.ts

# Verify data integrity
tsx scripts/verify-migration.ts
```

### Manual Verification

1. **Product Listing**
   - Visit `/products`
   - Verify products load
   - Test filters and search

2. **Product Details**
   - Click on a product
   - Verify all images load
   - Check price, description, metadata

3. **Cart Functionality**
   - Add items to cart
   - Update quantities
   - Remove items

4. **Checkout**
   - Create test order
   - Verify order confirmation

## Rollback Plan

If migration fails:

```bash
# 1. Note the issue
# 2. Drop Supabase tables
psql $SUPABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Revert DATABASE_URL to Replit
export DATABASE_URL=[replit-connection]

# 4. Application continues with Replit PostgreSQL
```

## Performance Optimization

After migration to Supabase:

1. **Enable Connection Pooling**
   - Use Supabase's built-in pooler
   - Connection string: `postgresql://postgres:[password]@[project-ref].pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **Analyze Query Performance**
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time, total_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

3. **Add Missing Indexes**
```sql
-- Add indexes based on actual query patterns
CREATE INDEX idx_products_custom ON products(custom_field) WHERE condition;
```

## Maintenance

### Backup Strategy

Supabase provides automatic backups, but also:

```bash
# Weekly manual backup
pg_dump $SUPABASE_URL > backups/autoparts_$(date +%Y%m%d).sql
```

### Data Updates

To add/update products:

1. Use Supabase Dashboard SQL Editor
2. Or connect via application API
3. Maintain data quality standards:
   - Prices ≥ KES 10,000
   - Complete SEO metadata
   - 2-4 images per product

## Support

For migration issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Review migration logs
3. Verify schema compatibility
4. Test with small dataset first

## Timeline

Recommended migration timeline:

| Phase | Duration | Activities |
|-------|----------|------------|
| Preparation | 1 day | Backup, Supabase setup, testing |
| Migration | 2-4 hours | Schema import, data import, verification |
| Testing | 1 day | Full application testing, RLS setup |
| Deployment | 1 hour | Update production DATABASE_URL |

Total: 2-3 days including buffer time.
