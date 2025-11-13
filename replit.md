# AutoParts Kenya E-Commerce Platform

## 🚨 FOR NEW AGENTS: Read START_HERE.md First!

**CRITICAL:** If you're a new agent, read `START_HERE.md` before doing ANYTHING else.

**Quick Start for New Environments:**
```bash
tsx scripts/setup-database.ts
```

This will create the database schema and import 600 products in ~2 minutes.

---

## Overview

AutoParts Kenya is a production-grade e-commerce platform for the Kenyan auto parts market. The platform features **101 products** with **30 real high-quality stock images**, vehicle-specific search, and WhatsApp-first checkout. Built with React, Express, and PostgreSQL-ready schema using **MemoryStorage** for development (easily switchable to Supabase). The system handles auto parts inventory with complex compatibility requirements (vehicle make/model/year) and provides full product catalog with filters, shopping cart, and checkout.

## Recent Changes (November 2025)

**Real Images Integration Complete (Agent 3):**
- ✅ Downloaded 30 high-quality stock images from Pexels (auto parts)
- ✅ Created `scripts/product-image-map.json` for image-to-product mappings
- ✅ Implemented `applyRealProductImages()` in MemoryStorage (boot-time image application)
- ✅ Added Express static middleware: `app.use('/assets', express.static('attached_assets'))`
- ✅ Added `GET /api/products/:id/images` endpoint with validation
- ✅ Fixed LSP errors (removed `alt_text` field from ProductImage)
- ✅ **Architect reviewed and approved** all changes
- ✅ All pages verified working: Home, Products, ProductDetail, Cart, Checkout, Blog
- ✅ Real images displaying correctly across all pages
- ✅ Cart and checkout functionality verified working
- 📄 Created comprehensive HANDOVER.md for next agent

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack React Query for server state
- **UI Components:** Radix UI primitives with shadcn/ui design system
- **Styling:** Tailwind CSS with custom design tokens

**Design System:**
- Custom theme based on "new-york" shadcn style
- HSL-based color system with CSS variables for theming
- Consistent spacing primitives (2, 4, 8, 12, 16 Tailwind units)
- Responsive grid patterns (2/3/4 columns for products, 1/2/3 for categories)
- Typography hierarchy using Inter/Work Sans with JetBrains Mono for technical data

**Key UI Patterns:**
- Sticky header with prominent search (60% width on desktop)
- Vehicle selector (Make → Model → Year dropdowns)
- Filter sidebar (280px fixed width on desktop, drawer on mobile)
- Category cards with icon + name + count
- Product cards with image gallery, brand badges, OEM numbers, pricing
- Hover elevation effects for interactive elements

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express (serverless-ready)
- **Database:** Supabase PostgreSQL (production database)
- **Database Client:** PostgreSQL Pool for database operations + Supabase client for Auth/Realtime
- **Session Management:** Session-based (preparing for Supabase Auth migration)
- **Deployment:** Configured for Netlify/Vercel serverless functions

**API Design:**
- RESTful endpoints under `/api/*` prefix
- Product listing with filtering and pagination (`GET /api/products`)
- Single product retrieval (`GET /api/products/:id`)
- Full-text search (`GET /api/search?q=query`)
- Category and brand listing endpoints
- Cart management (user-specific with session isolation)

**Storage Interface:**
- PostgreSQL storage layer (`server/storage.ts`) using native `pg` Pool
- Works with Supabase PostgreSQL endpoint (via DATABASE_URL)
- Supabase client (`@supabase/supabase-js`) for future Auth and Realtime features
- Support for complex filtering (search, category, brand, vehicle compatibility, price range)
- Pagination with configurable page size (default 24 items)
- Connection pooling for optimal serverless performance

### Data Architecture

**Database Schema (Supabase PostgreSQL):**

**Catalog Tables (Integer IDs from CSV):**
- `brands` (id: INTEGER) - Auto parts brands (Bosch, Denso, etc.)
- `categories` (id: INTEGER) - Main categories (Engine, Brakes, etc.)
- `subcategories` (id: INTEGER) - Subcategories within categories
- `products` (id: INTEGER) - 600+ products with:
  - Foreign keys to brand, category, subcategory
  - Vehicle compatibility (make, model, year_range, engine_size)
  - OEM part numbers for cross-referencing
  - Price tracking (numeric KES with 2 decimal precision)
  - Stock availability and lead time
  - Full-text search vector (tsvector) for fast search
  - SEO fields (slug, meta_title, meta_description)
- `product_images` (id: UUID, product_id: INTEGER) - Multiple images per product

