# Shared Types Documentation

The `@summit-gear/shared` package contains TypeScript types used by both frontend and backend.

## Package Location

```
packages/shared/
├── src/
│   ├── index.ts           # Re-exports all types
│   └── types/
│       ├── product.ts     # Product types
│       ├── category.ts    # Category types
│       ├── cart.ts        # Cart types
│       └── api.ts         # API response types
└── dist/                  # Compiled output
```

## Usage

```typescript
// In backend or frontend
import type { Product, Category, CartItem } from '@summit-gear/shared';
import { CATEGORIES } from '@summit-gear/shared';
```

---

## Product Types

### Product

```typescript
export interface Product {
  id: number;
  sku: string;                 // e.g., "CMP-0001"
  name: string;                // e.g., "Summit Ultralight Tent Pro"
  description: string;
  categoryId: number;          // FK to categories
  subcategory: string;         // e.g., "Tents", "Jackets"
  priceInCents: number;        // e.g., 34999 = $349.99
  sizes: string[];             // e.g., ["S", "M", "L", "XL"]
  colors: string[];            // e.g., ["Forest Green", "Black"]
  imageUrl: string;            // Placeholder URL
  stockQuantity: number;       // Available inventory
  weightOz: number;            // Weight in ounces
  createdAt: string;           // ISO date string
}
```

### ProductCreate

```typescript
// For creating new products (no id or createdAt)
export type ProductCreate = Omit<Product, 'id' | 'createdAt'>;
```

### ProductFilters

```typescript
export interface ProductFilters {
  categoryId?: number;
  subcategory?: string;
  minPrice?: number;           // In cents
  maxPrice?: number;           // In cents
  search?: string;             // Searches name and description
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Category Types

### Category

```typescript
export interface Category {
  id: number;
  name: string;                // e.g., "Camping & Hiking"
  slug: string;                // e.g., "camping-hiking"
  description: string;
}
```

### CATEGORIES Constant

```typescript
// Seed data for database initialization
export const CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Camping & Hiking',
    slug: 'camping-hiking',
    description: 'Tents, sleeping bags, backpacks, and trail essentials'
  },
  {
    name: 'Climbing',
    slug: 'climbing',
    description: 'Harnesses, ropes, carabiners, and climbing gear'
  },
  {
    name: 'Apparel',
    slug: 'apparel',
    description: 'Jackets, pants, base layers, and outdoor clothing'
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Hiking boots, trail runners, and outdoor shoes'
  },
  {
    name: 'Cycling',
    slug: 'cycling',
    description: 'Helmets, jerseys, shorts, and bike accessories'
  },
  {
    name: 'Water Sports',
    slug: 'water-sports',
    description: 'Kayaking, paddleboarding, and water gear'
  },
  {
    name: 'Winter Sports',
    slug: 'winter-sports',
    description: 'Ski and snowboard apparel and accessories'
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Headlamps, water bottles, tools, and more'
  },
];
```

---

## Cart Types

### CartItem

```typescript
export interface CartItem {
  productId: number;
  name: string;                // Cached for display
  priceInCents: number;        // Cached at time of add
  size: string;                // Selected size
  color: string;               // Selected color
  quantity: number;
  imageUrl: string;            // Cached for display
}
```

### Cart

```typescript
export interface Cart {
  items: CartItem[];
  totalItems: number;          // Sum of quantities
  totalPriceInCents: number;   // Sum of (price * quantity)
}
```

---

## API Response Types

### PaginatedResponse

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Usage
type ProductListResponse = PaginatedResponse<Product>;
// {
//   data: Product[],
//   pagination: { page: 1, pageSize: 20, total: 100, totalPages: 5 }
// }
```

### ApiSuccess

```typescript
export interface ApiSuccess<T> {
  data: T;
}

// Usage
type SingleProductResponse = ApiSuccess<Product>;
// { data: Product }

type CategoryListResponse = ApiSuccess<Category[]>;
// { data: Category[] }
```

### ApiError

```typescript
export interface ApiError {
  error: string;               // Error code: "NOT_FOUND", "VALIDATION_ERROR"
  message: string;             // Human-readable message
  statusCode: number;          // HTTP status: 400, 404, 500
}

// Example
// {
//   error: "NOT_FOUND",
//   message: "Product with id 999 not found",
//   statusCode: 404
// }
```

---

## Building the Package

After modifying types:

```bash
npm run build -w @summit-gear/shared
```

This compiles TypeScript to `dist/` and generates `.d.ts` declaration files.

## Adding New Types

1. Create or modify file in `packages/shared/src/types/`:
   ```typescript
   // packages/shared/src/types/order.ts
   export interface Order {
     id: number;
     items: CartItem[];
     totalInCents: number;
     status: 'pending' | 'confirmed' | 'shipped';
     createdAt: string;
   }
   ```

2. Export from index:
   ```typescript
   // packages/shared/src/index.ts
   export type { Order } from './types/order.js';
   ```

3. Rebuild:
   ```bash
   npm run build -w @summit-gear/shared
   ```

4. Use in backend/frontend:
   ```typescript
   import type { Order } from '@summit-gear/shared';
   ```
