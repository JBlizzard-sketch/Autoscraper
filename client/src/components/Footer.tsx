import { Facebook, Instagram, Twitter } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export default function Footer() {
  const categories = ["Engine Parts", "Brakes", "Filters", "Suspension", "Electrical"];
  const support = ["Contact Us", "Shipping Info", "Returns", "FAQ"];
  const company = ["About Us", "Careers", "Privacy Policy", "Terms of Service"];

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold" data-testid="text-footer-brand">
              AutoParts Kenya
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Your trusted source for genuine auto parts and accessories across Kenya.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
                data-testid="link-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
                data-testid="link-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
                data-testid="link-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid={`link-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid={`link-${item.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    data-testid={`link-${item.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="text-copyright">
            © 2025 AutoParts Kenya. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
