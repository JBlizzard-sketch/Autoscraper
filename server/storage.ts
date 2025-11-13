import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import type { 
  Product, 
  Category, 
  Brand,
  Subcategory,
  Cart,
  CartItem,
  InsertCart,
  InsertCartItem,
  ProductImage,
  Order,
  OrderItem,
  InsertOrder,
  InsertOrderItem,
  // Supabase actual tables
  ProductFinalV3,
  CategoryFinalV3,
  BrandFinalV3,
  SubcategoryFinalV3,
  ModelFinalV3,
  Compatibility,
  Review,
  WishlistItem
} from "@shared/schema";

// Supabase client - for auth, realtime, storage features
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Only create Supabase client if credentials are provided
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!supabase) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set. Supabase features disabled.');
}

// PostgreSQL connection pool - works with Supabase PostgreSQL endpoint
// Use DATABASE_URL from Supabase project settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('✅ Database configured:', process.env.DATABASE_URL ? 'Connected to Supabase PostgreSQL' : '⚠️  No DATABASE_URL set');

export interface ProductFilters {
  search?: string;
  category_id?: number;
  subcategory_id?: number;
  brand_id?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  min_price?: number;
  max_price?: number;
  available?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

import type { BlogPost, BlogCategory } from "@shared/schema";

export interface IStorage {
  getProducts(filters?: ProductFilters, pagination?: PaginationParams): Promise<{ data: Product[]; total: number }>;
  getProduct(id: number): Promise<Product | null>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  
  getSubcategories(categoryId?: number): Promise<Subcategory[]>;
  getSubcategory(id: number): Promise<Subcategory | null>;
  
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | null>;
  
  getProductImages(productId: number): Promise<ProductImage[]>;
  
  // Cart methods - use UUID strings for cart/cartItem IDs
  getCart(sessionId: string): Promise<Cart | null>;
  createCart(cart: InsertCart): Promise<Cart | null>;
  getCartItems(cartId: string): Promise<CartItem[]>;
  addCartItem(item: InsertCartItem): Promise<CartItem | null>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | null>;
  removeCartItem(id: string): Promise<boolean>;
  clearCart(cartId: string): Promise<boolean>;
  
