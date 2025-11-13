# Environment Configuration Guide

## Overview

AutoParts Kenya supports two storage backends for development and production:

1. **MemoryStorage (CSV)** - Default, uses CSV files for quick demo/production
2. **PostgresStorage (Database)** - Development, uses Replit PostgreSQL database

## Switching Between Environments

### Using CSV Data (Default - Production)

The application uses CSV files from `attached_assets/` by default. No configuration needed.

```bash
# Start the application (defaults to CSV)
npm run dev
```

**Features:**
- ✅ Fast startup (< 1 second)
- ✅ 3,200 products from CSV files
- ✅ No database connection required
- ✅ Perfect for production deployments

### Using PostgreSQL Database (Development)

Set the `USE_POSTGRES` environment variable to use the PostgreSQL database with 150 curated products.

```bash
# Option 1: Set environment variable
export USE_POSTGRES=true
npm run dev

# Option 2: Inline environment variable
USE_POSTGRES=true npm run dev
```

**Features:**
- ✅ 150 high-quality Kenyan automotive products
- ✅ All prices ≥ KES 10,000
- ✅ Complete SEO metadata
- ✅ 2-4 images per product
- ✅ Realistic inventory and warranty data

## Database Setup (First Time)

If the PostgreSQL database is empty, run the seed script:

```bash
# 1. Create the schema
psql $DATABASE_URL -f sql/002_enhanced_schema.sql

# 2. Seed with 150 products
tsx scripts/seed-dev-database.ts

# 3. Verify the data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"
```

## Environment Variables

### Automatically Set by Replit
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual connection params

### Application Variables
- `USE_POSTGRES` - Set to `true` to use PostgreSQL instead of CSV
- `NODE_ENV` - Set to `development` or `production`

## Data Comparison

| Feature | CSV (MemoryStorage) | PostgreSQL |
|---------|-------------------|------------|
| Products | 3,200 | 150 |
| Quality | Auto-generated | Hand-curated |
| Price Range | Various | ≥ KES 10,000 |
| SEO Metadata | Auto-generated | Optimized |
| Startup Time | < 1s | < 2s |
| Best For | Production, Demo | Development, Testing |

## Troubleshooting

### Application uses wrong storage

```bash
# Check current storage
# Look for the console output when starting:
# "📦 Using MemoryStorage with CSV data" OR
# "📦 Using PostgresStorage with database connection"
```

### Database connection fails

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Prices below minimum

```bash
# Verify all prices meet minimum requirement
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products WHERE price < 10000;"
# Should return: 0
```

## Best Practices

1. **Development**: Use PostgreSQL (`USE_POSTGRES=true`) for realistic data
2. **Production**: Use CSV (default) for fast deployments and large catalog
3. **Testing**: Test with both backends to ensure compatibility
4. **Migration**: When ready for Supabase, use the 150-product PostgreSQL dataset
