import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Product {
  id: number;
  name: string;
  price: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  year_range: string | null;
  brand_id: number;
  category_id: number;
  subcategory_id: number | null;
  engine_size: string | null;
  oem_part_number: string | null;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  available: boolean;
}

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [,  setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: images = [] } = useQuery<ProductImage[]>({
    queryKey: [`/api/products/${params?.id}/images`],
    enabled: !!params?.id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (data: {
      product_id: number;
      quantity: number;
      unit_price: number;
    }) => {
      return apiRequest("POST", "/api/cart/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product?.name} has been added to your cart.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add item to cart",
      });
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCartMutation.mutate({
      product_id: product.id,
      quantity,
      unit_price: parseFloat(product.price),
    });
  };

  const displayImages = images.length > 0 
    ? images 
    : product?.image_url 
    ? [{ id: "default", image_url: product.image_url, display_order: 0 }] 
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading product...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
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

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border bg-card">
              <img
                src={displayImages[selectedImage]?.image_url || "/placeholder.png"}
                alt={product.name}
                loading="eager"
                className="h-full w-full object-cover"
                data-testid="img-product-main"
              />
            </div>
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded border-2 ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1
                className="text-3xl font-bold"
                data-testid="text-product-name"
              >
                {product.name}
              </h1>
              {product.oem_part_number && (
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  OEM: {product.oem_part_number}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={product.available ? "default" : "destructive"}>
                {product.available ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    In Stock
                  </>
                ) : (
                  <>
                    <X className="mr-1 h-3 w-3" />
                    Out of Stock
                  </>
                )}
              </Badge>
              {product.stock_quantity > 0 && product.available && (
                <span className="text-sm text-muted-foreground">
                  {product.stock_quantity} units available
                </span>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-3xl font-bold" data-testid="text-product-price">
                KES {parseFloat(product.price).toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Specifications</h2>
              <div className="grid gap-2">
                {product.vehicle_make && (
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">Vehicle Make</span>
                    <span className="font-medium">{product.vehicle_make}</span>
                  </div>
                )}
                {product.vehicle_model && (
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">Vehicle Model</span>
                    <span className="font-medium">{product.vehicle_model}</span>
                  </div>
                )}
                {product.year_range && (
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">Year Range</span>
                    <span className="font-medium">{product.year_range}</span>
                  </div>
                )}
                {product.engine_size && (
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">Engine Size</span>
                    <span className="font-medium">{product.engine_size}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!product.available}
                    data-testid="button-decrease-quantity"
                  >
                    -
                  </Button>
                  <span
                    className="w-12 text-center font-semibold"
                    data-testid="text-quantity"
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stock_quantity || 1, quantity + 1)
                      )
                    }
                    disabled={!product.available}
                    data-testid="button-increase-quantity"
                  >
                    +
                  </Button>
                </div>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!product.available || addToCartMutation.isPending}
                  data-testid="button-add-to-cart"
                >
                  {addToCartMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
