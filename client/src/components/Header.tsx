import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { CartButton } from "@/components/CartButton";
import { CartDrawer } from "@/components/CartDrawer";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <button onClick={() => setLocation("/")} className="flex items-center gap-2" data-testid="link-home">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-lg font-bold text-primary-foreground">AP</span>
              </div>
              <span className="hidden text-lg font-semibold md:inline-block">
                AutoParts Kenya
              </span>
            </button>
            <nav className="hidden items-center gap-6 md:flex">
              <button onClick={() => setLocation("/products")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-products">
                Products
              </button>
              <button onClick={() => setLocation("/blog")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-blog">
                Blog
              </button>
            </nav>
          </div>

          <div className="flex flex-1 items-center gap-4 md:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by part name, OEM number, or vehicle..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </div>
      
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
