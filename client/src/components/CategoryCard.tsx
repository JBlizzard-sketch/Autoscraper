import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface CategoryCardProps {
  icon: LucideIcon;
  name: string;
  count: number;
  id?: number;
  onClick?: () => void;
}

export default function CategoryCard({ icon: Icon, name, count, id, onClick }: CategoryCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card
      className="cursor-pointer transition-all hover-elevate active-elevate-2"
      onClick={() => {
        if (id) {
          setLocation(`/products?category_id=${id}`);
        } else {
          setLocation('/products');
        }
        onClick?.();
      }}
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mb-1 font-semibold" data-testid="text-category-name">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground" data-testid="text-category-count">
          {count} products
        </p>
      </CardContent>
    </Card>
  );
}
