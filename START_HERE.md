# 🚀 START HERE - AutoParts Kenya Setup Guide

**🔴 CRITICAL: READ THIS IMMEDIATELY IF YOU'RE A NEW AGENT!**

This guide will get you from zero to working database in 5 minutes.

---

## 🚨 IMMEDIATE FIRST STEPS (DO THIS NOW!)

### One-Command Setup (Recommended)

```bash
# This automatically checks if database exists and sets it up if needed
tsx scripts/setup-database.ts

# Or for all 3,200 products (takes 2-3 minutes)
# tsx scripts/setup-database.ts --full
```

This script will:
1. ✅ Check if database schema exists
2. ✅ Create schema if needed (15 tables)
3. ✅ Import 600 products + images (or 3,200 with --full)
4. ✅ Verify everything is ready

**Expected output:**
```
🎉 DATABASE SETUP COMPLETE!
✅ Products in database: 600
✅ API endpoints ready
✅ Server can be started with: npm run dev
```

### Manual Setup (Alternative)

<details>
<summary>Click to expand manual setup steps</summary>

**Step 1: Check if Database Exists**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;" 2>&1
```

**Step 2: Create Schema (if needed)**
```bash
tsx scripts/create-schema.ts
```

**Step 3: Import Data**
```bash
tsx scripts/import-csvs.ts          # 600 products
tsx scripts/import-csvs.ts --full   # 3,200 products
```

</details>

### Verify Everything Works

```bash
# Test API
curl http://localhost:5000/api/products?limit=2
# Should return JSON with product data
```

**If API returns data: ✅ YOU'RE READY TO BUILD!**

### Step 5: What's Included After Setup

✅ **Database:** 600 products (or 3,200 if you used --full)
✅ **API endpoints:** All returning real data
✅ **Server:** Running on port 5000
✅ **Homepage:** Fetches categories and products from database via TanStack Query
✅ **Real categories** display on homepage (scroll down to see)
✅ **Real featured products** display on homepage (scroll down to see)

### Step 6: What to Build Next

⚠️ **Next Priority:** Authentication, cart functionality, order management (database schemas already exist)
⚠️ **Also Needed:** Product listing page, product detail page, search functionality

---

## 📝 Important Notes

### About the 600-Product Import Strategy

**Why 600 products initially?**
- Importing all 3,200 products can cause timeouts
- 600 products provides enough data for development
- Remaining 2,600 products stay in CSV files for later

**How to add more products later:**
```bash
# Import all 3,200 products (may take 2-3 minutes)
tsx scripts/import-csvs.ts --full
```

The CSV files contain:
- 3,200 products total
- 6,454 product images
- All properly linked with foreign keys

### Database Persistence & New Environments

**⚠️ CRITICAL FOR NEW AGENTS:**

**Q: Does the database persist?**
A: Yes, within the SAME Replit environment. But NEW agents get a FRESH environment.

**Q: What does this mean for me as a new agent?**
A: You MUST run the setup script first:
```bash
tsx scripts/setup-database.ts
```

**Q: Why is this needed?**
- Each Replit environment has its own PostgreSQL instance
- When a new agent starts, the environment is fresh (no data)
- The CSV files are in the repo, so data can be imported instantly
- After setup, data persists in YOUR environment

**Q: Will I lose data between sessions?**
- NO - data persists within the same environment
- YES - if you get a completely new Replit environment

**The setup script handles everything automatically** - it checks if data exists and only imports if needed.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Status](#current-status)
3. [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
4. [Database Architecture](#database-architecture)
5. [File Structure](#file-structure)
6. [API Endpoints](#api-endpoints)
7. [Frontend Structure](#frontend-structure)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Additional Documentation](#additional-documentation)

---

## 🎯 Project Overview

**AutoParts Kenya** is a production-grade e-commerce catalog system for the Kenyan auto parts market featuring:
- 3,200+ auto parts across 10 categories
- Vehicle-specific search (make, model, year)
- Product images with gallery support
- Brand filtering and category browsing
- Full-text search capabilities

**Tech Stack:**
- **Frontend:** React + TypeScript + TanStack Query + Shadcn UI + Tailwind
- **Backend:** Node.js + Express + PostgreSQL
- **Database:** PostgreSQL (local dev) / Supabase (production)
- **Routing:** Wouter (client-side)

---

## ✅ Current Status

### What's Working ✅
- ✅ PostgreSQL database with complete schema (15 tables)
- ✅ **600 products** imported from CSV (2,600 more available to import)
- ✅ 1,200 product images with ordering
- ✅ 10 brands, 10 categories, 47 subcategories
- ✅ API endpoints functional and returning real data
- ✅ Server running on port 5000
- ✅ **Homepage fetches categories and products from API**
- ✅ **Real data displays on homepage**

### What Needs Work ⚠️
- ⚠️ No product listing page yet (catalog page)
- ⚠️ No product detail page
- ⚠️ Shopping cart not implemented (schema exists)
- ⚠️ User authentication not implemented (schema exists)
- ⚠️ Order management not implemented (schema exists)
- ⚠️ Search functionality not implemented

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Verify Database Connection

```bash
# Check if database is accessible
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"

