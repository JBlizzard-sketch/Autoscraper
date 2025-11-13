# Database Setup Guide - AutoParts Kenya

This guide covers setting up the local PostgreSQL database for development and migrating to Supabase for production.

## Development Setup (Local PostgreSQL)

### Prerequisites

The Replit environment automatically provisions a PostgreSQL database when you use the database tools.

### Quick Start

The database is already set up with all data! But if you need to recreate it:

```bash
# 1. Create database (if not already created)
# This is done automatically by Replit

# 2. Run schema migration
psql $DATABASE_URL -f sql/001_complete_schema.sql

# 3. Import CSV data
tsx scripts/import-csvs.ts
```

### Data Summary

Your local database contains:
- **10 brands** (Bosch, Denso, NGK, Castrol, Liqui Moly, Mobil, Toyota Genuine, Hyundai, Kia, Land Rover)
- **10 categories** (Engine Parts, Suspension, Brakes, Transmission, Electrical, Filters, Fluids, Body Parts, Accessories, Tyres)
- **47 subcategories** (various auto part types)
- **3,200 products** with complete details
- **6,454 product images** with display ordering

### Database Schema

The schema uses **INTEGER IDs** (not UUIDs) for catalog tables to match your CSV data exactly:

```
Catalog Tables:
├── brands (id: INTEGER)
├── categories (id: INTEGER)
├── subcategories (id: INTEGER, FK: category_id)
├── products (id: INTEGER, FKs: brand_id, category_id, subcategory_id)
└── product_images (id: UUID, FK: product_id INTEGER)

E-commerce Tables:
├── users (id: SERIAL)
├── carts (id: SERIAL, FKs: user_id, session_id)
├── cart_items (id: SERIAL, FKs: cart_id, product_id)
├── orders (id: SERIAL)
└── order_items (id: SERIAL, FK: order_id)

Content Tables:
├── blog_categories (id: SERIAL)
└── blog_posts (id: SERIAL, FKs: category_id, author_id)
```

### Verifying Your Database

```bash
# Check record counts
psql $DATABASE_URL -c "
SELECT 
    (SELECT COUNT(*) FROM brands) as brands,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM product_images) as images;
"

# Test API endpoints
curl http://localhost:5000/api/products?limit=5
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/brands
```

### CSV Data Files

Your data is imported from these CSV files in `attached_assets/`:
- `auto_parts_dataset_brands_1762616065050.csv` (10 brands)
- `auto_parts_dataset_categories_1762616065048.csv` (10 categories)
- `auto_parts_dataset_subcategories_1762616065046.csv` (47 subcategories)
- `auto_parts_dataset_products_1762616065044.csv` (3,200 products)
- `auto_parts_dataset_product_images_1762616065042.csv` (6,454 images)

## Production Setup (Supabase Migration)

### Your Supabase Database

According to your requirements, your Supabase database already has:
- ✅ Brands (seeded)
- ✅ Categories (seeded)
- ✅ Subcategories (seeded)
- ⏳ Products (need to import)
- ⏳ Product Images (need to import)

### Migration Strategy

**Important:** Use the SQL scripts directly in Supabase SQL Editor to ensure clean migration.

#### Step 1: Create Missing Tables in Supabase

If you don't have the e-commerce and blog tables in Supabase yet:

```sql
-- Run sql/001_complete_schema.sql in Supabase SQL Editor
-- This will create all tables including e-commerce and blog tables
```

#### Step 2: Import Products & Images

You have two options:

**Option A: SQL Export (Recommended)**

1. Export products from local database:
```bash
psql $DATABASE_URL -c "COPY products TO STDOUT WITH CSV HEADER" > products_export.csv
```

2. Import in Supabase SQL Editor:
```sql
COPY products FROM '/path/to/products_export.csv' WITH CSV HEADER;
```

**Option B: Use Seed Script**

Modify `scripts/seed-supabase.ts` to point to your Supabase credentials:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Then use the existing import logic
```

### Environment Variables

**Local Development:**
```env
DATABASE_URL=postgresql://...  # Provided by Replit
PGHOST=...                     # Provided by Replit
PGPORT=...                     # Provided by Replit
PGUSER=...                     # Provided by Replit
PGPASSWORD=...                 # Provided by Replit
PGDATABASE=...                 # Provided by Replit
```

**Production (Supabase):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://...  # From Supabase connection pooler
```

### Code Changes for Production

The application is already dual-mode ready! It uses PostgreSQL connection pool that works with both:
- Local PostgreSQL (Replit database)
- Supabase PostgreSQL (via connection string)

No code changes needed - just update the `DATABASE_URL` environment variable.

### Deployment Checklist

- [ ] Verify Supabase database has all tables
- [ ] Import products CSV data (3,200 records)
- [ ] Import product_images CSV data (6,454 records)
- [ ] Update environment variables in deployment
- [ ] Test API endpoints in production
- [ ] Set up Row Level Security (RLS) policies if needed
- [ ] Configure database backups

## Troubleshooting

### API Returns Empty Data

If API endpoints return `{"data":[],"total":0}`, restart the server:

```bash
# Restart workflow in Replit
# or manually restart: npm run dev
```

### Database Connection Errors

Check your environment variables:
```bash
env | grep DATABASE_URL
env | grep PG
```

### Import Script Errors

If CSV import fails:
1. Check file paths in `scripts/import-csvs.ts`
2. Verify CSV files exist in `attached_assets/`
3. Check database connection with `psql $DATABASE_URL -c "SELECT NOW();"`

## Performance Optimization

The schema includes optimized indexes for:
- Full-text search on products and blog posts
- Vehicle filtering (make, model combinations)
- Price range queries
- Category and brand lookups
- Image ordering per product

Additional optimizations:
- Batch inserts (100 records per transaction)
- Connection pooling
- Prepared statement caching
- Updated_at triggers for cache invalidation

## Data Maintenance

### Adding New Products

```typescript
// Via API (once implemented)
POST /api/admin/products
{
  "name": "...",
  "price": "...",
  "brand_id": 1,
  "category_id": 2,
  // ...
}
```

### Backup & Restore

```bash
# Backup local database
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Next Steps

1. ✅ Local database is ready with all data
2. ⏳ Migrate products and images to your Supabase when ready
3. ⏳ Implement authentication (schema ready, code pending)
4. ⏳ Add shopping cart functionality (schema ready, code pending)
5. ⏳ Enable blog/content system (schema ready, code pending)
