-- sql/000_create_schema.sql
-- Production-grade Supabase schema for auto-parts e-commerce platform
-- Idempotent schema creation - safe to run multiple times

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
-- Stores supplier/vendor information
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  contact JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Supplier/vendor companies that provide parts';
COMMENT ON COLUMN suppliers.contact IS 'Contact information (phone, email, address) stored as JSON';

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
-- Stores brand names (Toyota, Denso, NGK, etc)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE brands IS 'Part manufacturers and brands';

-- ============================================================================
-- CATEGORIES TABLE (Hierarchical)
-- ============================================================================
-- Main and subcategories with parent-child relationships
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  icon_name TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories with hierarchical structure (parent_id for subcategories)';
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- IMAGES TABLE
-- ============================================================================
-- Stores product images
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  alt TEXT,
  provider TEXT,
  width INTEGER,
  height INTEGER,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE images IS 'Product and category images';
CREATE INDEX IF NOT EXISTS idx_images_url ON images(url);

-- ============================================================================
-- PRODUCTS TABLE (Main)
-- ============================================================================
-- Core products table with full-text search support
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  oem_part_number TEXT,
  description TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  available BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  main_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  year_range TEXT,
  engine_size TEXT,
  image_urls TEXT[] DEFAULT '{}'::TEXT[],
  product_url TEXT,
  extra_attributes JSONB DEFAULT '{}'::JSONB,
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Main products catalog with vehicle compatibility and search support';
COMMENT ON COLUMN products.search_tsv IS 'Full-text search vector (auto-updated by trigger)';
COMMENT ON COLUMN products.extra_attributes IS 'Flexible JSONB field for additional product properties';

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_oem ON products(oem_part_number);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON products(main_category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_vehicle_make ON products(vehicle_make);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_image_urls_gin ON products USING GIN(image_urls);
CREATE INDEX IF NOT EXISTS idx_products_extra_gin ON products USING GIN(extra_attributes);
CREATE INDEX IF NOT EXISTS idx_products_search_gin ON products USING GIN(search_tsv);

-- Full-text search trigger function
CREATE OR REPLACE FUNCTION products_tsv_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', COALESCE(NEW.product_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.oem_part_number, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.vehicle_make || ' ' || NEW.vehicle_model, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_tsv ON products;
CREATE TRIGGER trg_products_tsv 
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_tsv_trigger();

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to products
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PRODUCT ATTRIBUTES TABLE
-- ============================================================================
-- Flexible key-value attributes for products
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  value_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE product_attributes IS 'Flexible product attributes (key-value pairs)';
CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON product_attributes(product_id, key);

-- ============================================================================
-- PRODUCT VARIANTS TABLE
-- ============================================================================
-- Product variations (different SKUs, colors, sizes, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  variant_name TEXT,
  attributes JSONB DEFAULT '{}'::JSONB,
  stock_quantity INTEGER DEFAULT 0,
  price_override NUMERIC(12,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE product_variants IS 'Product variants with different SKUs and pricing';
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- ============================================================================
-- PRICE HISTORY TABLE
-- ============================================================================
-- Track price changes over time
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  effective_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE price_history IS 'Historical price tracking for products';
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, effective_at DESC);

-- ============================================================================
-- CARTS TABLE
-- ============================================================================
-- Shopping carts for users
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_id UUID,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE carts IS 'Shopping carts (can be anonymous via session_id or authenticated via user_id)';
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

-- ============================================================================
-- CART ITEMS TABLE
-- ============================================================================
-- Items in shopping carts
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cart_items IS 'Items added to shopping carts';
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID,
  status TEXT DEFAULT 'pending',
  subtotal NUMERIC(12,2),
  tax NUMERIC(12,2),
  shipping NUMERIC(12,2),
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'KES',
  shipping_address JSONB,
  billing_address JSONB,
  payment_info JSONB,
  items JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Customer orders with payment and shipping details';
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================================================
-- MPESA TRANSACTIONS TABLE
-- ============================================================================
-- MPesa payment transactions (Kenya mobile money)
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_id TEXT UNIQUE,
  phone_number TEXT,
  amount NUMERIC(12,2),
  status TEXT,
  receipt_number TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mpesa_transactions IS 'MPesa mobile money payment transactions';
CREATE INDEX IF NOT EXISTS idx_mpesa_order ON mpesa_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_transaction ON mpesa_transactions(transaction_id);

-- ============================================================================
-- WHATSAPP ORDERS TABLE
-- ============================================================================
-- Orders placed via WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_orders IS 'Orders placed through WhatsApp channel';
CREATE INDEX IF NOT EXISTS idx_whatsapp_orders_order ON whatsapp_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_orders_phone ON whatsapp_orders(phone_number);

-- ============================================================================
-- SITE SETTINGS TABLE
-- ============================================================================
-- Global site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE site_settings IS 'Global site configuration key-value store';

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Activity and change tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT,
  action TEXT,
  table_name TEXT,
  row_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'System audit trail for tracking changes';
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- STAGING TABLES (For CSV Import)
-- ============================================================================
-- Temporary staging table for CSV import
CREATE TABLE IF NOT EXISTS staging_products_from_csv (
  id SERIAL PRIMARY KEY,
  raw JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging_products_from_csv IS 'Staging table for CSV import (raw JSONB rows)';

-- Error tracking for failed imports
CREATE TABLE IF NOT EXISTS staging_errors (
  id SERIAL PRIMARY KEY,
  raw_row JSONB,
  error_text TEXT,
  error_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging_errors IS 'Failed CSV import rows with error details';

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
