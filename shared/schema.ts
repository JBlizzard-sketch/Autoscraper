import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, boolean, integer, timestamp, serial, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// ACTUAL SUPABASE TABLES (from your database)
// =====================================================

// Brands table from Supabase
export const brandsFinalV3 = pgTable("brands_final_v3", {
  brand_id: integer("brand_id").primaryKey(),
  brand_name: text("brand_name").notNull(),
});

// Categories table from Supabase
export const categoriesFinalV3 = pgTable("categories_final_v3", {
  category_id: integer("category_id").primaryKey(),
  category_name: text("category_name").notNull(),
});

// Subcategories table from Supabase
export const subcategoriesFinalV3 = pgTable("subcategories_final_v3", {
  subcategory_id: integer("subcategory_id").primaryKey(),
  subcategory_name: text("subcategory_name").notNull(),
  category_id: integer("category_id").notNull(),
  category_name: text("category_name"),
  taxonomy_id: integer("taxonomy_id"),
  taxonomy_name: text("taxonomy_name"),
});

// Parts taxonomy table from Supabase
export const partsTaxonomyFinalV3 = pgTable("parts_taxonomy_final_v3", {
  taxonomy_id: integer("taxonomy_id").primaryKey(),
  taxonomy_name: text("taxonomy_name").notNull(),
});

// Vehicle models table from Supabase
export const modelsFinalV3 = pgTable("models_final_v3", {
  model_id: integer("model_id").primaryKey(),
  brand_id: integer("brand_id").notNull(),
  brand_name: text("brand_name"),
  model_name: text("model_name").notNull(),
});

// Products table from Supabase (denormalized with brand/model info)
export const productsFinalV3 = pgTable("products_final_v3", {
  product_id: integer("product_id").primaryKey(),
  part_name: text("part_name"),
  part_number: text("part_number"),
  price_value: numeric("price_value", { precision: 12, scale: 2 }),
  image_url: text("image_url"),
  product_url: text("product_url"),
  description: text("description"),
  brand_id: integer("brand_id").references(() => brandsFinalV3.brand_id),
  brand_name: text("brand_name"),
  model_id: integer("model_id").references(() => modelsFinalV3.model_id),
  model_name: text("model_name"),
  category_id: integer("category_id").references(() => categoriesFinalV3.category_id),
  subcategory_id: integer("subcategory_id").references(() => subcategoriesFinalV3.subcategory_id),
  taxonomy_id: integer("taxonomy_id").references(() => partsTaxonomyFinalV3.taxonomy_id),
});

// Compatibility table from Supabase (no primary key - data table only)
export const compatibility = pgTable("compatibility", {
  product_id: integer("product_id"),
  brand_name: text("brand_name"),
  model_variant: text("model_variant"),
  brand_id: integer("brand_id"),
});

