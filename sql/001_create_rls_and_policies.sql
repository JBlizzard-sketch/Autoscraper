-- sql/001_create_rls_and_policies.sql
-- Row Level Security (RLS) policies for Supabase
-- Controls data access for authenticated vs anonymous users

-- ============================================================================
-- ENABLE RLS ON TABLES
-- ============================================================================

-- Public read tables (anyone can view)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Protected tables (read/write restrictions)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_orders ENABLE ROW LEVEL SECURITY;

-- Admin-only tables
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ POLICIES (Catalog Data)
-- ============================================================================
-- Anyone can view products, categories, brands, etc.

-- Suppliers: Public read
DROP POLICY IF EXISTS "Public read access to suppliers" ON suppliers;
CREATE POLICY "Public read access to suppliers" ON suppliers
  FOR SELECT USING (true);

-- Brands: Public read
DROP POLICY IF EXISTS "Public read access to brands" ON brands;
CREATE POLICY "Public read access to brands" ON brands
  FOR SELECT USING (true);

-- Categories: Public read
DROP POLICY IF EXISTS "Public read access to categories" ON categories;
CREATE POLICY "Public read access to categories" ON categories
  FOR SELECT USING (true);

-- Images: Public read
DROP POLICY IF EXISTS "Public read access to images" ON images;
CREATE POLICY "Public read access to images" ON images
  FOR SELECT USING (true);

-- Products: Public read (only available products)
DROP POLICY IF EXISTS "Public read access to available products" ON products;
CREATE POLICY "Public read access to available products" ON products
  FOR SELECT USING (available = true);

-- Product Attributes: Public read
DROP POLICY IF EXISTS "Public read access to product attributes" ON product_attributes;
CREATE POLICY "Public read access to product attributes" ON product_attributes
  FOR SELECT USING (true);

-- Product Variants: Public read
DROP POLICY IF EXISTS "Public read access to product variants" ON product_variants;
CREATE POLICY "Public read access to product variants" ON product_variants
  FOR SELECT USING (true);

-- ============================================================================
-- CART POLICIES
-- ============================================================================
-- Users can only see and modify their own carts

-- Carts: Users can view their own carts (by session_id or user_id)
DROP POLICY IF EXISTS "Users can view their own carts" ON carts;
CREATE POLICY "Users can view their own carts" ON carts
  FOR SELECT USING (
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Carts: Users can create carts
DROP POLICY IF EXISTS "Users can create carts" ON carts;
CREATE POLICY "Users can create carts" ON carts
  FOR INSERT WITH CHECK (true);

-- Carts: Users can update their own carts
DROP POLICY IF EXISTS "Users can update their own carts" ON carts;
CREATE POLICY "Users can update their own carts" ON carts
  FOR UPDATE USING (
    session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Cart Items: Users can view items in their carts
DROP POLICY IF EXISTS "Users can view their cart items" ON cart_items;
CREATE POLICY "Users can view their cart items" ON cart_items
  FOR SELECT USING (
    cart_id IN (
      SELECT id FROM carts
      WHERE session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Cart Items: Users can add items to their carts
DROP POLICY IF EXISTS "Users can add items to their carts" ON cart_items;
CREATE POLICY "Users can add items to their carts" ON cart_items
  FOR INSERT WITH CHECK (true);

-- Cart Items: Users can update items in their carts
DROP POLICY IF EXISTS "Users can update their cart items" ON cart_items;
CREATE POLICY "Users can update their cart items" ON cart_items
  FOR UPDATE USING (
    cart_id IN (
      SELECT id FROM carts
      WHERE session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Cart Items: Users can delete items from their carts
DROP POLICY IF EXISTS "Users can delete their cart items" ON cart_items;
CREATE POLICY "Users can delete their cart items" ON cart_items
  FOR DELETE USING (
    cart_id IN (
      SELECT id FROM carts
      WHERE session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================================================
-- ORDER POLICIES
-- ============================================================================
-- Users can only view their own orders

-- Orders: Users can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Orders: Users can create orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PAYMENT POLICIES
-- ============================================================================

-- MPesa Transactions: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view their own mpesa transactions" ON mpesa_transactions;
CREATE POLICY "Users can view their own mpesa transactions" ON mpesa_transactions
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- WhatsApp Orders: Users can view their own WhatsApp orders
DROP POLICY IF EXISTS "Users can view their own whatsapp orders" ON whatsapp_orders;
CREATE POLICY "Users can view their own whatsapp orders" ON whatsapp_orders
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================================================
-- ADMIN-ONLY POLICIES
-- ============================================================================
-- Price history, settings, and audit logs are admin-only

-- Price History: No public access (admin/service_role only)
DROP POLICY IF EXISTS "Admin only access to price history" ON price_history;
CREATE POLICY "Admin only access to price history" ON price_history
  FOR ALL USING (false);

-- Site Settings: No public access (admin/service_role only)
DROP POLICY IF EXISTS "Admin only access to site settings" ON site_settings;
CREATE POLICY "Admin only access to site settings" ON site_settings
  FOR ALL USING (false);

-- Audit Logs: No public access (admin/service_role only)
DROP POLICY IF EXISTS "Admin only access to audit logs" ON audit_logs;
CREATE POLICY "Admin only access to audit logs" ON audit_logs
  FOR ALL USING (false);

-- ============================================================================
-- SERVICE_ROLE KEY PERMISSIONS
-- ============================================================================
-- The service_role key (used for seeding and admin operations) bypasses ALL RLS policies
-- This allows:
--   - Full read/write access to all tables
--   - Ability to seed initial data
--   - Administrative operations
--   - Database migrations
--
-- SECURITY WARNING:
--   - NEVER expose service_role key in client-side code
--   - Use only in trusted server environments
--   - Rotate key after initial seeding if exposed
--   - Use anon key for client applications
-- ============================================================================
