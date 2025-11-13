import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Cart, CartItem } from '@shared/schema';

interface CartContextValue {
  cart: Cart | null;
  cartItems: CartItem[];
  sessionId: string;
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number, unitPrice: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Generate or retrieve session ID
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem('cart_session_id');
    if (existing) return existing;
    const newId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', newId);
    return newId;
  });

  // Fetch cart data
  const { data: cart, isLoading: cartLoading } = useQuery<Cart>({
    queryKey: ['/api/cart'],
    retry: 1,
  });

  // Fetch cart items
  const { data: cartItems = [], isLoading: itemsLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart/items', cart?.id],
    enabled: !!cart?.id,
    retry: 1,
  });

  // Calculate totals
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.unit_price) * item.quantity), 0
  );

  // Add to cart mutation
  const addMutation = useMutation({
    mutationFn: async ({ productId, quantity, unitPrice }: { 
      productId: number; 
      quantity: number; 
      unitPrice: string;
    }) => {
      return apiRequest('POST', '/api/cart/items', { 
        product_id: productId, 
        quantity, 
        unit_price: unitPrice 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
    },
  });

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiRequest('PATCH', `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
    },
  });

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('DELETE', `/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
    },
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!cart?.id) return;
      return apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/items'] });
    },
  });

  const value: CartContextValue = {
    cart: cart || null,
    cartItems,
    sessionId,
    itemCount,
    totalAmount,
    isLoading: cartLoading || itemsLoading,
    addToCart: async (productId, quantity, unitPrice) => {
      await addMutation.mutateAsync({ productId, quantity, unitPrice });
    },
    updateQuantity: async (itemId, quantity) => {
      await updateMutation.mutateAsync({ itemId, quantity });
    },
    removeItem: async (itemId) => {
      await removeMutation.mutateAsync(itemId);
    },
    clearCart: async () => {
      await clearMutation.mutateAsync();
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
