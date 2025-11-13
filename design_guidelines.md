# Design Guidelines: Auto-Parts E-Commerce Platform

## Design Approach
**Reference-Based Approach** - Drawing from modern auto-parts e-commerce leaders (RockAuto, AutoZone) combined with clean Shopify-style product displays. Focus on search-driven navigation, technical clarity, and trust signals.

---

## Core Design Elements

### A. Typography
**Font Families:**
- Primary: Inter or Work Sans (clean, technical readability)
- Monospace: JetBrains Mono for OEM numbers, SKUs, prices

**Hierarchy:**
- Hero headlines: 3xl to 5xl, font-bold
- Section titles: 2xl to 3xl, font-semibold
- Product names: lg to xl, font-medium
- Body text: base, font-normal
- Technical specs/OEM: sm, font-mono
- Labels/metadata: xs to sm, font-medium

### B. Layout System
**Spacing Primitives:** Use Tailwind units of **2, 4, 8, 12, 16** consistently
- Component padding: p-4, p-8
- Section spacing: py-12, py-16, py-20
- Grid gaps: gap-4, gap-6, gap-8
- Container max-widths: max-w-7xl for main content

**Grid Patterns:**
- Product grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Category cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Filter sidebar: Fixed width 280px on desktop, drawer on mobile

---

## C. Component Library

### Navigation
**Header:**
- Sticky top navigation with search bar prominence (60% width on desktop)
- Vehicle selector dropdown (Make → Model → Year) always accessible
- Cart icon with item count badge
- Categories mega-menu on hover/click
- Logo left-aligned, account/login right-aligned

**Search Bar:**
- Large, centered search with autocomplete
- Search by: Part name, OEM number, vehicle, category
- Recent searches and suggestions dropdown
- Clear visual distinction for search input (border-2, rounded-lg)

### Product Display
**Product Card (Grid View):**
- Product image (square aspect ratio, 1:1)
- Brand logo badge (top-right corner)
- Product name (2 lines max, truncate)
- OEM/SKU in monospace font
- Vehicle compatibility tags (if applicable)
- Price prominent (lg font-semibold)
- Stock status badge (In Stock/Out of Stock)
- Quick "Add to Cart" button overlay on hover

**Product Card (List View):**
- Horizontal layout: Image left (150px width) | Details center | Price/CTA right
- Technical specs visible (engine size, year range, category)
- Supplier name with trust badge

### Filtering & Search
**Filter Sidebar:**
- Collapsible filter groups (Category, Brand, Price, Vehicle Compatibility)
- Checkbox filters with item counts
- Price range slider
- Active filters shown as dismissible chips at top
- "Clear All Filters" link
- Sticky positioning on desktop

**Search Results:**
- Results count and sort options (Relevance, Price, Name)
- Grid/List view toggle
- Pagination or infinite scroll

### Product Detail Page
**Layout:**
- 2-column layout (60/40 split)
- Left: Image gallery with zoom capability, thumbnail carousel
- Right: Product info, specs table, compatibility chart, add to cart section

**Information Hierarchy:**
1. Product name (xl font-bold)
2. Brand + OEM number
3. Price (2xl font-bold)
4. Stock status + estimated delivery
5. Vehicle compatibility section (tabular format)
6. Technical specifications (table with alternating row backgrounds)
7. Description
8. Related products carousel

### Cart & Checkout
**Cart Display:**
- Line items with thumbnail, name, OEM, quantity selector, subtotal
- Remove item "X" button
- Sticky cart summary sidebar (desktop) or bottom bar (mobile)
- Clear shipping/tax breakdown
- WhatsApp checkout CTA alongside standard checkout

### Trust Elements
- Supplier badges with verified checkmarks
- Genuine parts indicators
- Return policy snippets
- Customer support contact (WhatsApp prominent)
- Secure payment badges

---

## D. Page Layouts

### Homepage
1. **Hero Section** (80vh): Large background image of auto parts warehouse or vehicle engine bay, overlaid with centered search bar and vehicle selector. Headline: "Find the Right Parts for Your Vehicle"
2. **Category Grid** (6-8 cards): Engine, Suspension, Brakes, Filters, Transmission, Electrical - each with icon and product count
3. **Featured Products** (carousel or 4-column grid)
4. **Shop by Vehicle Make** (logo grid of popular brands)
5. **Why Choose Us** (3-column features: Genuine Parts, Fast Delivery, Expert Support)
6. **Popular Brands** (logo carousel)
7. **Footer** with categories, contact, WhatsApp integration

### Category/Search Pages
- Breadcrumb navigation
- Filter sidebar (left, 280px)
- Main content area: Results header + product grid
- No forced viewport heights - natural scroll

### Product Detail
- Full-width layout with max-w-7xl container
- Image gallery prominence
- Tabbed content (Specs, Compatibility, Reviews)
- Related products section at bottom

---

## Images

**Hero Image:**
- Full-width background image (1920x800px minimum)
- Professional automotive parts warehouse or close-up of quality parts
- Subtle overlay (dark gradient) for text readability
- Buttons on hero: Blurred background (backdrop-blur-sm bg-white/20)

**Product Images:**
- White/light gray backgrounds for consistency
- Multiple angles where available
- Zoom functionality on product pages
- Fallback placeholder for missing images (parts icon silhouette)

**Category Images:**
- Illustrative icons or actual part photos for each category
- Consistent style (either all illustrated or all photographic)

**Trust Badges:**
- Supplier logos, payment provider badges
- Certification marks (if applicable)

---

## Key Interactions
- Hover states: Subtle scale (scale-105) and shadow increase for cards
- Search autocomplete appears smoothly (transition duration-200)
- Filter updates: Instant results with skeleton loaders
- Add to cart: Success toast notification
- Minimal animations - focus on speed and clarity

---

This design balances technical precision (crucial for auto parts) with modern e-commerce UX, ensuring customers can quickly find compatible parts while building trust through clear information architecture.