// Reviews table from Supabase
export const reviews = pgTable("reviews", {
  review_id: serial("review_id").primaryKey(),
  user_id: uuid("user_id"),
  product_id: integer("product_id").references(() => productsFinalV3.product_id),
  rating: integer("rating"),
  title: text("title"),
  content: text("content"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Wishlist items table from Supabase
export const wishlistItems = pgTable("wishlist_items", {
  wishlist_id: serial("wishlist_id").primaryKey(),
  user_id: uuid("user_id"),
  product_id: integer("product_id").references(() => productsFinalV3.product_id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// =====================================================
// LEGACY CATALOG TABLES (for compatibility)
// =====================================================

export const brands = pgTable("brands", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo_url: text("logo_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon_name: varchar("icon_name", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const subcategories = pgTable("subcategories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category_id: integer("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default('0'),
  vehicle_make: varchar("vehicle_make", { length: 100 }),
  vehicle_model: varchar("vehicle_model", { length: 100 }),
  year_range: varchar("year_range", { length: 50 }),
  brand_id: integer("brand_id").references(() => brands.id, { onDelete: 'set null' }),
  category_id: integer("category_id").references(() => categories.id, { onDelete: 'set null' }),
  subcategory_id: integer("subcategory_id").references(() => subcategories.id, { onDelete: 'set null' }),
  engine_size: varchar("engine_size", { length: 50 }),
  oem_part_number: varchar("oem_part_number", { length: 100 }),
  description: text("description"),
  meta_title: varchar("meta_title", { length: 255 }),
  meta_description: varchar("meta_description", { length: 500 }),
  product_url: text("product_url"),
  image_url: text("image_url"),
  stock_quantity: integer("stock_quantity").default(0),
  lead_time_days: integer("lead_time_days").default(0),
  warranty_months: integer("warranty_months").default(0),
  available: boolean("available").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const product_images = pgTable("product_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  image_url: text("image_url").notNull(),
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// =====================================================
// E-COMMERCE TABLES
// Uses Supabase Auth (auth.users) - no local users table
// =====================================================

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"), // References auth.users(id) in Supabase
  session_id: varchar("session_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default('active'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const cart_items = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cart_id: uuid("cart_id").notNull().references(() => carts.id, { onDelete: 'cascade' }),
  product_id: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull().default(1),
  unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"), // References auth.users(id) in Supabase
  session_id: varchar("session_id", { length: 255 }),
  order_number: varchar("order_number", { length: 50 }).unique().notNull(),
  customer_name: varchar("customer_name", { length: 255 }).notNull(),
  customer_email: varchar("customer_email", { length: 255 }),
  customer_phone: varchar("customer_phone", { length: 20 }).notNull(),
  delivery_address: text("delivery_address"),
  delivery_county: varchar("delivery_county", { length: 100 }),
  delivery_town: varchar("delivery_town", { length: 100 }),
  total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default('pending'),
  payment_method: varchar("payment_method", { length: 50 }),
  payment_status: varchar("payment_status", { length: 50 }).default('pending'),
  whatsapp_sent: boolean("whatsapp_sent").default(false),
  whatsapp_message_id: varchar("whatsapp_message_id", { length: 255 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const order_items = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  product_id: integer("product_id").references(() => products.id, { onDelete: 'set null' }),
  product_name: varchar("product_name", { length: 500 }).notNull(),
  product_sku: varchar("product_sku", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// =====================================================
// BLOG TABLES
// =====================================================

export const blog_categories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const blog_posts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  category_id: uuid("category_id").references(() => blog_categories.id, { onDelete: 'set null' }),
  author_id: uuid("author_id"), // References auth.users(id) in Supabase
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featured_image: text("featured_image"),
  status: varchar("status", { length: 50 }).default('draft'),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// =====================================================
// INSERT SCHEMAS & TYPES
// =====================================================

export const insertBrandSchema = createInsertSchema(brands).omit({
  created_at: true,
  updated_at: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  created_at: true,
  updated_at: true,
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  created_at: true,
  updated_at: true,
});

export const insertProductImageSchema = createInsertSchema(product_images).omit({
  id: true,
  created_at: true,
});


export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertCartItemSchema = createInsertSchema(cart_items).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderItemSchema = createInsertSchema(order_items).omit({
  id: true,
  created_at: true,
});

export const insertBlogCategorySchema = createInsertSchema(blog_categories).omit({
  id: true,
  created_at: true,
});

export const insertBlogPostSchema = createInsertSchema(blog_posts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// =====================================================
// SELECT TYPES - ACTUAL SUPABASE TABLES
// =====================================================

export type BrandFinalV3 = typeof brandsFinalV3.$inferSelect;
export type CategoryFinalV3 = typeof categoriesFinalV3.$inferSelect;
export type SubcategoryFinalV3 = typeof subcategoriesFinalV3.$inferSelect;
export type ProductFinalV3 = typeof productsFinalV3.$inferSelect;
export type PartsTaxonomyFinalV3 = typeof partsTaxonomyFinalV3.$inferSelect;
export type ModelFinalV3 = typeof modelsFinalV3.$inferSelect;
export type Compatibility = typeof compatibility.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// =====================================================
// SELECT TYPES - LEGACY
// =====================================================

export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof product_images.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cart_items.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof order_items.$inferSelect;
export type BlogCategory = typeof blog_categories.$inferSelect;
export type BlogPost = typeof blog_posts.$inferSelect;

// =====================================================
// INSERT TYPES
// =====================================================

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