# Expected output: 3200 (or 600 if using limited dataset)
```

### Step 2: Verify API Endpoints

```bash
# Test products endpoint
curl http://localhost:5000/api/products?limit=5

# Test categories endpoint
curl http://localhost:5000/api/categories

# Test brands endpoint
curl http://localhost:5000/api/brands
```

**Expected:** All endpoints should return JSON data, not empty arrays.

### Step 3: Check Server Status

```bash
# Server should be running on port 5000
# Check the "Start application" workflow in Replit
```

### Step 4: Load Homepage

Open the webview - you should see:
- ✅ Header with search bar
- ✅ Hero section with warehouse image
- ✅ **Real categories from database**
- ✅ **Real featured products from database**

**If you see "Loading products..." briefly, that's normal! The page fetches from the API.**

---

## 🗄️ Database Architecture

### Connection Details

```typescript
// Environment variables (auto-provided by Replit)
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

### Schema Overview

```
📊 CATALOG TABLES (using INTEGER IDs)
├── brands (id: INTEGER)
│   └── 10 records: Bosch, Denso, NGK, Castrol, etc.
│
├── categories (id: INTEGER)
│   └── 10 records: Engine Parts, Brakes, Filters, etc.
│
├── subcategories (id: INTEGER, FK: category_id)
│   └── 47 records: various auto part types
│
├── products (id: INTEGER, FKs: brand_id, category_id, subcategory_id)
│   ├── 3,200 records (or 600 in limited mode)
│   ├── Fields: name, price, vehicle_make, vehicle_model, year_range
│   ├── OEM part numbers for cross-reference
│   └── Full-text search vector (tsvector)
│
└── product_images (id: UUID, FK: product_id INTEGER)
    ├── 6,454 records
    └── Ordered by display_order

📦 E-COMMERCE TABLES (ready for implementation)
├── users (id: SERIAL)
├── carts (id: SERIAL)
├── cart_items (id: SERIAL)
├── orders (id: SERIAL)
└── order_items (id: SERIAL)

📝 CONTENT TABLES (ready for implementation)
├── blog_categories (id: SERIAL)
└── blog_posts (id: SERIAL)
```

### Important Notes

1. **ID Types:** Catalog tables use INTEGER IDs (matching CSV data)
2. **Product Images:** Use UUID for id, but product_id is INTEGER
3. **Indexes:** Full-text search, vehicle filtering, price range all indexed
4. **No UUIDs in catalog:** This was a conscious design choice to match CSV data

### Quick Database Queries

```sql
-- View sample products with joins
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

-- Count products per category
SELECT 
    c.name,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY product_count DESC;

-- Search products
SELECT id, name, price, vehicle_make 
FROM products 
WHERE search_vector @@ plainto_tsquery('english', 'brake pad')
LIMIT 20;
```

---

## 📁 File Structure

```
autoparts-kenya/
│
├── 📄 START_HERE.md          ← YOU ARE HERE
├── 📄 replit.md              ← Project overview & architecture
│
├── 📂 client/                 ← React Frontend
│   ├── src/
│   │   ├── components/       ← UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ui/           ← Shadcn components
│   │   ├── pages/            ← Page components
│   │   │   ├── Home.tsx      ⚠️ Currently uses mock data
│   │   │   └── not-found.tsx
│   │   ├── lib/
│   │   │   └── queryClient.ts ← TanStack Query config
│   │   └── App.tsx           ← Main app & routing
│
├── 📂 server/                 ← Express Backend
│   ├── index.ts              ← Server entry point
│   ├── routes.ts             ← API endpoints
│   ├── storage.ts            ← PostgreSQL storage layer
│   └── vite.ts               ← Vite dev server integration
│
├── 📂 shared/                 ← Shared TypeScript types
│   └── schema.ts             ← Database schema & Zod validation
│
├── 📂 sql/                    ← Database migrations
│   └── 001_complete_schema.sql ← Complete schema creation
│
├── 📂 scripts/                ← Utility scripts
│   ├── import-csvs.ts        ← Import CSV data to database
│   └── (future: migrate-to-supabase.ts)
│
├── 📂 attached_assets/        ← CSV data files
│   ├── auto_parts_dataset_brands_*.csv
│   ├── auto_parts_dataset_categories_*.csv
│   ├── auto_parts_dataset_subcategories_*.csv
│   ├── auto_parts_dataset_products_*.csv
│   └── auto_parts_dataset_product_images_*.csv
│
└── 📂 docs/                   ← Documentation
    ├── DATABASE_SETUP.md     ← Database setup guide
    ├── SUPABASE_MIGRATION.md ← Production migration
    └── QUICK_REFERENCE.md    ← Developer commands
```

