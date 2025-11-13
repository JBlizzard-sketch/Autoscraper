import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VehicleSelector from "@/components/VehicleSelector";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  Disc,
  Filter,
  Zap,
  Settings,
  Droplets,
  Loader2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const CATEGORY_ICONS: Record<string, any> = {
  "Engine Parts": Wrench,
  "Brakes": Disc,
  "Filters": Filter,
  "Electrical": Zap,
  "Suspension": Settings,
  "Fluids": Droplets,
  "Accessories": Settings,
  "Body Parts": Wrench,
  "Interior": Settings,
  "Lighting": Zap,
};

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  year_range: string | null;
  brand_id: number;
  category_id: number;
  oem_part_number: string | null;
  image_url: string | null;
  available: boolean;
}

export default function Home() {
  interface CategoryWithCount {
    id: number;
    name: string;
    slug: string;
    productCount: number;
  }

  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<CategoryWithCount[]>({
    queryKey: ['/api/categories-with-counts'],
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery<{ data: Product[], total: number }>({
    queryKey: ['/api/products?limit=6'],
  });

  const featuredProducts = productsResponse?.data || [];

  const categories = categoriesData.map((cat) => ({
    icon: CATEGORY_ICONS[cat.name] || Wrench,
    name: cat.name,
    count: cat.productCount,
    id: cat.id,
  }));

  if (categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Hero />
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading products...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <main className="container mx-auto max-w-7xl px-4">
        <section className="py-12">
          <VehicleSelector />
        </section>

        <section className="py-12">
          <h2 className="mb-8 text-3xl font-semibold" data-testid="text-categories-title">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                icon={category.icon}
                name={category.name}
                count={category.count}
              />
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-semibold" data-testid="text-featured-title">
              Featured Products
            </h2>
            <a
              href="#"
              className="text-sm font-medium text-primary hover:underline"
              data-testid="link-view-all"
            >
              View All
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id.toString()}
                name={product.name}
                brand={product.brand_id.toString()}
                oemNumber={product.oem_part_number || ''}
                price={parseFloat(product.price)}
                imageUrl={product.image_url || ''}
                inStock={product.available}
                vehicleCompat={`${product.vehicle_make || ''} ${product.vehicle_model || ''} ${product.year_range || ''}`.trim()}
              />
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-lg bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 text-3xl font-bold" data-testid="text-cta-title">
              Need Help Finding the Right Part?
            </h2>
            <p className="mb-6 text-lg opacity-90" data-testid="text-cta-subtitle">
              Our experts are ready to assist you. Contact us via WhatsApp for personalized support.
            </p>
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-white/90"
              data-testid="button-whatsapp-cta"
            >
              <SiWhatsapp className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
