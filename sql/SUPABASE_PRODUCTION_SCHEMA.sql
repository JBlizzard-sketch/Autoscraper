-- =====================================================
-- AutoParts Kenya - Supabase Production Schema
-- =====================================================
-- This is THE ONLY schema file you need to run in Supabase SQL Editor
-- Run this once, import data once, and database persists forever
-- Designed for Supabase with RLS policies and serverless deployment
-- =====================================================

-- Drop existing tables if they exist (for clean runs)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- =====================================================
-- CATALOG TABLES (Product Database)
-- Uses INTEGER IDs matching CSV data
-- =====================================================

-- Brands Table
CREATE TABLE brands (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);

-- Categories Table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- Subcategories Table
CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subcategories_slug ON subcategories(slug);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Products Table (Main Catalog)
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    sku VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    year_range VARCHAR(50),
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
    engine_size VARCHAR(50),
    oem_part_number VARCHAR(100),
    description TEXT,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    product_url TEXT,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    warranty_months INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_vehicle ON products(vehicle_make, vehicle_model);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_sku ON products(sku);

-- Full-text search index for products
CREATE INDEX idx_products_search ON products USING GIN(
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' ||
        COALESCE(vehicle_make, '') || ' ' ||
        COALESCE(vehicle_model, '') || ' ' ||
        COALESCE(oem_part_number, '') || ' ' ||
        COALESCE(sku, '')
    )
);

-- Product Images Table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(product_id, display_order);

-- =====================================================
-- E-COMMERCE TABLES
-- Uses Supabase Auth for users (auth.users)
-- =====================================================

-- Carts Table (Session & User-based)
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_carts_status ON carts(status);

-- Cart Items Table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT,
    delivery_county VARCHAR(100),
    delivery_town VARCHAR(100),
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_message_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_date ON orders(created_at DESC);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(500) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- BLOG / CONTENT TABLES
-- =====================================================

-- Blog Categories Table
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

-- Blog Posts Table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC);

-- Full-text search for blog
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN(
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(content, '') || ' ' ||
        COALESCE(excerpt, '')
    )
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog (brands, categories, products)
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read subcategories" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read product_images" ON product_images FOR SELECT USING (true);

-- Public read for published blog posts
CREATE POLICY "Public read published blog posts" ON blog_posts 
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public read blog categories" ON blog_categories 
    FOR SELECT USING (true);

-- Cart policies: Users can only access their own carts
CREATE POLICY "Users can view own carts" ON carts 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        session_id = current_setting('app.session_id', true)
    );

CREATE POLICY "Users can create own carts" ON carts 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        session_id = current_setting('app.session_id', true)
    );

CREATE POLICY "Users can update own carts" ON carts 
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        session_id = current_setting('app.session_id', true)
    );

CREATE POLICY "Users can delete own carts" ON carts 
    FOR DELETE USING (
        auth.uid() = user_id OR 
        session_id = current_setting('app.session_id', true)
    );

-- Cart items policies: Access through cart ownership
CREATE POLICY "Users can view own cart items" ON cart_items 
    FOR SELECT USING (
        cart_id IN (
            SELECT id FROM carts WHERE 
            auth.uid() = user_id OR 
            session_id = current_setting('app.session_id', true)
        )
    );

CREATE POLICY "Users can create own cart items" ON cart_items 
    FOR INSERT WITH CHECK (
        cart_id IN (
            SELECT id FROM carts WHERE 
            auth.uid() = user_id OR 
            session_id = current_setting('app.session_id', true)
        )
    );

CREATE POLICY "Users can update own cart items" ON cart_items 
    FOR UPDATE USING (
        cart_id IN (
            SELECT id FROM carts WHERE 
            auth.uid() = user_id OR 
            session_id = current_setting('app.session_id', true)
        )
    );

CREATE POLICY "Users can delete own cart items" ON cart_items 
    FOR DELETE USING (
        cart_id IN (
            SELECT id FROM carts WHERE 
            auth.uid() = user_id OR 
            session_id = current_setting('app.session_id', true)
        )
    );

-- Order policies: Users can only view their own orders
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        session_id = current_setting('app.session_id', true)
    );

CREATE POLICY "Users can create orders" ON orders 
    FOR INSERT WITH CHECK (true);

-- Order items policies: Access through order ownership
CREATE POLICY "Users can view own order items" ON order_items 
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE 
            auth.uid() = user_id OR 
            session_id = current_setting('app.session_id', true)
        )
    );

CREATE POLICY "System can create order items" ON order_items 
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- HELPFUL FUNCTIONS
-- =====================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_order_number VARCHAR(50);
    order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count FROM orders;
    new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((order_count + 1)::TEXT, 4, '0');
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE brands IS 'Auto parts brands (Bosch, Denso, etc.) - INTEGER ID matches CSV data';
COMMENT ON TABLE categories IS 'Main product categories (Engine, Brakes, etc.) - INTEGER ID matches CSV';
COMMENT ON TABLE subcategories IS 'Product subcategories under each category - INTEGER ID matches CSV';
COMMENT ON TABLE products IS 'Main product catalog with vehicle compatibility - INTEGER ID matches CSV';
COMMENT ON TABLE product_images IS 'Multiple images per product - UUID id, INTEGER product_id FK';
COMMENT ON TABLE carts IS 'Shopping carts (session-based for guests, user-based via Supabase Auth)';
COMMENT ON TABLE cart_items IS 'Items in each cart with quantities and pricing';
COMMENT ON TABLE orders IS 'Completed orders with WhatsApp integration support';
COMMENT ON TABLE order_items IS 'Line items for each order (preserves product info)';
COMMENT ON TABLE blog_posts IS 'Blog content for automotive tips and news';
COMMENT ON TABLE blog_categories IS 'Blog post categories';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run scripts/import-csvs.ts with Supabase credentials to import 600 products
-- 2. Save SUPABASE_URL and SUPABASE_ANON_KEY as environment variables
-- 3. App will connect automatically - no more imports needed!
-- =====================================================
