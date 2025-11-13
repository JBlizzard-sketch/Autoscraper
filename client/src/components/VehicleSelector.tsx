import { useState } from "react";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function VehicleSelector() {
  const [, setLocation] = useLocation();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const makes = ["Toyota", "Nissan", "Honda", "Mazda", "Subaru"];
  const models = ["Corolla", "Fielder", "Premio", "Harrier", "Vitz"];
  const years = ["2024", "2023", "2022", "2021", "2020"];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (make) params.append("vehicle_make", make);
    setLocation(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold" data-testid="text-selector-title">
        Find Parts for Your Vehicle
      </h3>
      <div className="flex flex-col gap-4 md:flex-row">
        <Select value={make} onValueChange={setMake}>
          <SelectTrigger className="flex-1" data-testid="select-make">
            <SelectValue placeholder="Select Make" />
          </SelectTrigger>
          <SelectContent>
            {makes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={model} onValueChange={setModel} disabled={!make}>
          <SelectTrigger className="flex-1" data-testid="select-model">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear} disabled={!model}>
          <SelectTrigger className="flex-1" data-testid="select-year">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleSearch}
          disabled={!make}
          className="md:w-auto"
          data-testid="button-search-vehicle"
        >
          <Search className="mr-2 h-4 w-4" />
          Search Parts
        </Button>
      </div>
    </div>
  );
}