---

## 🔌 API Endpoints

### Product Endpoints

```typescript
// Get all products (with pagination)
GET /api/products?limit=24&offset=0
Response: { data: Product[], total: number }

// Get products by category
GET /api/products?category_id=1&limit=24
Response: { data: Product[], total: number }

// Get products by brand
GET /api/products?brand_id=2&limit=24
Response: { data: Product[], total: number }

// Filter by vehicle
GET /api/products?vehicle_make=Toyota&vehicle_model=Corolla
Response: { data: Product[], total: number }

// Price range filter
GET /api/products?min_price=1000&max_price=5000
Response: { data: Product[], total: number }

// Search products
GET /api/search?q=brake%20pad
Response: { data: Product[], total: number }

// Get single product
GET /api/products/:id
Response: Product | { error: string }
```

### Category & Brand Endpoints

```typescript
// Get all categories
GET /api/categories
Response: Category[]

// Get all brands
GET /api/brands
Response: Brand[]
```

### TypeScript Types

```typescript
interface Product {
  id: number;
  name: string;
  price: string; // Numeric as string
  vehicle_make: string | null;
  vehicle_model: string | null;
  year_range: string | null;
  brand_id: number;
  category_id: number;
  subcategory_id: number | null;
  engine_size: string | null;
  oem_part_number: string | null;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  available: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon_name: string | null;
  created_at: Date;
  updated_at: Date;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
}
```

---

## 🎨 Frontend Structure

### Current State

The homepage (`client/src/pages/Home.tsx`) currently uses **hardcoded mock data**:

```typescript
// ❌ CURRENT (Mock Data)
const categories = [
  { icon: Wrench, name: "Engine Parts", count: 245 },
  // ... hardcoded
];

const featuredProducts = [
  {
    id: "1",
    name: "Castrol EDGE 5W-30 Engine Oil",
    // ... hardcoded
  },
];
```

### Current Implementation (COMPLETED ✅)

```typescript
// ✅ NOW IMPLEMENTED (Home.tsx)
import { useQuery } from '@tanstack/react-query';

function Home() {
  // Fetch categories from API
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch 6 products for featured section
  const { data: productsResponse, isLoading: productsLoading } = useQuery<{ data: Product[], total: number }>({
    queryKey: ['/api/products?limit=6'],
  });

  // Categories mapped with icons and product counts
  const categories = categoriesData.map((cat) => ({
    icon: CATEGORY_ICONS[cat.name] || Wrench,
    name: cat.name,
    count: productsResponse?.data?.filter((p) => p.category_id === cat.id).length || 0,
    id: cat.id,
  }));

  // Featured products from database
  const featuredProducts = productsResponse?.data || [];
}
```

**Status:** ✅ Home.tsx now displays real data from the database!

### React Query Configuration

TanStack Query is already configured in `client/src/lib/queryClient.ts`:

```typescript
// Default fetcher is set up - just pass queryKey
useQuery({
  queryKey: ['/api/products'], // This automatically fetches from this URL
});

// For mutations
const mutation = useMutation({
  mutationFn: async (data) => {
    return apiRequest('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
  },
});
```

---

## 🛠️ Common Tasks

### Task 1: Connect Homepage to Real Data

**File:** `client/src/pages/Home.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch products for featured section
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { limit: 6 }],
  });

  const featuredProducts = productsResponse?.data || [];

  // Calculate product counts per category
  const categoryWithCounts = categories.map(cat => ({
    ...cat,
    count: productsResponse?.data?.filter(p => p.category_id === cat.id).length || 0
  }));

  if (categoriesLoading || productsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... rest of component */}
    </div>
  );
}
```

### Task 2: Create Product Listing Page

**File:** `client/src/pages/Products.tsx` (new file)

```typescript
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';

export default function Products() {
  const [, params] = useRoute('/category/:categoryId');
  
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['/api/products', { category_id: params?.categoryId }],
  });

  // Display products in grid
}
```

### Task 3: Import Limited Dataset (600 Products)

**File:** `scripts/import-csvs.ts`

Modify the import to load only 600 products initially:

```typescript
// In importProducts function
const limitedProducts = allProducts.slice(0, 600);
await importInBatches(limitedProducts, insertProduct, 100);
```

The remaining products stay in CSV for later import.

### Task 4: Add More Products Later

```bash
# Modify scripts/import-csvs.ts to skip first 600, import next batch
tsx scripts/import-csvs.ts --offset=600 --limit=600
```

