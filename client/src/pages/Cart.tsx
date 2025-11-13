import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, ShoppingBag } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
}

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  oem_part_number: string | null;
  available: boolean;
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cartData, isLoading } = useQuery<{
    cart: any;
    items: CartItem[];
  }>({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/cart/items/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update quantity",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cart/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove item",
      });
    },
  });

  const cartItems = cartData?.items || [];
  const total = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unit_price) * item.quantity,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading cart...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="py-20 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground">
              Add some products to get started
            </p>
            <Button className="mt-6" onClick={() => setLocation("/products")}>
              Browse Products
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold" data-testid="text-cart-title">
          Shopping Cart
        </h1>

        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) =>
                  updateQuantityMutation.mutate({ id: item.id, quantity })
                }
                onRemove={() => removeItemMutation.mutate(item.id)}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              
              <div className="space-y-2 border-b pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    KES {total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Items ({cartItems.length})
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-b pb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold" data-testid="text-cart-total">
                  KES {total.toLocaleString()}
                </span>
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => setLocation("/checkout")}
                data-testid="button-proceed-checkout"
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setLocation("/products")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { data: product } = useQuery<Product>({
    queryKey: [`/api/products/${item.product_id}`],
  });

  const subtotal = parseFloat(item.unit_price) * item.quantity;

  return (
    <div
      className="flex gap-4 rounded-lg border bg-card p-4"
      data-testid={`card-cart-item-${item.id}`}
    >
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded border">
        <img
          src={product?.image_url || "/placeholder.png"}
          alt={product?.name || "Product"}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-semibold">{product?.name || "Loading..."}</h3>
          {product?.oem_part_number && (
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              OEM: {product.oem_part_number}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
              data-testid={`button-decrease-${item.id}`}
            >
              -
            </Button>
            <span className="w-12 text-center" data-testid={`text-quantity-${item.id}`}>
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              data-testid={`button-increase-${item.id}`}
            >
              +
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">
              KES {subtotal.toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              data-testid={`button-remove-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
