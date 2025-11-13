import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import heroImage from '@assets/generated_images/Auto_parts_warehouse_hero_2862c98e.png'

export default function Hero() {
  return (
    <div className="relative h-[80vh] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
      </div>

      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="max-w-2xl space-y-6 text-white">
            <h1
              className="text-5xl font-bold leading-tight md:text-6xl"
              data-testid="text-hero-title"
            >
              Find the Right Parts for Your Vehicle
            </h1>
            <p
              className="text-xl text-white/90"
              data-testid="text-hero-subtitle"
            >
              Browse our extensive catalog of genuine auto parts. Fast delivery across Kenya.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                data-testid="button-browse-parts"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Parts
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                data-testid="button-contact"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