---

## 🐛 Troubleshooting

### Problem: API Returns Empty Data

```bash
# Check if database has data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"

# If zero, run import
tsx scripts/import-csvs.ts

# Restart server
# Use the workflow restart in Replit UI
```

### Problem: Frontend Shows Mock Data

**Solution:** The Home.tsx needs to be updated to use `useQuery` instead of hardcoded arrays. This is the current blocker.

### Problem: "Cannot find module '@/...' "

**Solution:** Path aliases are configured in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./client/src/*"],
    "@assets/*": ["./attached_assets/*"]
  }
}
```

### Problem: Database Connection Failed

```bash
# Verify environment variables exist
env | grep DATABASE_URL
env | grep PG

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Problem: CORS Errors

The Vite server is configured to proxy API requests. No CORS issues should occur in development.

---

## 📚 Additional Documentation

### Full Documentation

1. **START_HERE.md** (this file) - Quick setup and overview
2. **replit.md** - Complete project architecture
3. **docs/DATABASE_SETUP.md** - Database setup guide
4. **docs/SUPABASE_MIGRATION.md** - Production deployment
5. **docs/QUICK_REFERENCE.md** - Developer commands

### Key Concepts

**Storage Layer (`server/storage.ts`):**
- Uses PostgreSQL connection pool
- All database operations go through storage interface
- Type-safe with TypeScript
- Supports filtering, pagination, search

**Frontend Data Fetching:**
- TanStack Query for server state
- Automatic caching and invalidation
- Loading/error states built-in
- Optimistic updates ready

**Design System:**
- Shadcn UI components in `client/src/components/ui/`
- Tailwind CSS for styling
- Custom theme in `client/src/index.css`
- Responsive design patterns

---

## 🎯 Your First Tasks

### If Homepage Needs Fixing:

1. **Connect Categories to API**
   - File: `client/src/pages/Home.tsx`
   - Replace mock `categories` array with `useQuery({ queryKey: ['/api/categories'] })`
   - Calculate product counts from actual data

2. **Connect Featured Products to API**
   - File: `client/src/pages/Home.tsx`
   - Replace mock `featuredProducts` array with `useQuery({ queryKey: ['/api/products'] })`
   - Limit to 6 products for featured section

3. **Add Click Handlers**
   - CategoryCard should link to `/products?category_id=X`
   - ProductCard should link to `/product/:id`

### If Building New Features:

1. **Shopping Cart**
   - Tables exist: `carts`, `cart_items`
   - API endpoints needed in `server/routes.ts`
   - Frontend cart component needed

2. **User Authentication**
   - Table exists: `users`
   - Consider using Replit Auth integration
   - Session management via `express-session`

3. **Product Detail Page**
   - Create `client/src/pages/ProductDetail.tsx`
   - Fetch product by ID
   - Display images, specs, compatibility

---

## ⚡ Quick Reference Commands

```bash
# Start development
npm run dev

# Import database (600 products)
tsx scripts/import-csvs.ts

# Import database (all 3200 products)
tsx scripts/import-csvs.ts --full

# Access database
psql $DATABASE_URL

# Test API
curl http://localhost:5000/api/products?limit=5

# View logs
# Use the Replit workflow panel

# Check data counts
psql $DATABASE_URL -c "
SELECT 
    (SELECT COUNT(*) FROM brands) as brands,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM product_images) as images;
"
```

---

## 🚨 Critical Information

### DO NOT:
- ❌ Change database ID types (INTEGER → UUID or vice versa)
- ❌ Drop tables without backing up data
- ❌ Modify `DATABASE_URL` environment variable
- ❌ Edit Vite configuration unless absolutely necessary
- ❌ Add duplicate products (IDs are from CSV)

### DO:
- ✅ Read this guide completely before starting
- ✅ Test API endpoints before building frontend features
- ✅ Use TypeScript types from `shared/schema.ts`
- ✅ Follow Shadcn UI patterns for new components
- ✅ Test database queries in psql before adding to code
- ✅ Keep documentation updated as you build

---

## 🎓 Learning Resources

- **TanStack Query:** https://tanstack.com/query/latest
- **Wouter Routing:** https://github.com/molefrog/wouter
- **Shadcn UI:** https://ui.shadcn.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 📞 Support

If stuck:
1. Check this guide first
2. Review `replit.md` for architecture details
3. Check `docs/` folder for specific guides
4. Test API endpoints with curl
5. Check database with psql

---

**Last Updated:** November 8, 2025  
**Database:** PostgreSQL with 3,200 products (or 600 in limited mode)  
**Status:** API functional, frontend needs connection to real data

**NEXT STEP:** Go to `client/src/pages/Home.tsx` and connect it to the API! 🚀
