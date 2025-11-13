import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function FilterSidebar() {
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  //todo: remove mock functionality
  const brands = ["Toyota", "Denso", "NGK", "Castrol", "Bosch"];
  const categories = ["Engine", "Brakes", "Filters", "Suspension", "Electrical"];

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setPriceRange([0, 50000]);
    console.log('Filters cleared');
  };

  const activeFiltersCount = selectedBrands.length + selectedCategories.length;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="text-filters-title">
          Filters
        </h2>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            Clear All
          </Button>
        )}
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map((brand) => (
            <Badge
              key={brand}
              variant="secondary"
              className="gap-1"
              data-testid={`badge-filter-${brand.toLowerCase()}`}
            >
              {brand}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleBrand(brand)}
              />
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="gap-1"
              data-testid={`badge-filter-${category.toLowerCase()}`}
            >
              {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleCategory(category)}
              />
            </Badge>
          ))}
        </div>
      )}

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Price Range</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={50000}
            step={500}
            className="w-full"
            data-testid="slider-price"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span data-testid="text-price-min">KSh {priceRange[0].toLocaleString()}</span>
            <span data-testid="text-price-max">KSh {priceRange[1].toLocaleString()}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Brand</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-4">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
                data-testid={`checkbox-brand-${brand.toLowerCase()}`}
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="cursor-pointer text-sm font-normal"
              >
                {brand}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <h3 className="font-medium">Category</h3>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-4">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
                data-testid={`checkbox-category-${category.toLowerCase()}`}
              />
              <Label
                htmlFor={`category-${category}`}
                className="cursor-pointer text-sm font-normal"
              >
                {category}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