**E-commerce Tables (UUID IDs for Supabase):**
- `carts` (id: UUID, user_id: UUID) - Shopping carts (session or auth.users)
- `cart_items` (id: UUID, cart_id: UUID) - Cart line items
- `orders` (id: UUID, user_id: UUID) - Orders with WhatsApp integration fields
- `order_items` (id: UUID, order_id: UUID) - Order line items

**Content Tables (UUID IDs):**
- `blog_posts` (id: UUID, author_id: UUID) - Automotive content
- `blog_categories` (id: UUID) - Blog categories

**Supabase Auth:**
- Uses `auth.users` table (managed by Supabase)
- No local users table needed
- Row Level Security policies enforce access control

**Data Normalization Strategy:**
- CSV import process normalizes supplier/brand/category names
- Slug generation from product names (URL-friendly)
- INITCAP for proper name capitalization
- Whitespace trimming across all text fields
- Foreign key integrity validation before inserts

**Row Level Security (RLS):**
- Public read access to catalog data (products, categories, brands)
- User-specific isolation for carts and orders
- Admin-only access for audit logs and price history

### Data Import Pipeline

**CSV Processing:**
- Parser: `csv-parse` library for CSV ingestion
- Dynamic schema adaptation (detects headers, adds missing columns)
- Idempotent seeding (safe to re-run without duplicates)
- Error handling with detailed logging to `seed-reports/`

**Seed Scripts:**
- `scripts/csv-analysis.ts` - Analyzes CSV structure and data quality
- `scripts/seed-supabase.ts` - Main seeding orchestrator
- `scripts/run-sql-migrations.ts` - Database schema setup helper

**Data Quality:**
- Foreign key validation (only insert products with valid brand_id/subcategory_id)
- Image validation (only link images to existing products)
- Normalization rules applied at import time
- Future-proof design for incremental CSV uploads

## Database Status

**Current Setup:** ✅ **Fully Operational with MemoryStorage**

The in-memory storage is loaded with CSV data on boot:
- ✅ **101 products** across 10 categories
- ✅ **223 product image records** (30 with real images)
- ✅ **47 subcategories** for detailed filtering
- ✅ **10 brands** (Toyota, Mazda, Nissan, Hyundai, etc.)
- ✅ **30 real high-quality stock images** from Pexels
- ✅ All API endpoints returning real data
- ✅ Session-based cart working
- ✅ WhatsApp checkout integration
- ✅ Blog system with 10 posts

**Quick Access:**
```bash
# Test API endpoints
curl http://localhost:5000/api/products?limit=5
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/brands

# Access database directly
psql $DATABASE_URL

# Import data (if needed)
tsx scripts/import-csvs.ts
```

**Documentation:**
- Database setup: `docs/DATABASE_SETUP.md`
- Supabase migration: `docs/SUPABASE_MIGRATION.md`

## External Dependencies

### Third-Party Services

**PostgreSQL Database:**
- **Local Development:** Replit-provisioned PostgreSQL database
- **Production:** Supabase PostgreSQL (migration ready)
- Uses native `pg` driver with connection pooling
- Dual-mode architecture works with both environments

**Database Connection:**
- Direct PostgreSQL connection via `DATABASE_URL` environment variable
- Connection pooling for optimal performance
- Environment variables: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- Production: Supabase connection string (migration guide available)

### NPM Dependencies

**Core Runtime:**
- `express` - Web server framework
- `drizzle-orm` - Type-safe ORM
- `@neondatabase/serverless` - PostgreSQL driver with serverless support

**Frontend Libraries:**
- `react`, `react-dom` - UI framework
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `@radix-ui/*` - Headless UI components (20+ packages)
- `tailwindcss` - Utility-first CSS

**Utilities:**
- `csv-parse` - CSV file parsing
- `zod` - Runtime type validation
- `date-fns` - Date manipulation
- `nanoid` - Unique ID generation

**Development Tools:**
- `vite` - Build tool and dev server
- `typescript` - Type checking
- `drizzle-kit` - Database migrations
- `esbuild` - Production bundling

### Payment Integration (Planned)

**M-Pesa:**
- Table: `mpesa_transactions`
- Integration status: Schema ready, implementation pending

### Messaging Integration (Planned)

**WhatsApp:**
- Table: `whatsapp_orders`
- Use case: Alternative checkout flow for users preferring WhatsApp
- Integration status: Schema ready, implementation pending

### Asset Management

**Static Assets:**
- Product images stored as URLs in database
- Generated placeholder images in `attached_assets/generated_images/`
- Hero images, category icons, product photos