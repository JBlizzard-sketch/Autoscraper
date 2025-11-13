# Data Requirements for AutoParts Kenya

## Product Dataset Specifications

### Development Database (PostgreSQL)

The development database contains **150 high-quality automotive products** specifically curated for the Kenyan market.

#### Product Distribution

| Category | Products | Description |
|----------|----------|-------------|
| Brakes | ~35 | Brake pads, discs, calipers |
| Filters | ~42 | Oil, air, fuel, cabin filters |
| Suspension & Steering | ~28 | Shock absorbers, control arms, ball joints |
| Engine Parts | ~27 | Spark plugs, timing belts, gaskets |
| Electrical | ~18 | Batteries, alternators, starter motors |
| **Total** | **150** | |

#### Brand Distribution

- **12 Automotive Brands**
  - Kenyan Market: Toyota, Nissan, Subaru, Mitsubishi, Isuzu, Mazda, Honda, Suzuki
  - Parts Manufacturers: Bosch, Denso, NGK, Mann Filter

#### Price Requirements

| Requirement | Value |
|-------------|-------|
| Minimum Price | KES 10,000 |
| Maximum Price | ~KES 45,000 |
| Average Price | ~KES 15,000 |

**Price Distribution:**
- 30% in KES 10,000 - 25,000 range (budget-friendly)
- 40% in KES 25,000 - 60,000 range (mid-range)
- 30% in KES 60,000+ range (premium)

#### Vehicle Compatibility

Popular Kenyan vehicles are prioritized:

**Toyota Models:**
- Corolla, Fielder, Premio, Harrier
- Land Cruiser, Hilux, Vitz, Ractis

**Nissan Models:**
- X-Trail, Note, Tiida, Serena
- Wingroad, AD Van

**Other Makes:**
- Subaru: Impreza, Forester, Legacy, Outback, XV
- Mitsubishi: Pajero, Outlander, RVR, Lancer
- Isuzu: D-Max, MU-X, ELF Truck

Year Range: 2010-2025 (rolling 15-year window)

### Product Data Fields

Each product includes:

#### Core Fields (Required)
- `name` - Descriptive product name with vehicle compatibility
- `slug` - SEO-friendly URL slug (auto-generated, unique)
- `sku` - Stock keeping unit (format: AP-{subcategory}-{id})
- `price` - Product price in KES (≥10,000)
- `description` - Detailed product description (≥120 words)

#### Vehicle Compatibility
- `vehicle_make` - Manufacturer (Toyota, Nissan, etc.)
- `vehicle_model` - Specific model (Corolla, X-Trail, etc.)
- `year_range` - Compatible years (e.g., "2015-2020")
- `engine_size` - Engine displacement (e.g., "1.8L", "2.4L")

#### Classification
- `category_id` - Primary category
- `subcategory_id` - Specific subcategory
- `brand_id` - Parts manufacturer brand

#### Inventory & Logistics
- `stock_quantity` - Available units (10-60)
- `lead_time_days` - Delivery time in days (1-5)
- `warranty_months` - Warranty period (6-36 months)
- `available` - In-stock status (boolean)

#### SEO & Marketing
- `meta_title` - Page title for SEO (≤60 chars)
- `meta_description` - Meta description (120-155 chars)
- `oem_part_number` - Original equipment manufacturer number

#### Media
- `image_url` - Primary product image
- `product_images` - 2-4 additional images per product
  - Each with `alt_text` for accessibility
  - `source_attribution` for image credits

### Image Requirements

#### Quantity
- **2-4 images per product**
- Total: ~450 product images

#### Quality Standards
- Minimum resolution: 1600×1200 pixels
- Format: JPEG or PNG
- File size: < 500KB per image
- Source: Pexels or Unsplash (with attribution)

#### Image Types
1. **Primary**: Main product photo (clean background)
2. **Detail**: Close-up of key features
3. **Installation**: Product in use/installed
4. **Packaging**: Product packaging (optional)

### Production Database (CSV)

The production database uses existing CSV files:
- **3,200 products** for comprehensive catalog
- Legacy data structure (pre-migration)
- Hydrated with new fields via MemoryStorage compatibility layer

## Data Generation Process

### Automated Seeding

The `scripts/seed-dev-database.ts` script generates the 150-product dataset:

```bash
# Run the seeding script
tsx scripts/seed-dev-database.ts
```

**What it does:**
1. Inserts 12 brands
2. Creates 8 categories and 18 subcategories
3. Generates 150 products with:
   - Realistic vehicle compatibility
   - Proper price ranges (≥KES 10,000)
   - Complete SEO metadata
   - Inventory and warranty data
4. Creates 2-4 images per product (450+ total)
5. Validates data quality

### Quality Assurance Checks

After seeding, verify:

```sql
-- All products meet minimum price
SELECT COUNT(*) FROM products WHERE price < 10000;
-- Expected: 0

-- Product count is correct
SELECT COUNT(*) FROM products;
-- Expected: 150

-- All products have images
SELECT COUNT(DISTINCT product_id) FROM product_images;
-- Expected: 150

-- Average images per product
SELECT COUNT(*) / COUNT(DISTINCT product_id) FROM product_images;
-- Expected: 2-4
```

## Future: Supabase Migration

When migrating to Supabase:
1. Use the PostgreSQL 150-product dataset as base
2. Export via `pg_dump`
3. Import to Supabase with same schema
4. Optionally expand with additional products
5. Keep production CSV for backward compatibility

## Maintenance

### Adding New Products

When adding products manually:
1. Ensure price ≥ KES 10,000
2. Generate unique slug from name
3. Create SKU in format: `AP-{subcategory_id}-{id}`
4. Add complete SEO metadata
5. Include 2-4 high-quality images
6. Specify vehicle compatibility
7. Set realistic warranty and lead times
