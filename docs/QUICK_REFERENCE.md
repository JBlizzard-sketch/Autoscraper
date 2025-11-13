# Quick Reference - AutoParts Kenya

## Database Status

✅ **Fully operational** with PostgreSQL
- 3,200 products
- 6,454 product images
- 10 brands, 10 categories, 47 subcategories

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Import CSV data (already done)
tsx scripts/import-csvs.ts

# Access database
psql $DATABASE_URL

# Check data counts
psql $DATABASE_URL -c "
SELECT 
    (SELECT COUNT(*) FROM brands) as brands,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM product_images) as images;
"
```

### API Testing

```bash
# Get products
curl http://localhost:5000/api/products?limit=5

# Search products
curl http://localhost:5000/api/search?q=brake

# Get categories
curl http://localhost:5000/api/categories

# Get brands
curl http://localhost:5000/api/brands

# Get specific product
curl http://localhost:5000/api/products/1

# Filter by category
curl http://localhost:5000/api/products?category_id=1

# Filter by brand
curl http://localhost:5000/api/products?brand_id=2

# Filter by vehicle
curl http://localhost:5000/api/products?vehicle_make=Toyota&vehicle_model=Corolla
```

### Database Queries

```sql
-- View sample products
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

-- Check products per category
SELECT 
    c.name,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY product_count DESC;

-- Check products per brand
SELECT 
    b.name,
    COUNT(p.id) as product_count
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY product_count DESC;

-- Find products for specific vehicle
SELECT 
    name,
    price,
    vehicle_make,
    vehicle_model,
    year_range
FROM products
WHERE vehicle_make ILIKE '%Toyota%'
  AND vehicle_model ILIKE '%Corolla%'
LIMIT 20;
```

## File Structure

```
.
├── attached_assets/          # CSV data files
│   ├── auto_parts_dataset_brands_*.csv
│   ├── auto_parts_dataset_categories_*.csv
│   ├── auto_parts_dataset_subcategories_*.csv
│   ├── auto_parts_dataset_products_*.csv
│   └── auto_parts_dataset_product_images_*.csv
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   └── lib/             # Utilities
├── server/                   # Express backend
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # PostgreSQL storage layer
│   └── vite.ts              # Vite dev server
├── shared/                   # Shared types
│   └── schema.ts            # Database schema & types
├── sql/                      # SQL migrations
│   └── 001_complete_schema.sql
├── scripts/                  # Utility scripts
│   └── import-csvs.ts       # CSV import script
├── docs/                     # Documentation
│   ├── DATABASE_SETUP.md    # Database setup guide
│   ├── SUPABASE_MIGRATION.md # Migration guide
│   └── QUICK_REFERENCE.md   # This file
└── replit.md                # Project overview
```

## Environment Variables

```env
# Database (provided by Replit)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# App
PORT=5000
NODE_ENV=development
```

## Technology Stack

### Frontend
- React + TypeScript
- Wouter (routing)
- TanStack Query (data fetching)
- Shadcn UI + Radix UI
- Tailwind CSS

### Backend
- Node.js + Express
- PostgreSQL (pg driver)
- Drizzle ORM (types)
- CSV parsing

## Data Overview

### Categories (10)
1. Engine Parts
2. Suspension
3. Brakes
4. Transmission
5. Electrical
6. Filters
7. Fluids
8. Body Parts
9. Accessories
10. Tyres

### Brands (10)
1. Bosch
2. Denso
3. NGK
4. Castrol
5. Liqui Moly
6. Mobil
7. Toyota Genuine
8. Hyundai
9. Kia
10. Land Rover

### Products (3,200)
- Price range: ~KES 1,000 - 110,000
- Vehicle makes: Toyota, Mazda, Subaru, Hyundai, etc.
- OEM part numbers included
- Stock quantities: 0-50 units (randomized)

## Troubleshooting

### API returns empty data
```bash
# Restart the workflow
# Check logs: refresh_all_logs tool
# Verify database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"
```

### Database connection failed
```bash
# Check environment variables
env | grep DATABASE
env | grep PG

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Import script errors
```bash
# Verify CSV files exist
ls -lh attached_assets/*.csv

# Check database schema
psql $DATABASE_URL -c "\dt"

# Re-run import
tsx scripts/import-csvs.ts
```

## Documentation

- **Project Overview:** `replit.md`
- **Database Setup:** `docs/DATABASE_SETUP.md`
- **Supabase Migration:** `docs/SUPABASE_MIGRATION.md`
- **This Guide:** `docs/QUICK_REFERENCE.md`

## Next Steps

1. ✅ Database is ready with all data
2. ⏳ Test frontend product display
3. ⏳ Implement shopping cart functionality
4. ⏳ Add user authentication
5. ⏳ Migrate to Supabase for production
6. ⏳ Deploy to production (Vercel/Railway)

## Support

If you need help:
1. Check the documentation in `docs/`
2. Review the project overview in `replit.md`
3. Test API endpoints with curl commands above
4. Check database with SQL queries above
