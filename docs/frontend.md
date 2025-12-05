# Frontend Documentation

The frontend is a Vite + React + TypeScript application with Tailwind CSS for styling.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Client state management (cart)

## Development

```bash
npm run dev -w @summit-gear/frontend
```

Starts on http://localhost:5173 with API proxy to http://localhost:3001.

---

## File Structure

```
packages/frontend/src/
├── main.tsx                    # React entry point
├── App.tsx                     # Router + providers
├── vite-env.d.ts              # Vite types
├── api/
│   ├── client.ts              # Fetch wrapper
│   ├── products.ts            # Product API functions
│   └── categories.ts          # Category API functions
├── hooks/
│   ├── useProducts.ts         # React Query product hooks
│   ├── useCategories.ts       # React Query category hooks
│   └── useCart.ts             # Cart hook
├── stores/
│   └── cart.ts                # Zustand cart store
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Header, Footer, Layout
│   ├── products/              # Product components
│   └── cart/                  # Cart components
├── pages/
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   └── CartPage.tsx
├── lib/
│   └── utils.ts               # Utility functions
└── styles/
    └── globals.css            # Tailwind imports
```

---

## Routing

```typescript
// packages/frontend/src/App.tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/products" element={<ProductsPage />} />
  <Route path="/products/:id" element={<ProductDetailPage />} />
  <Route path="/category/:slug" element={<ProductsPage />} />
  <Route path="/cart" element={<CartPage />} />
</Routes>
```

---

## API Client

### Base Client

```typescript
// packages/frontend/src/api/client.ts
export async function apiClient<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api${endpoint}`);
  if (!response.ok) {
    const error = await response.json();
    throw new ApiClientError(error);
  }
  return response.json();
}
```

### Product API

```typescript
// packages/frontend/src/api/products.ts
export async function getProducts(params?: ProductFilters & {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Product>>

export async function getProduct(id: number): Promise<ApiSuccess<Product>>
```

### Category API

```typescript
// packages/frontend/src/api/categories.ts
export async function getCategories(): Promise<ApiSuccess<Category[]>>
export async function getCategoryBySlug(slug: string): Promise<ApiSuccess<Category>>
```

---

## React Query Hooks

### useProducts

```typescript
// packages/frontend/src/hooks/useProducts.ts

// List products with filters
const { data, isLoading, error } = useProducts(
  { categoryId: 1, search: 'jacket' },
  1,  // page
  20  // pageSize
);

// Single product
const { data, isLoading } = useProduct(productId);
```

### useCategories

```typescript
// packages/frontend/src/hooks/useCategories.ts
const { data: categories } = useCategories();
```

---

## Cart State (Zustand)

```typescript
// packages/frontend/src/stores/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number, size: string, color: string) => void;
  updateQuantity: (productId: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'summit-gear-cart' }  // localStorage key
  )
);
```

### Usage

```typescript
const { items, addItem, removeItem, getTotalItems } = useCartStore();

// Add to cart
addItem({
  productId: 1,
  name: 'Summit Tent Pro',
  priceInCents: 34999,
  size: '2P',
  color: 'Forest Green',
  imageUrl: '...'
});

// Get totals
const itemCount = getTotalItems();
const total = getTotalPrice();
```

---

## Components

### UI Components (`components/ui/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `disabled`, `onClick` | Primary/secondary/outline/ghost buttons |
| `Input` | `type`, `placeholder`, `value`, `onChange` | Text input |
| `Select` | `options`, `value`, `onChange` | Dropdown select |
| `Badge` | `variant` | Category/status badges |
| `Card` | `children`, `className` | Card container |
| `Skeleton` | `className` | Loading placeholder |

### Layout Components (`components/layout/`)

| Component | Description |
|-----------|-------------|
| `Header` | Site header with logo, nav, search, cart |
| `Footer` | Site footer with links |
| `Layout` | Wraps pages with Header + Footer |

### Product Components (`components/products/`)

| Component | Props | Description |
|-----------|-------|-------------|
| `ProductCard` | `product` | Product card for grid |
| `ProductGrid` | `products`, `loading` | Responsive product grid |
| `ProductFilters` | `filters`, `onChange` | Filter sidebar |
| `ProductDetail` | `product` | Full product view |
| `SizeSelector` | `sizes`, `selected`, `onChange` | Size buttons |
| `ColorSelector` | `colors`, `selected`, `onChange` | Color swatches |

### Cart Components (`components/cart/`)

| Component | Description |
|-----------|-------------|
| `CartDrawer` | Slide-out cart panel |
| `CartItem` | Single cart item row |
| `CartSummary` | Cart totals |

---

## Tailwind Theme

```javascript
// packages/frontend/tailwind.config.js
theme: {
  extend: {
    colors: {
      forest: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',  // Primary button color
        800: '#166534',
        900: '#14532d',
      },
      burnt: {
        500: '#ea580c',  // Accent color
        600: '#c2410c',
      },
    },
  },
}
```

### Common Classes

```html
<!-- Primary button -->
<button class="bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded">

<!-- Card -->
<div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">

<!-- Badge -->
<span class="bg-forest-100 text-forest-800 text-xs px-2 py-1 rounded-full">
```

---

## Utility Functions

```typescript
// packages/frontend/src/lib/utils.ts

// Merge Tailwind classes
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price from cents
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Usage
formatPrice(34999);  // "$349.99"
```

---

## Adding New Pages

1. Create page component:
   ```typescript
   // packages/frontend/src/pages/NewPage.tsx
   export function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. Export from index:
   ```typescript
   // packages/frontend/src/pages/index.ts
   export { NewPage } from './NewPage';
   ```

3. Add route:
   ```typescript
   // packages/frontend/src/App.tsx
   <Route path="/new" element={<NewPage />} />
   ```

## Adding New Components

1. Create component:
   ```typescript
   // packages/frontend/src/components/ui/NewComponent.tsx
   interface NewComponentProps {
     title: string;
   }

   export function NewComponent({ title }: NewComponentProps) {
     return <div className="...">{title}</div>;
   }
   ```

2. Export from index:
   ```typescript
   // packages/frontend/src/components/ui/index.ts
   export { NewComponent } from './NewComponent';
   ```

3. Use in pages:
   ```typescript
   import { NewComponent } from '@/components/ui';
   ```
