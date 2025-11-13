import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatWhatsAppMessage, generateWhatsAppLink } from "@/lib/whatsapp";

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
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { data: cartData, isLoading } = useQuery<{
    cart: any;
    items: CartItem[];
  }>({
    queryKey: ["/api/cart"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      customer_name: string;
      customer_phone: string;
      customer_email?: string;
      delivery_address?: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      const message = formatWhatsAppMessage(data.order, data.items);
      const whatsappLink = generateWhatsAppLink("254700000000", message);
      
      window.open(whatsappLink, "_blank");
      
      toast({
        title: "Order created!",
        description: "Opening WhatsApp to confirm your order...",
      });
      
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create order",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in your name and phone number",
      });
      return;
    }
    
    createOrderMutation.mutate({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      delivery_address: deliveryAddress || undefined,
      notes: notes || undefined,
    });
  };

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
            <span className="ml-2 text-lg">Loading...</span>
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
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <Button className="mt-4" onClick={() => setLocation("/products")}>
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

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold" data-testid="text-checkout-title">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Customer Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  data-testid="input-customer-name"
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0712345678"
                  required
                  data-testid="input-customer-phone"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll contact you via WhatsApp to confirm your order
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  data-testid="input-customer-email"
                />
              </div>

              <div>
                <Label htmlFor="address">Delivery Address (Optional)</Label>
                <Textarea
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  rows={3}
                  data-testid="textarea-delivery-address"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or notes"
                  rows={2}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <CheckoutItem key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span data-testid="text-checkout-total">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/cart")}
            >
              Back to Cart
            </Button>
            <Button
              type="submit"
              className="flex-1"
              size="lg"
              disabled={createOrderMutation.isPending}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <SiWhatsapp className="mr-2 h-4 w-4" />
                  Confirm via WhatsApp
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-primary/10 p-4 text-sm">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                After submitting, you'll be redirected to WhatsApp to confirm
                your order with our team. We'll respond promptly to finalize the
                details and arrange delivery.
              </p>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

function CheckoutItem({ item }: { item: CartItem }) {
  const { data: product } = useQuery<Product>({
    queryKey: [`/api/products/${item.product_id}`],
  });

  const subtotal = parseFloat(item.unit_price) * item.quantity;

  return (
    <div className="flex justify-between border-b py-2">
      <span>
        {product?.name || "Loading..."} × {item.quantity}
      </span>
      <span className="font-medium">KES {subtotal.toLocaleString()}</span>
    </div>
  );
}
