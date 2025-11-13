import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

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

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
}

export default function Products() {
  const [location] = useLocation();
  const [, params] = useRoute("/products/:categorySlug");
  
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategoryId = urlParams.get("category_id") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId || "all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [vehicleMake, setVehicleMake] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get("category_id");
    if (categoryId && categoryId !== selectedCategory) {
      setSelectedCategory(categoryId);
    }
  }, [location]);

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: brandsData = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedCategory && selectedCategory !== "all") params.append("category_id", selectedCategory);
    if (selectedBrand && selectedBrand !== "all") params.append("brand_id", selectedBrand);
    if (vehicleMake) params.append("vehicle_make", vehicleMake);
    params.append("min_price", priceRange[0].toString());
    params.append("max_price", priceRange[1].toString());
    params.append("page", page.toString());
    params.append("limit", "24");
    return params.toString();
  };

  const { data: productsResponse, isLoading } = useQuery<{
    data: Product[];
    total: number;
  }>({
    queryKey: [
      "/api/products",
      { searchQuery, selectedCategory, selectedBrand, vehicleMake, priceRange, page },
    ],
    queryFn: async () => {
      const queryString = buildQueryString();
      const response = await fetch(`/api/products?${queryString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  const products = productsResponse?.data || [];
  const total = productsResponse?.total || 0;
  const totalPages = Math.ceil(total / 24);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPriceRange([0, 200000]);
    setVehicleMake("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold" data-testid="text-products-title">
            Auto Parts Catalog
          </h1>
          <p className="text-muted-foreground" data-testid="text-products-count">
            {total} {total === 1 ? "product" : "products"} found
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <aside className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  data-testid="button-clear-filters"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Products</Label>
                  <Input
                    id="search"
                    type="search"
                    placeholder="Part name, OEM number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-products"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesData.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger id="brand" data-testid="select-brand">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brandsData.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle">Vehicle Make</Label>
                  <Input
                    id="vehicle"
                    placeholder="e.g., Toyota, Nissan"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    data-testid="input-vehicle-make"
                  />
                </div>

                <div>
                  <Label>
                    Price Range: KES {priceRange[0].toLocaleString()} - KES{" "}
                    {priceRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    min={0}
                    max={200000}
                    step={1000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                    data-testid="slider-price-range"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">
                  No products found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id.toString()}
                      name={product.name}
                      brand={product.vehicle_make || ""}
                      oemNumber={product.oem_part_number || ""}
                      price={parseFloat(product.price)}
                      imageUrl={product.image_url || ""}
                      inStock={product.available}
                      vehicleCompat={`${product.vehicle_make || ""} ${
                        product.vehicle_model || ""
                      } ${product.year_range || ""}`.trim()}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
