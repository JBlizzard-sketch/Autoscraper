import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  oemNumber?: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  vehicleCompat?: string;
}

export default function ProductCard({
  id,
  name,
  brand,
  oemNumber,
  price,
  imageUrl,
  inStock,
  vehicleCompat,
}: ProductCardProps) {
  const [, setLocation] = useLocation();

  const handleViewProduct = () => {
    setLocation(`/product/${id}`);
  };

  return (
    <Card
      className="group overflow-hidden transition-all hover-elevate cursor-pointer"
      onClick={handleViewProduct}
      data-testid={`card-product-${id}`}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            data-testid="img-product"
          />
          {brand && (
            <Badge
              className="absolute right-2 top-2"
              variant="secondary"
              data-testid="badge-brand"
            >
              {brand}
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="destructive" data-testid="badge-out-of-stock">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3
            className="mb-1 line-clamp-2 font-medium"
            data-testid="text-product-name"
          >
            {name}
          </h3>
          {oemNumber && (
            <p
              className="mb-2 font-mono text-xs text-muted-foreground"
              data-testid="text-oem-number"
            >
              OEM: {oemNumber}
            </p>
          )}
          {vehicleCompat && (
            <p className="mb-2 text-xs text-muted-foreground" data-testid="text-vehicle-compat">
              Fits: {vehicleCompat}
            </p>
          )}
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-lg font-semibold"
              data-testid="text-price"
            >
              KSh {price.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProduct();
          }}
          disabled={!inStock}
          data-testid="button-view-product"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          View Product
        </Button>
      </CardFooter>
    </Card>
  );
}