  // Order methods - use UUID strings for order/orderItem IDs
  createOrder(order: InsertOrder): Promise<Order | null>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem | null>;
  getOrders(sessionId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  // Blog methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(slug: string): Promise<BlogPost | null>;
  getBlogCategories(): Promise<BlogCategory[]>;
}

// Helper function to generate URL-friendly slug from text
function generateSlug(text: string, includeId?: number): string {
  if (!text && includeId) return `product-${includeId}`;
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  // Only append ID if explicitly requested (for products with potential duplicate names)
  return includeId ? `${slug}-${includeId}` : slug;
}

export class PostgresStorage implements IStorage {
  async getProducts(filters: ProductFilters = {}, pagination: PaginationParams = {}): Promise<{ data: Product[]; total: number }> {
    try {
      const { page = 1, limit = 24 } = pagination;
      const offset = (page - 1) * limit;
      
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;
    
    if (filters.search) {
      whereConditions.push(`(
        part_name ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex} OR 
        brand_name ILIKE $${paramIndex} OR 
        model_name ILIKE $${paramIndex} OR 
        part_number ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    if (filters.category_id) {
      whereConditions.push(`category_id = $${paramIndex}`);
      params.push(filters.category_id);
      paramIndex++;
    }
    
    if (filters.subcategory_id) {
      whereConditions.push(`subcategory_id = $${paramIndex}`);
      params.push(filters.subcategory_id);
      paramIndex++;
    }
    
    if (filters.brand_id) {
      whereConditions.push(`brand_id = $${paramIndex}`);
      params.push(filters.brand_id);
      paramIndex++;
    }
    
    if (filters.vehicle_make) {
      whereConditions.push(`brand_name ILIKE $${paramIndex}`);
      params.push(`%${filters.vehicle_make}%`);
      paramIndex++;
    }
    
    if (filters.vehicle_model) {
      whereConditions.push(`model_name ILIKE $${paramIndex}`);
      params.push(`%${filters.vehicle_model}%`);
      paramIndex++;
    }
    
    if (filters.min_price !== undefined) {
      whereConditions.push(`price_value >= $${paramIndex}`);
      params.push(filters.min_price);
      paramIndex++;
    }
    
    if (filters.max_price !== undefined) {
      whereConditions.push(`price_value <= $${paramIndex}`);
      params.push(filters.max_price);
      paramIndex++;
    }
    
    // Filter out products without part_name or description
    whereConditions.push(`(part_name IS NOT NULL OR description IS NOT NULL)`);
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM products_final_v3 ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');
    
    // Get paginated data - transform to Product type with all required fields
    // Prioritize products with complete data (name and description)
    const dataQuery = `
      SELECT 
        product_id as id,
        COALESCE(part_name, description) as name,
        'product-' || product_id as slug,
        part_number as sku,
        part_number as oem_part_number,
        COALESCE(price_value, 0) as price,
        image_url,
        COALESCE(description, part_name, '') as description,
        brand_id,
        brand_name as vehicle_make,
        model_name as vehicle_model,
        '' as year_range,
        '' as engine_size,
        category_id,
        subcategory_id,
        COALESCE(part_name, description) as meta_title,
        description as meta_description,
        product_url,
        0 as stock_quantity,
        0 as lead_time_days,
        0 as warranty_months,
        true as available,
        NOW() as created_at,
        NOW() as updated_at
      FROM products_final_v3 
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN part_name IS NOT NULL AND description IS NOT NULL THEN 1
          WHEN part_name IS NOT NULL THEN 2
          ELSE 3
        END,
        product_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
      const dataResult = await pool.query(dataQuery, [...params, limit, offset]);
      
      return { data: dataResult.rows, total };
    } catch (error) {
      console.error('Error fetching products from Supabase:', error);
      return { data: [], total: 0 };
    }
  }
  
  async getProduct(id: number): Promise<Product | null> {
    const result = await pool.query(`
      SELECT 
        product_id as id,
        part_name as name,
        'product-' || product_id as slug,
        part_number as sku,
        part_number as oem_part_number,
        COALESCE(price_value, 0) as price,
        image_url,
        COALESCE(description, '') as description,
        brand_id,
        brand_name as vehicle_make,
        model_name as vehicle_model,
        '' as year_range,
        '' as engine_size,
        category_id,
        subcategory_id,
        part_name as meta_title,
        description as meta_description,
        product_url,
        0 as stock_quantity,
        0 as lead_time_days,
        0 as warranty_months,
        true as available,
        NOW() as created_at,
        NOW() as updated_at
      FROM products_final_v3 
      WHERE product_id = $1
    `, [id]);
    return result.rows[0] || null;
  }
  
  async searchProducts(query: string, limit = 10): Promise<Product[]> {
    const result = await pool.query(
      `SELECT 
        product_id as id,
        part_name as name,
        'product-' || product_id as slug,
        part_number as sku,
        part_number as oem_part_number,
        COALESCE(price_value, 0) as price,
        image_url,
        COALESCE(description, '') as description,
        brand_id,
        brand_name as vehicle_make,
        model_name as vehicle_model,
        '' as year_range,
        '' as engine_size,
        category_id,
        subcategory_id,
        part_name as meta_title,
        description as meta_description,
        product_url,
        0 as stock_quantity,
        0 as lead_time_days,
        0 as warranty_months,
        true as available,
        NOW() as created_at,
        NOW() as updated_at
       FROM products_final_v3 
       WHERE to_tsvector('english', 
         COALESCE(part_name, '') || ' ' || 
         COALESCE(description, '') || ' ' ||
         COALESCE(brand_name, '') || ' ' ||
         COALESCE(model_name, '') || ' ' ||
         COALESCE(part_number, '')
       ) @@ plainto_tsquery('english', $1)
       LIMIT $2`,
      [query, limit]
    );
    return result.rows;
  }
  
  async getCategories(): Promise<Category[]> {
    const result = await pool.query(`
      SELECT 
        category_id as id,
        category_name as name,
        '' as description
      FROM categories_final_v3 
      ORDER BY category_name
    `);
    // Generate slugs from names (no ID since category names are unique)
    return result.rows.map((row: any) => ({
      ...row,
      slug: generateSlug(row.name)
    }));
  }
  
  async getCategory(id: number): Promise<Category | null> {
    const result = await pool.query(`
      SELECT 
        category_id as id,
        category_name as name,
        '' as description
      FROM categories_final_v3 
      WHERE category_id = $1
    `, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      slug: generateSlug(row.name)
    };
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    // Convert slug back to potential name patterns and search
    // Since category names are unique, we can match by LOWER(name) with slug format
    const result = await pool.query(`
      SELECT 
        category_id as id,
        category_name as name,
        '' as description
      FROM categories_final_v3
      WHERE LOWER(REGEXP_REPLACE(category_name, '[^a-zA-Z0-9]+', '-', 'g')) = LOWER($1)
         OR LOWER(REGEXP_REPLACE(TRIM(BOTH '-' FROM REGEXP_REPLACE(category_name, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')) = LOWER($1)
    `, [slug]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      slug: generateSlug(row.name)
    };
  }
  
  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    if (categoryId) {
      const result = await pool.query(
        `SELECT 
          subcategory_id as id,
          subcategory_name as name,
          category_id
        FROM subcategories_final_v3 
        WHERE category_id = $1 
        ORDER BY subcategory_name`,
        [categoryId]
      );
      return result.rows.map((row: any) => ({
        ...row,
        slug: generateSlug(row.name, row.id)
      }));
    }
    const result = await pool.query(`
      SELECT 
        subcategory_id as id,
        subcategory_name as name,
        category_id
      FROM subcategories_final_v3 
      ORDER BY subcategory_name
    `);
    return result.rows.map((row: any) => ({
      ...row,
      slug: generateSlug(row.name, row.id)
    }));
  }
  
  async getSubcategory(id: number): Promise<Subcategory | null> {
    const result = await pool.query(`
      SELECT 
        subcategory_id as id,
        subcategory_name as name,
        category_id
      FROM subcategories_final_v3 
      WHERE subcategory_id = $1
    `, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      slug: generateSlug(row.name, row.id)
    };
  }
  
  async getBrands(): Promise<Brand[]> {
    const result = await pool.query(`
      SELECT 
        brand_id as id,
        brand_name as name,
        '' as logo_url,
        '' as description
      FROM brands_final_v3 
      ORDER BY brand_name
    `);
    return result.rows.map((row: any) => ({
      ...row,
      slug: generateSlug(row.name, row.id)
    }));
  }
  
  async getBrand(id: number): Promise<Brand | null> {
    const result = await pool.query(`
      SELECT 
        brand_id as id,
        brand_name as name,
        '' as logo_url,
        '' as description
      FROM brands_final_v3 
      WHERE brand_id = $1
    `, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      slug: generateSlug(row.name, row.id)
    };
  }
  
  async getProductImages(productId: number): Promise<ProductImage[]> {
    // Supabase products have image_url directly in products table, not a separate table
    // Convert to ProductImage format for compatibility
    const result = await pool.query(
      `SELECT 
        'img-' || product_id as id,
        product_id,
        image_url,
        1 as display_order
      FROM products_final_v3 
      WHERE product_id = $1 AND image_url IS NOT NULL`,
      [productId]
    );
    return result.rows;
  }
  
  async getCart(sessionId: string): Promise<Cart | null> {
    const result = await pool.query(
      `SELECT 
        cart_id::text as id,
        user_id,
        session_id,
        status,
        created_at,
        updated_at
       FROM cart 
       WHERE (session_id = $1 OR user_id::text = $1) AND status = 'active'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [sessionId]
    );
    return result.rows[0] || null;
  }
  
  async createCart(cart: InsertCart): Promise<Cart | null> {
    const result = await pool.query(
      `INSERT INTO cart (user_id, session_id, status)
       VALUES ($1, $2, $3)
       RETURNING 
        cart_id::text as id,
        user_id,
        session_id,
        status,
        created_at,
        updated_at`,
      [cart.user_id || null, cart.session_id || null, cart.status || 'active']
    );
    return result.rows[0] || null;
  }
  
  async getCartItems(cartId: string): Promise<CartItem[]> {
    const result = await pool.query(
      `SELECT 
        cart_item_id::text as id,
        cart_id::text,
        product_id,
        quantity,
        price as unit_price,
        created_at,
        updated_at
       FROM cart_items 
       WHERE cart_id = $1::bigint`,
      [cartId]
    );
    return result.rows;
  }
  
  async addCartItem(item: InsertCartItem): Promise<CartItem | null> {
    try {
      const result = await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, price)
         VALUES ($1::bigint, $2, $3, $4)
         ON CONFLICT (cart_id, product_id) 
         DO UPDATE SET 
           quantity = cart_items.quantity + EXCLUDED.quantity,
           updated_at = CURRENT_TIMESTAMP
         RETURNING 
          cart_item_id::text as id,
          cart_id::text,
          product_id,
          quantity,
          price as unit_price,
          created_at,
          updated_at`,
        [item.cart_id, item.product_id, item.quantity, item.unit_price]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding cart item:', error);
      return null;
    }
  }
  
  async updateCartItem(id: string, quantity: number): Promise<CartItem | null> {
    const result = await pool.query(
      `UPDATE cart_items 
       SET quantity = $2, updated_at = CURRENT_TIMESTAMP
       WHERE cart_item_id = $1::bigint
       RETURNING 
        cart_item_id::text as id,
        cart_id::text,
        product_id,
        quantity,
        price as unit_price,
        created_at,
        updated_at`,
      [id, quantity]
    );
    return result.rows[0] || null;
  }
  
  async removeCartItem(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1::bigint', [id]);
    return (result.rowCount || 0) > 0;
  }
  
  async clearCart(cartId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM cart_items WHERE cart_id = $1::bigint', [cartId]);
    return true;
  }
  
  async createOrder(order: InsertOrder): Promise<Order | null> {
    try {
      const result = await pool.query(
        `INSERT INTO orders (
          user_id, total_amount, status, payment_method, shipping_address
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          order_id::text as id,
          user_id,
          NULL as session_id,
          NULL as order_number,
          NULL as customer_name,
          NULL as customer_email,
          NULL as customer_phone,
          shipping_address as delivery_address,
          NULL as delivery_county,
          NULL as delivery_town,
          total_amount,
          status,
          payment_method,
          NULL as payment_status,
          false as whatsapp_sent,
          NULL as whatsapp_message_id,
          NULL as notes,
          created_at,
          updated_at`,
        [
          order.user_id || null,
          order.total_amount,
          order.status || 'pending',
          order.payment_method || null,
          order.delivery_address || null
        ]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem | null> {
    try {
      const result = await pool.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, price
        ) VALUES ($1::bigint, $2, $3, $4)
        RETURNING 
          order_item_id::text as id,
          order_id::text,
          product_id,
          NULL as product_name,
          NULL as product_sku,
          quantity,
          price as unit_price,
          (quantity * price) as subtotal,
          created_at`,
        [
          orderItem.order_id,
          orderItem.product_id || null,
          orderItem.quantity,
          orderItem.unit_price
        ]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error creating order item:', error);
      return null;
    }
  }
  
  async getOrders(sessionId: string): Promise<Order[]> {
    const result = await pool.query(
      `SELECT 
        order_id::text as id,
        user_id,
        NULL as session_id,
        NULL as order_number,
        NULL as customer_name,
        NULL as customer_email,
        NULL as customer_phone,
        shipping_address as delivery_address,
        NULL as delivery_county,
        NULL as delivery_town,
        total_amount,
        status,
        payment_method,
        NULL as payment_status,
        false as whatsapp_sent,
        NULL as whatsapp_message_id,
        NULL as notes,
        created_at,
        updated_at
       FROM orders 
       WHERE user_id::text = $1
       ORDER BY created_at DESC`,
      [sessionId]
    );
    return result.rows;
  }
  
  async getOrder(id: string): Promise<Order | null> {
    const result = await pool.query(
      `SELECT 
        order_id::text as id,
        user_id,
        NULL as session_id,
        NULL as order_number,
        NULL as customer_name,
        NULL as customer_email,
        NULL as customer_phone,
        shipping_address as delivery_address,
        NULL as delivery_county,
        NULL as delivery_town,
        total_amount,
        status,
        payment_method,
        NULL as payment_status,
        false as whatsapp_sent,
        NULL as whatsapp_message_id,
        NULL as notes,
        created_at,
        updated_at
       FROM orders 
       WHERE order_id = $1::bigint`,
      [id]
    );
    return result.rows[0] || null;
  }
  
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await pool.query(
      `SELECT 
        order_item_id::text as id,
        order_id::text,
        product_id,
        NULL as product_name,
        NULL as product_sku,
        quantity,
        price as unit_price,
        (quantity * price) as subtotal,
        created_at
       FROM order_items 
       WHERE order_id = $1::bigint`,
      [orderId]
    );
    return result.rows;
  }
  
  // Blog methods (stub implementations - can be enhanced when blog schema is in Postgres)
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.log('Blog tables not yet created in Postgres, returning empty array');
      return [];
    }
  }
  
  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'`,
        [slug]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.log('Blog tables not yet created in Postgres, returning null');
      return null;
    }
  }
  
  async getBlogCategories(): Promise<BlogCategory[]> {
    try {
      const result = await pool.query('SELECT * FROM blog_categories ORDER BY name');
      return result.rows;
    } catch (error) {
      console.log('Blog tables not yet created in Postgres, returning empty array');
      return [];
    }
  }
}

// Import MemoryStorage
import { MemoryStorage } from "./memory-storage";

// Storage factory: use MemoryStorage for dev, PostgresStorage for production
function createStorage(): IStorage {
  // Use MemoryStorage for development (loaded from CSVs)
  // Switch to PostgresStorage by setting USE_POSTGRES=true in environment
  if (process.env.USE_POSTGRES === 'true' && process.env.DATABASE_URL) {
    console.log('📦 Using PostgresStorage with database connection');
    return new PostgresStorage();
  }
  
  // Default: use MemoryStorage loaded from CSVs (perfect for dev & demo)
  console.log('📦 Using MemoryStorage with CSV data');
  return new MemoryStorage();
}

// Export singleton instance
export const storage = createStorage();
