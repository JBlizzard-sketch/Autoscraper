import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cartItems, itemCount, totalAmount, updateQuantity, removeItem, isLoading } = useCart();

  // Fetch product details for cart items
  const productIds = cartItems.map(item => item.product_id);
  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ['/api/products', { ids: productIds.join(',') }],
    enabled: productIds.length > 0,
  });

  const products = productsData?.data || [];
  const productsMap = new Map(products.map((p: Product) => [p.id, p]));

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {itemCount > 0 && (
              <span className="text-muted-foreground text-base font-normal">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Loading cart...</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some products to get started
              </p>
            </div>
            <Button onClick={onClose} data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <Separator className="my-4" />
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = productsMap.get(item.product_id);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0"
                      data-testid={`cart-item-${item.id}`}
                    >
                      {product?.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {product?.name || 'Product'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          KES {parseFloat(item.unit_price).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm" data-testid={`quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 ml-auto text-destructive"
                            onClick={() => removeItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          KES {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span data-testid="text-cart-total">KES {totalAmount.toLocaleString()}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                data-testid="button-checkout"
                onClick={() => {
                  window.location.href = '/checkout';
                }}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                data-testid="button-continue-shopping-footer"
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
