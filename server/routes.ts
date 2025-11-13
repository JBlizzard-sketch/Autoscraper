import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/products", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category_id: req.query.category_id ? Number(req.query.category_id) : undefined,
        subcategory_id: req.query.subcategory_id ? Number(req.query.subcategory_id) : undefined,
        brand_id: req.query.brand_id ? Number(req.query.brand_id) : undefined,
        vehicle_make: req.query.vehicle_make as string,
        vehicle_model: req.query.vehicle_model as string,
        min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
        max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
        available: req.query.available ? req.query.available === 'true' : undefined,
      };
      
      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 24,
      };
      
      const result = await storage.getProducts(filters, pagination);
      res.json(result);
    } catch (error) {
      console.error('Error in /api/products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error in /api/products/:id:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  app.get("/api/products/:id/images", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      
      // Validate product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Get product images
      const images = await storage.getProductImages(productId);
      res.json(images);
    } catch (error) {
      console.error('Error in /api/products/:id/images:', error);
      res.status(500).json({ error: 'Failed to fetch product images' });
    }
  });
  
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const results = await storage.searchProducts(query, limit);
      res.json(results);
    } catch (error) {
      console.error('Error in /api/search:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
  
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error in /api/categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error in /api/categories/:id:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });
  
  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error in /api/categories/slug/:slug:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });
  
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error('Error in /api/brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands' });
    }
  });
  
  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brand = await storage.getBrand(Number(req.params.id));
      if (!brand) {
        return res.status(404).json({ error: 'Brand not found' });
      }
      res.json(brand);
    } catch (error) {
      console.error('Error in /api/brands/:id:', error);
      res.status(500).json({ error: 'Failed to fetch brand' });
    }
  });
  
  // Subcategories endpoints
  app.get("/api/subcategories", async (req, res) => {
    try {
      const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
      const subcategories = await storage.getSubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error('Error in /api/subcategories:', error);
      res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
  });
  
  // Category aggregation endpoint - returns categories with product counts
  app.get("/api/categories-with-counts", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Get product count for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const result = await storage.getProducts({ category_id: category.id }, { page: 1, limit: 1 });
          return {
            ...category,
            productCount: result.total,
          };
        })
      );
      
      res.json(categoriesWithCounts);
    } catch (error) {
      console.error('Error in /api/categories-with-counts:', error);
      res.status(500).json({ error: 'Failed to fetch categories with counts' });
    }
  });
  
  // Blog endpoints
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error('Error in /api/blog/posts:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });
  
  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: 'Blog post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error in /api/blog/posts/:slug:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  });
  
  app.get("/api/blog/categories", async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error in /api/blog/categories:', error);
      res.status(500).json({ error: 'Failed to fetch blog categories' });
    }
  });
  
  function getSessionId(req: any): string {
    if (!req.session.id) {
      req.session.id = randomBytes(16).toString('hex');
    }
    return req.session.id;
  }
  
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      let cart = await storage.getCart(sessionId);
      
      if (!cart) {
        cart = await storage.createCart({ session_id: sessionId, status: 'active' });
      }
      
      if (!cart) {
        return res.status(500).json({ error: 'Failed to create cart' });
      }
      
      const items = await storage.getCartItems(cart.id);
      res.json({ cart, items });
    } catch (error) {
      console.error('Error in /api/cart:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  });
  
  const addCartItemSchema = z.object({
    product_id: z.number().int('Product ID must be an integer'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price cannot be negative'),
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      const result = addCartItemSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }
      
      const { product_id, quantity, unit_price } = result.data;
      
      const sessionId = getSessionId(req);
      let cart = await storage.getCart(sessionId);
      
      if (!cart) {
        cart = await storage.createCart({ session_id: sessionId, status: 'active' });
      }
      
      if (!cart) {
        return res.status(500).json({ error: 'Failed to create cart' });
      }
      
      const item = await storage.addCartItem({
        cart_id: cart.id,
        product_id,
        quantity,
        unit_price: unit_price.toString(),
      });
      
      if (!item) {
        return res.status(500).json({ error: 'Failed to add item to cart' });
      }
      
      res.json(item);
    } catch (error: any) {
      console.error('Error in /api/cart/items POST:', error);
      res.status(500).json({ error: error.message || 'Failed to add item to cart' });
    }
  });
  
  const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  });

  app.patch("/api/cart/items/:id", async (req, res) => {
    try {
      const result = updateCartItemSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }
      
      const { quantity } = result.data;
      
      const item = await storage.updateCartItem(req.params.id, quantity);
      
      if (!item) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      res.json(item);
    } catch (error: any) {
      console.error('Error in /api/cart/items/:id PATCH:', error);
      res.status(500).json({ error: error.message || 'Failed to update cart item' });
    }
  });
  
  app.delete("/api/cart/items/:id", async (req, res) => {
    try {
      const success = await storage.removeCartItem(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error in /api/cart/items/:id DELETE:', error);
      res.status(500).json({ error: 'Failed to remove cart item' });
    }
  });
  
  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cart = await storage.getCart(sessionId);
      
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      
      const success = await storage.clearCart(cart.id);
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to clear cart' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error in /api/cart DELETE:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  });
  
  const createOrderSchema = z.object({
    customer_name: z.string().min(1, 'Customer name is required'),
    customer_email: z.string().email('Invalid email').optional(),
    customer_phone: z.string().min(10, 'Valid phone number is required'),
    delivery_address: z.string().optional(),
    notes: z.string().optional(),
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const result = createOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ error: validationError.message });
      }
      
      const sessionId = getSessionId(req);
      const cart = await storage.getCart(sessionId);
      
      if (!cart) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      const cartItems = await storage.getCartItems(cart.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.unit_price) * item.quantity);
      }, 0);
      
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const order = await storage.createOrder({
        session_id: sessionId,
        order_number: orderNumber,
        customer_name: result.data.customer_name,
        customer_email: result.data.customer_email,
        customer_phone: result.data.customer_phone,
        delivery_address: result.data.delivery_address,
        total_amount: totalAmount.toString(),
        status: 'pending',
        payment_method: 'whatsapp',
        payment_status: 'pending',
        notes: result.data.notes,
      });
      
      if (!order) {
        return res.status(500).json({ error: 'Failed to create order' });
      }
      
      for (const item of cartItems) {
        const product = await storage.getProduct(item.product_id);
        await storage.createOrderItem({
          order_id: order.id,
          product_id: item.product_id,
          product_name: product?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: (parseFloat(item.unit_price) * item.quantity).toString(),
        });
      }
      
      await storage.clearCart(cart.id);
      
      const orderItems = await storage.getOrderItems(order.id);
      res.json({ order, items: orderItems });
    } catch (error: any) {
      console.error('Error in /api/orders POST:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  });
  
  app.get("/api/orders", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const orders = await storage.getOrders(sessionId);
      res.json(orders);
    } catch (error) {
      console.error('Error in /api/orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const items = await storage.getOrderItems(order.id);
      res.json({ order, items });
    } catch (error) {
      console.error('Error in /api/orders/:id:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
