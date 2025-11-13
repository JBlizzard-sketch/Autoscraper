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
  BlogPost,
  BlogCategory
} from "@shared/schema";
import type { ProductFilters, PaginationParams, IStorage } from "./storage";
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class MemoryStorage implements IStorage {
  private products: Product[] = [];
  private categories: Category[] = [];
  private subcategories: Subcategory[] = [];
  private brands: Brand[] = [];
  private productImages: ProductImage[] = [];
  private carts: Map<string, Cart> = new Map();
  private cartItems: Map<string, CartItem[]> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem[]> = new Map();
  private blogPosts: BlogPost[] = [];
  private blogCategories: BlogCategory[] = [];

  constructor() {
    this.loadDataFromCSVs();
    this.createSampleBlogData();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private loadDataFromCSVs() {
    try {
      // Load brands
      const brandsPath = join(process.cwd(), 'attached_assets/auto_parts_dataset_brands_1762616065050.csv');
      const brandsContent = readFileSync(brandsPath, 'utf-8');
      const brandsData = parse(brandsContent, { columns: true, skip_empty_lines: true });
      this.brands = brandsData.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name,
        slug: row.slug,
        logo_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Load categories
      const categoriesPath = join(process.cwd(), 'attached_assets/auto_parts_dataset_categories_1762616065048.csv');
      const categoriesContent = readFileSync(categoriesPath, 'utf-8');
      const categoriesData = parse(categoriesContent, { columns: true, skip_empty_lines: true });
      this.categories = categoriesData.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name,
        slug: row.slug,
        description: null,
        icon_name: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Load subcategories
      const subcategoriesPath = join(process.cwd(), 'attached_assets/auto_parts_dataset_subcategories_1762616065046.csv');
      const subcategoriesContent = readFileSync(subcategoriesPath, 'utf-8');
      const subcategoriesData = parse(subcategoriesContent, { columns: true, skip_empty_lines: true });
      this.subcategories = subcategoriesData.map((row: any) => ({
        id: parseInt(row.id),
        name: row.name,
        slug: row.slug,
        category_id: parseInt(row.category_id),
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Load products (limit to first 100 for performance, can expand later)
      const productsPath = join(process.cwd(), 'attached_assets/auto_parts_dataset_products_1762616065044.csv');
      const productsContent = readFileSync(productsPath, 'utf-8');
      const productsData = parse(productsContent, { columns: true, skip_empty_lines: true, to: 101 }); // header + 100 rows
      this.products = productsData.map((row: any) => {
        const name = row.name;
        const slug = row.slug || this.slugify(`${name}-${row.id}`);
        const metaTitle = row.meta_title || `${name} | AutoParts Kenya`;
        const metaDescription = row.meta_description || (row.description ? row.description.substring(0, 155) + '...' : `Buy ${name} at AutoParts Kenya. Quality auto parts with fast delivery across Kenya.`);
        
        return {
          id: parseInt(row.id),
          name,
          slug,
          sku: row.sku || row.oem_part_number || `SKU-${row.id}`,
          price: row.price,
          vehicle_make: row.vehicle_make || null,
          vehicle_model: row.vehicle_model || null,
          year_range: row.year_range || null,
          brand_id: row.brand_id ? parseInt(row.brand_id) : null,
          category_id: row.category_id ? parseInt(row.category_id) : null,
          subcategory_id: row.subcategory_id ? parseInt(row.subcategory_id) : null,
          engine_size: row.engine_size || null,
          oem_part_number: row.oem_part_number || null,
          description: row.description || null,
          meta_title: metaTitle,
          meta_description: metaDescription,
          product_url: row.product_url || null,
          image_url: row.image_url || null,
          stock_quantity: row.stock_quantity || Math.floor(Math.random() * 50) + 10,
          lead_time_days: row.lead_time_days ? parseInt(row.lead_time_days) : 3,
          warranty_months: row.warranty_months ? parseInt(row.warranty_months) : null,
          available: row.available !== undefined ? row.available === 'true' || row.available === true : true,
          created_at: new Date(row.created_at || Date.now()),
          updated_at: new Date(row.updated_at || Date.now()),
        };
      });

      // Load product images for loaded products
      const imagesPath = join(process.cwd(), 'attached_assets/auto_parts_dataset_product_images_1762616065042.csv');
      const imagesContent = readFileSync(imagesPath, 'utf-8');
      const imagesData = parse(imagesContent, { columns: true, skip_empty_lines: true });
      
      const loadedProductIds = new Set(this.products.map(p => p.id));
      this.productImages = imagesData
        .filter((row: any) => loadedProductIds.has(parseInt(row.product_id)))
        .map((row: any) => {
          const productId = parseInt(row.product_id);
          const product = this.products.find(p => p.id === productId);
          const altText = row.alt_text || (product ? `${product.name} - Product Image` : 'Product Image');
          
          return {
            id: row.id,
            product_id: productId,
            image_url: row.image_url,
            alt_text: altText,
            source_attribution: row.source_attribution || null,
            display_order: parseInt(row.display_order || 0),
            created_at: new Date(),
          };
        });

      console.log(`✅ Loaded data from CSVs:`);
      console.log(`   - ${this.brands.length} brands`);
      console.log(`   - ${this.categories.length} categories`);
      console.log(`   - ${this.subcategories.length} subcategories`);
      console.log(`   - ${this.products.length} products`);
      console.log(`   - ${this.productImages.length} product images`);
      
      // Apply real product images
      this.applyRealProductImages();
    } catch (error) {
      console.error('Error loading CSVs:', error);
      // Initialize with empty data if CSV loading fails
      this.brands = [];
      this.categories = [];
      this.subcategories = [];
      this.products = [];
      this.productImages = [];
    }
  }

  private applyRealProductImages() {
    try {
      const mappingPath = join(process.cwd(), 'scripts/product-image-map.json');
      const mappingContent = readFileSync(mappingPath, 'utf-8');
      const imageMapping: Record<string, string> = JSON.parse(mappingContent);
      
      let updatedCount = 0;
      Object.entries(imageMapping).forEach(([productId, imagePath]) => {
        const id = parseInt(productId);
        const product = this.products.find(p => p.id === id);
        
        if (product) {
          // Update product image URL (serve from /assets prefix)
          product.image_url = `/assets${imagePath}`;
          
          // Create/update ProductImage entry for gallery support
          const existingImageIndex = this.productImages.findIndex(
            img => img.product_id === id && img.display_order === 0
          );
          
          const newImage: ProductImage = {
            id: `${id}-primary`,
            product_id: id,
            image_url: `/assets${imagePath}`,
            display_order: 0,
            created_at: new Date(),
          };
          
          if (existingImageIndex >= 0) {
            this.productImages[existingImageIndex] = newImage;
          } else {
            this.productImages.push(newImage);
          }
          
          updatedCount++;
        }
      });
      
      console.log(`✅ Applied real images to ${updatedCount} products`);
    } catch (error) {
      console.warn('⚠️  Could not apply real product images:', error);
    }
  }

  private createSampleBlogData() {
    const cat1 = randomUUID();
    const cat2 = randomUUID();
    const cat3 = randomUUID();
    
    this.blogCategories = [
      {
        id: cat1,
        name: "Maintenance Tips",
        slug: "maintenance-tips",
        description: "Expert tips on vehicle maintenance",
        created_at: new Date(),
      },
      {
        id: cat2,
        name: "Product Guides",
        slug: "product-guides",
        description: "Comprehensive guides for auto parts",
        created_at: new Date(),
      },
      {
        id: cat3,
        name: "Industry News",
        slug: "industry-news",
        description: "Latest news from automotive industry",
        created_at: new Date(),
      },
    ];

    this.blogPosts = [
      {
        id: randomUUID(),
        title: "5 Essential Car Maintenance Tips for Kenyan Roads",
        slug: "5-essential-car-maintenance-tips-kenyan-roads",
        category_id: cat1,
        author_id: null,
        content: `
          <h2>Introduction</h2>
          <p>Maintaining your vehicle is crucial, especially on Kenyan roads. Here are five essential tips to keep your car running smoothly.</p>
          
          <h3>1. Regular Oil Changes</h3>
          <p>Change your engine oil every 5,000-7,500 km to ensure optimal engine performance.</p>
          
          <h3>2. Check Your Tires</h3>
          <p>Inspect tire pressure weekly and rotate tires every 10,000 km for even wear.</p>
          
          <h3>3. Brake System Maintenance</h3>
          <p>Have your brakes inspected every 6 months to ensure safe stopping power.</p>
          
          <h3>4. Air Filter Replacement</h3>
          <p>Replace air filters annually to maintain fuel efficiency and engine power.</p>
          
          <h3>5. Battery Care</h3>
          <p>Clean battery terminals and check connections every 3 months to prevent breakdowns.</p>
        `,
        excerpt: "Maintaining your vehicle is crucial on Kenyan roads. Learn five essential maintenance tips.",
        featured_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200",
        status: "published",
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: randomUUID(),
        title: "How to Choose the Right Brake Pads for Your Vehicle",
        slug: "how-to-choose-right-brake-pads",
        category_id: cat2,
        author_id: null,
        content: `
          <h2>Understanding Brake Pads</h2>
          <p>Choosing the right brake pads is essential for your vehicle's safety and performance.</p>
          
          <h3>Types of Brake Pads</h3>
          <ul>
            <li><strong>Ceramic:</strong> Quiet, clean, long-lasting but expensive</li>
            <li><strong>Semi-Metallic:</strong> Great performance, affordable, can be noisy</li>
            <li><strong>Organic:</strong> Soft, quiet, but wear quickly</li>
          </ul>
          
          <h3>Factors to Consider</h3>
          <p>Consider your driving style, budget, and vehicle type when selecting brake pads.</p>
        `,
        excerpt: "Learn how to select the perfect brake pads for your vehicle's needs and driving style.",
        featured_image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1200",
        status: "published",
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
  }

  async getProducts(filters: ProductFilters = {}, pagination: PaginationParams = {}): Promise<{ data: Product[]; total: number }> {
    let filtered = [...this.products];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.vehicle_make?.toLowerCase().includes(search) ||
        p.vehicle_model?.toLowerCase().includes(search) ||
        p.oem_part_number?.toLowerCase().includes(search)
      );
    }

    if (filters.category_id) {
      filtered = filtered.filter(p => p.category_id === filters.category_id);
    }

    if (filters.subcategory_id) {
      filtered = filtered.filter(p => p.subcategory_id === filters.subcategory_id);
    }

    if (filters.brand_id) {
      filtered = filtered.filter(p => p.brand_id === filters.brand_id);
    }

    if (filters.vehicle_make) {
      filtered = filtered.filter(p => p.vehicle_make?.toLowerCase().includes(filters.vehicle_make!.toLowerCase()));
    }

    if (filters.vehicle_model) {
      filtered = filtered.filter(p => p.vehicle_model?.toLowerCase().includes(filters.vehicle_model!.toLowerCase()));
    }

    if (filters.min_price !== undefined) {
      filtered = filtered.filter(p => parseFloat(p.price) >= filters.min_price!);
    }

    if (filters.max_price !== undefined) {
      filtered = filtered.filter(p => parseFloat(p.price) <= filters.max_price!);
    }

    if (filters.available !== undefined) {
      filtered = filtered.filter(p => p.available === filters.available);
    }

    const total = filtered.length;
    const page = pagination.page || 1;
    const limit = pagination.limit || 24;
    const offset = (page - 1) * limit;

    return {
      data: filtered.slice(offset, offset + limit),
      total,
    };
  }

  async getProduct(id: number): Promise<Product | null> {
    return this.products.find(p => p.id === id) || null;
  }

  async searchProducts(query: string, limit = 10): Promise<Product[]> {
    const search = query.toLowerCase();
    return this.products
      .filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.vehicle_make?.toLowerCase().includes(search) ||
        p.vehicle_model?.toLowerCase().includes(search) ||
        p.oem_part_number?.toLowerCase().includes(search)
      )
      .slice(0, limit);
  }

  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async getCategory(id: number): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return this.categories.find(c => c.slug === slug) || null;
  }

  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    if (categoryId) {
      return this.subcategories.filter(s => s.category_id === categoryId);
    }
    return [...this.subcategories];
  }

  async getSubcategory(id: number): Promise<Subcategory | null> {
    return this.subcategories.find(s => s.id === id) || null;
  }

  async getBrands(): Promise<Brand[]> {
    return [...this.brands];
  }

  async getBrand(id: number): Promise<Brand | null> {
    return this.brands.find(b => b.id === id) || null;
  }

  async getProductImages(productId: number): Promise<ProductImage[]> {
    return this.productImages.filter(img => img.product_id === productId);
  }

  async getCart(sessionId: string): Promise<Cart | null> {
    for (const cart of Array.from(this.carts.values())) {
      if (cart.session_id === sessionId && cart.status === 'active') {
        return cart;
      }
    }
    return null;
  }

  async createCart(cart: InsertCart): Promise<Cart | null> {
    const newCart: Cart = {
      id: randomUUID(),
      user_id: cart.user_id || null,
      session_id: cart.session_id || null,
      status: cart.status || 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.carts.set(newCart.id, newCart);
    this.cartItems.set(newCart.id, []);
    return newCart;
  }

  async getCartItems(cartId: string): Promise<CartItem[]> {
    return this.cartItems.get(cartId) || [];
  }

  async addCartItem(item: InsertCartItem): Promise<CartItem | null> {
    const items = this.cartItems.get(item.cart_id) || [];
    const quantity = item.quantity || 1;
    
    const existing = items.find(i => i.product_id === item.product_id);
    if (existing) {
      existing.quantity += quantity;
      existing.updated_at = new Date();
      return existing;
    }

    const newItem: CartItem = {
      id: randomUUID(),
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: quantity,
      unit_price: item.unit_price,
      created_at: new Date(),
      updated_at: new Date(),
    };

    items.push(newItem);
    this.cartItems.set(item.cart_id, items);
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | null> {
    for (const items of Array.from(this.cartItems.values())) {
      const item = items.find(i => i.id === id);
      if (item) {
        item.quantity = quantity;
        item.updated_at = new Date();
        return item;
      }
    }
    return null;
  }

  async removeCartItem(id: string): Promise<boolean> {
    for (const [cartId, items] of Array.from(this.cartItems.entries())) {
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items.splice(index, 1);
        this.cartItems.set(cartId, items);
        return true;
      }
    }
    return false;
  }

  async clearCart(cartId: string): Promise<boolean> {
    this.cartItems.set(cartId, []);
    return true;
  }

  async createOrder(order: InsertOrder): Promise<Order | null> {
    const newOrder: Order = {
      id: randomUUID(),
      user_id: order.user_id || null,
      session_id: order.session_id || null,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email || null,
      customer_phone: order.customer_phone,
      delivery_address: order.delivery_address || null,
      delivery_county: order.delivery_county || null,
      delivery_town: order.delivery_town || null,
      total_amount: order.total_amount,
      status: order.status || 'pending',
      payment_method: order.payment_method || null,
      payment_status: order.payment_status || 'pending',
      whatsapp_sent: order.whatsapp_sent || false,
      whatsapp_message_id: order.whatsapp_message_id || null,
      notes: order.notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    this.orderItems.set(newOrder.id, []);
    return newOrder;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem | null> {
    const items = this.orderItems.get(orderItem.order_id) || [];
    const newItem: OrderItem = {
      id: randomUUID(),
      order_id: orderItem.order_id,
      product_id: orderItem.product_id || null,
      product_name: orderItem.product_name,
      product_sku: orderItem.product_sku || null,
      quantity: orderItem.quantity,
      unit_price: orderItem.unit_price,
      subtotal: orderItem.subtotal,
      created_at: new Date(),
    };
    items.push(newItem);
    this.orderItems.set(orderItem.order_id, items);
    return newItem;
  }

  async getOrders(sessionId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.session_id === sessionId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }

  // Blog methods (simplified for now)
  async getBlogPosts(): Promise<BlogPost[]> {
    return this.blogPosts.filter(p => p.status === 'published');
  }

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    return this.blogPosts.find(p => p.slug === slug && p.status === 'published') || null;
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return [...this.blogCategories];
  }
}
