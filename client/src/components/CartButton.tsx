import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

interface CartButtonProps {
  onClick: () => void;
}

export function CartButton({ onClick }: CartButtonProps) {
  const { itemCount, isLoading } = useCart();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      className="relative"
      data-testid="button-cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {!isLoading && itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          data-testid="badge-cart-count"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
}
