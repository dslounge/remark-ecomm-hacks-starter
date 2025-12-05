# Outdoor E-Commerce Site Plan

## Executive Summary

This document outlines the implementation plan for "Summit Gear Co." - a fake outdoor e-commerce site built as a hackathon project.

- Goal: Build a fully functional fake outdoor store with 100 products, ready for AI feature integration

- Architecture uses npm workspaces monorepo with shared TypeScript types
  - Three packages: @summit-gear/shared, @summit-gear/backend, @summit-gear/frontend
  - Shared types ensure consistency between frontend and backend

- SQLite database stores products with realistic outdoor gear data
  - 8 categories: camping, climbing, apparel, footwear, cycling, water sports, winter sports, accessories
  - 100 products with names, descriptions, prices, sizes, colors, stock levels

- Backend is Express + TypeScript with REST API
  - Paginated product listing with filters and search
  - Category endpoints
  - Uses better-sqlite3 for synchronous database access

- Frontend is Vite + React + TypeScript + Tailwind
  - Product listing with category/filter sidebar
  - Product detail pages with size/color selection
  - Shopping cart with localStorage persistence via Zustand

- Seed script generates 100 realistic products programmatically
  - Deterministic random for reproducibility
  - Combines brand prefixes, materials, product types, model suffixes

---

## Dependency Graph

```
STEP-01 (Monorepo Setup)
    │
    ▼
STEP-02 (Shared Types)
    │
    ├────────────────────────────────────────┐
    │                                        │
    ▼                                        ▼
STEP-03 (Backend Init)                  STEP-06 (Frontend Init)
    │                                        │
    ▼                                        ▼
STEP-04 (Database + Seed)               STEP-07 (API Client)
    │                                        │
    ▼                                        ▼
STEP-05 (Backend API)                   STEP-08 (UI Components)
    │                                        │
    │                                        ▼
    │                                   STEP-09 (Cart Feature)
    │                                        │
    │                                        ▼
    │                                   STEP-10 (Product Components)
    │                                        │
    │                                        ▼
    │                                   STEP-11 (Pages + Routing)
    │                                        │
    └──────────────┬─────────────────────────┘
                   │
                   ▼
            STEP-12 (Integration)
```

**Parallel Execution Opportunities:**
- After STEP-02: STEP-03 and STEP-06 can run in parallel
- Backend track (03→04→05) and Frontend track (06→07→08→09→10→11) are independent
- STEP-12 requires both tracks complete

---

## STEP-01: Monorepo Foundation

**Prerequisites:** None

**Description:** Initialize npm workspaces monorepo with base TypeScript configuration.

**Files to Create:**

| File | Purpose |
|------|---------|
| `package.json` | Root package with workspaces config |
| `tsconfig.base.json` | Shared TypeScript configuration |
| `.gitignore` | Update with node_modules, dist, .env, *.db |

**Specifications:**

Root `package.json`:
```json
{
  "name": "summit-gear-co",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspaces",
    "db:init": "npm run db:init -w @summit-gear/backend",
    "db:seed": "npm run db:seed -w @summit-gear/backend",
    "db:reset": "npm run db:init -w @summit-gear/backend && npm run db:seed -w @summit-gear/backend"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

Create directory structure:
```
packages/
├── shared/
├── backend/
└── frontend/
```

**Verification:**
- `npm install` runs without error (even if workspaces are empty)
- Directory structure exists

---

## STEP-02: Shared Types Package

**Prerequisites:** STEP-01

**Description:** Create the shared types package with all TypeScript interfaces for products, categories, cart, and API responses.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/shared/package.json` | Package configuration |
| `packages/shared/tsconfig.json` | TypeScript config extending base |
| `packages/shared/src/index.ts` | Re-exports all types |
| `packages/shared/src/types/product.ts` | Product and related types |
| `packages/shared/src/types/category.ts` | Category types and data |
| `packages/shared/src/types/cart.ts` | Cart item types |
| `packages/shared/src/types/api.ts` | API response wrapper types |

**Specifications:**

`packages/shared/package.json`:
```json
{
  "name": "@summit-gear/shared",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Product Types (`product.ts`):**
```typescript
export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  categoryId: number;
  subcategory: string;
  priceInCents: number;
  sizes: string[];
  colors: string[];
  imageUrl: string;
  stockQuantity: number;
  weightOz: number;
  createdAt: string;
}

export type ProductCreate = Omit<Product, 'id' | 'createdAt'>;

export interface ProductFilters {
  categoryId?: number;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Category Types (`category.ts`):**
```typescript
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

// Seed data - exported for use in backend seeding
export const CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Camping & Hiking', slug: 'camping-hiking', description: 'Tents, sleeping bags, backpacks, and trail essentials' },
  { name: 'Climbing', slug: 'climbing', description: 'Harnesses, ropes, carabiners, and climbing gear' },
  { name: 'Apparel', slug: 'apparel', description: 'Jackets, pants, base layers, and outdoor clothing' },
  { name: 'Footwear', slug: 'footwear', description: 'Hiking boots, trail runners, and outdoor shoes' },
  { name: 'Cycling', slug: 'cycling', description: 'Helmets, jerseys, shorts, and bike accessories' },
  { name: 'Water Sports', slug: 'water-sports', description: 'Kayaking, paddleboarding, and water gear' },
  { name: 'Winter Sports', slug: 'winter-sports', description: 'Ski and snowboard apparel and accessories' },
  { name: 'Accessories', slug: 'accessories', description: 'Headlamps, water bottles, tools, and more' },
];
```

**Cart Types (`cart.ts`):**
```typescript
export interface CartItem {
  productId: number;
  name: string;
  priceInCents: number;
  size: string;
  color: string;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPriceInCents: number;
}
```

**API Types (`api.ts`):**
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

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiSuccess<T> {
  data: T;
}
```

**Verification:**
- `cd packages/shared && npm run build` succeeds
- `dist/` folder contains compiled JS and type declarations
- No TypeScript errors

---

## STEP-03: Backend Package Initialization

**Prerequisites:** STEP-02

**Description:** Set up the backend Express package structure with TypeScript, dependencies, and folder scaffolding. Does NOT implement routes or database logic yet.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/package.json` | Package configuration with dependencies |
| `packages/backend/tsconfig.json` | TypeScript config |
| `packages/backend/.env.example` | Example environment variables |
| `packages/backend/src/index.ts` | Express app entry point (minimal) |
| `packages/backend/src/db/.gitkeep` | Placeholder for db module |
| `packages/backend/src/routes/.gitkeep` | Placeholder for routes |
| `packages/backend/src/services/.gitkeep` | Placeholder for services |
| `packages/backend/src/middleware/error-handler.ts` | Error handling middleware |
| `packages/backend/scripts/.gitkeep` | Placeholder for scripts |
| `packages/backend/data/.gitkeep` | SQLite database location |

**Specifications:**

`packages/backend/package.json`:
```json
{
  "name": "@summit-gear/backend",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:init": "tsx scripts/init-db.ts",
    "db:seed": "tsx scripts/seed-products.ts"
  },
  "dependencies": {
    "@summit-gear/shared": "*",
    "express": "^4.18.2",
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

`packages/backend/src/index.ts` (minimal skeleton):
```typescript
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be added in STEP-05

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

`packages/backend/src/middleware/error-handler.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@summit-gear/shared';

export class HttpError extends Error {
  constructor(public statusCode: number, public error: string, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err instanceof HttpError) {
    const response: ApiError = {
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
    };
    return res.status(err.statusCode).json(response);
  }

  const response: ApiError = {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
  res.status(500).json(response);
}
```

**Verification:**
- `cd packages/backend && npm install` succeeds
- `npm run dev` starts server on port 3001
- `curl http://localhost:3001/health` returns `{"status":"ok",...}`

---

## STEP-04: Database Layer and Seed Script

**Prerequisites:** STEP-03

**Description:** Implement SQLite database connection, schema initialization script, and product seed script that generates 100 realistic outdoor products.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/src/db/connection.ts` | SQLite connection singleton |
| `packages/backend/src/db/schema.ts` | SQL schema definitions |
| `packages/backend/scripts/init-db.ts` | Creates tables and seeds categories |
| `packages/backend/scripts/seed-products.ts` | Generates and inserts 100 products |

**Specifications:**

`packages/backend/src/db/connection.ts`:
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/summit-gear.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
```

**Schema (`schema.ts`):**
- Categories table: id, name, slug (unique), description
- Products table: id, sku (unique), name, description, category_id (FK), subcategory, price_in_cents, sizes (JSON), colors (JSON), image_url, stock_quantity, weight_oz, created_at
- Indexes on category_id, subcategory, price_in_cents

**Seed Script Product Generation:**

Use deterministic seeded random (seed = 42) for reproducibility.

**Product Distribution (100 total):**

| Category | Count | Subcategories |
|----------|-------|---------------|
| Camping & Hiking | 18 | Tents (4), Sleeping Bags (4), Backpacks (5), Trekking Poles (2), Stoves (3) |
| Climbing | 10 | Harnesses (3), Ropes (2), Carabiners (2), Chalk Bags (3) |
| Apparel | 20 | Jackets (6), Pants (5), Shirts (5), Base Layers (4) |
| Footwear | 12 | Hiking Boots (4), Trail Runners (4), Sandals (2), Climbing Shoes (2) |
| Cycling | 10 | Helmets (3), Jerseys (3), Shorts (2), Gloves (2) |
| Water Sports | 10 | Dry Bags (3), Life Vests (2), Wetsuits (3), Rashguards (2) |
| Winter Sports | 10 | Goggles (3), Gloves (3), Beanies (2), Neck Gaiters (2) |
| Accessories | 10 | Headlamps (2), Water Bottles (2), Multi-tools (2), First Aid (2), Sunglasses (2) |

**Name Generation Pattern:**
`{Brand} {Material/Feature} {ProductType} {Suffix}`

Brands: Summit, Alpine, Trailhead, Ridgeline, Basecamp, Vertex, Pinnacle, Expedition, Traverse, Wildland

Materials: Gore-Tex, Down, Merino, Carbon, Titanium, Ultralight, Ripstop, Breathable, Insulated, Waterproof

Suffixes: Pro, Elite, Lite, X2, Plus, Classic, Sport, Tech

**Size Configs:**
```typescript
const sizeConfigs = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  footwear: ['7', '8', '9', '10', '11', '12', '13'],
  tents: ['1P', '2P', '3P', '4P'],
  backpacks: ['S/M', 'M/L', 'L/XL'],
  sleepingBags: ['Regular', 'Long'],
  oneSize: ['One Size'],
  ropes: ['30m', '40m', '50m', '60m', '70m'],
};
```

**Price Ranges (cents):**
```typescript
const priceRanges = {
  1: { min: 2999, max: 59999 },   // Camping: $29.99 - $599.99
  2: { min: 1499, max: 29999 },   // Climbing: $14.99 - $299.99
  3: { min: 3999, max: 34999 },   // Apparel: $39.99 - $349.99
  4: { min: 7999, max: 24999 },   // Footwear: $79.99 - $249.99
  5: { min: 2499, max: 19999 },   // Cycling: $24.99 - $199.99
  6: { min: 1999, max: 39999 },   // Water: $19.99 - $399.99
  7: { min: 1999, max: 24999 },   // Winter: $19.99 - $249.99
  8: { min: 999, max: 14999 },    // Accessories: $9.99 - $149.99
};
```

**Colors:**
```typescript
const colors = {
  outdoor: ['Forest Green', 'Slate Blue', 'Burnt Orange', 'Stone Gray', 'Deep Navy'],
  neutral: ['Black', 'Charcoal', 'White', 'Tan', 'Olive'],
};
```

**Image URLs:** Use `https://placehold.co/600x600/2d5a27/ffffff?text={ProductName}` (URL-encoded)

**Verification:**
- `npm run db:init` creates `data/summit-gear.db` with tables
- `npm run db:seed` inserts exactly 100 products
- Query: `SELECT COUNT(*) FROM products` returns 100
- Query: `SELECT COUNT(*) FROM categories` returns 8

---

## STEP-05: Backend API Implementation

**Prerequisites:** STEP-04

**Description:** Implement all REST API endpoints for products and categories with filtering, pagination, and search.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/backend/src/services/product.service.ts` | Product database queries |
| `packages/backend/src/services/category.service.ts` | Category database queries |
| `packages/backend/src/routes/products.ts` | Product endpoints |
| `packages/backend/src/routes/categories.ts` | Category endpoints |
| `packages/backend/src/routes/index.ts` | Route aggregator |

**Update:** `packages/backend/src/index.ts` to mount routes

**API Endpoints:**

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/products` | List products (paginated) | `page`, `pageSize`, `categoryId`, `subcategory`, `minPrice`, `maxPrice`, `search`, `sortBy`, `sortOrder` |
| GET | `/api/products/:id` | Get single product | - |
| GET | `/api/categories` | List all categories | - |
| GET | `/api/categories/:slug` | Get category by slug | - |
| GET | `/api/categories/:slug/products` | Products in category | Same as /api/products |
| GET | `/api/stats` | Database stats | - |

**Query Validation (Zod):**
```typescript
const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  categoryId: z.coerce.number().optional(),
  subcategory: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
```

**Response Formats:**

List endpoint returns `PaginatedResponse<Product>`
Single endpoint returns `ApiSuccess<Product>`
Errors return `ApiError`

**Service Methods:**

`ProductService`:
- `getProducts(filters, page, pageSize, sortBy, sortOrder)` → builds SQL dynamically
- `getProductById(id)`
- `getProductBySku(sku)`
- `countProducts(filters)`

`CategoryService`:
- `getAllCategories()`
- `getCategoryBySlug(slug)`

**Verification:**
- `curl http://localhost:3001/api/products` returns paginated products
- `curl http://localhost:3001/api/products?categoryId=1` filters by category
- `curl http://localhost:3001/api/products?search=jacket` searches name/description
- `curl http://localhost:3001/api/products/1` returns single product
- `curl http://localhost:3001/api/categories` returns 8 categories
- `curl http://localhost:3001/api/stats` returns counts

---

## STEP-06: Frontend Package Initialization

**Prerequisites:** STEP-02

**Description:** Set up Vite + React + TypeScript frontend with Tailwind CSS configured. Create folder structure and base configuration.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/package.json` | Package configuration |
| `packages/frontend/tsconfig.json` | TypeScript config |
| `packages/frontend/tsconfig.node.json` | Node config for Vite |
| `packages/frontend/vite.config.ts` | Vite configuration with proxy |
| `packages/frontend/tailwind.config.js` | Tailwind theme |
| `packages/frontend/postcss.config.js` | PostCSS config |
| `packages/frontend/index.html` | HTML entry point |
| `packages/frontend/src/main.tsx` | React entry point |
| `packages/frontend/src/App.tsx` | Root component (placeholder) |
| `packages/frontend/src/styles/globals.css` | Tailwind imports + base styles |
| `packages/frontend/src/lib/utils.ts` | Utility functions (formatPrice, cn) |
| `packages/frontend/src/vite-env.d.ts` | Vite type declarations |

**Specifications:**

`packages/frontend/package.json`:
```json
{
  "name": "@summit-gear/frontend",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@summit-gear/shared": "*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

`vite.config.ts` with API proxy:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

**Tailwind Theme:**
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        burnt: {
          500: '#ea580c',
          600: '#c2410c',
        },
      },
    },
  },
  plugins: [],
};
```

**Utility Functions (`lib/utils.ts`):**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

**Verification:**
- `cd packages/frontend && npm install` succeeds
- `npm run dev` starts Vite on port 5173
- Browser shows placeholder App component
- Tailwind classes work (test with `className="bg-forest-700"`)

---

## STEP-07: Frontend API Client Layer

**Prerequisites:** STEP-06

**Description:** Create the API client and React Query hooks for fetching products and categories.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/src/api/client.ts` | Fetch wrapper with error handling |
| `packages/frontend/src/api/products.ts` | Product API functions |
| `packages/frontend/src/api/categories.ts` | Category API functions |
| `packages/frontend/src/hooks/useProducts.ts` | React Query hooks for products |
| `packages/frontend/src/hooks/useCategories.ts` | React Query hooks for categories |

**Specifications:**

`api/client.ts`:
```typescript
import type { ApiError } from '@summit-gear/shared';

const BASE_URL = '/api';

export class ApiClientError extends Error {
  constructor(public response: ApiError) {
    super(response.message);
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new ApiClientError(error);
  }

  return response.json();
}
```

`api/products.ts`:
```typescript
export async function getProducts(params?: ProductFilters & { page?: number; pageSize?: number }): Promise<PaginatedResponse<Product>>

export async function getProduct(id: number): Promise<ApiSuccess<Product>>
```

`api/categories.ts`:
```typescript
export async function getCategories(): Promise<ApiSuccess<Category[]>>

export async function getCategoryBySlug(slug: string): Promise<ApiSuccess<Category>>
```

**React Query Hooks:**

`useProducts.ts`:
```typescript
export function useProducts(filters?: ProductFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['products', filters, page, pageSize],
    queryFn: () => getProducts({ ...filters, page, pageSize }),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}
```

`useCategories.ts`:
```typescript
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: Infinity, // Categories don't change
  });
}
```

**Verification:**
- Hooks can be imported without TypeScript errors
- (Full verification requires backend running - will test in STEP-12)

---

## STEP-08: Frontend UI Component Library

**Prerequisites:** STEP-06

**Description:** Create reusable UI components and layout components using Tailwind CSS.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/ui/Button.tsx` | Button with variants |
| `packages/frontend/src/components/ui/Input.tsx` | Text input |
| `packages/frontend/src/components/ui/Select.tsx` | Select dropdown |
| `packages/frontend/src/components/ui/Badge.tsx` | Category/status badges |
| `packages/frontend/src/components/ui/Skeleton.tsx` | Loading skeleton |
| `packages/frontend/src/components/ui/Card.tsx` | Card container |
| `packages/frontend/src/components/layout/Header.tsx` | Site header with nav |
| `packages/frontend/src/components/layout/Footer.tsx` | Site footer |
| `packages/frontend/src/components/layout/Layout.tsx` | Page layout wrapper |
| `packages/frontend/src/components/ui/index.ts` | Re-exports |
| `packages/frontend/src/components/layout/index.ts` | Re-exports |

**Specifications:**

**Button Variants:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- Primary uses `bg-forest-700 hover:bg-forest-800`

**Header:**
- Logo: "Summit Gear Co." (links to /)
- Navigation: All Products, Categories dropdown
- Search input (placeholder, wired in STEP-11)
- Cart icon with item count badge

**Layout:**
- Uses Header + main content area + Footer
- Accepts `children` prop
- Max-width container with responsive padding

**Card:**
- White background, rounded corners, subtle shadow
- Hover state with slightly elevated shadow

**Badge:**
- Pill-shaped, small text
- Variants: 'default', 'category', 'price', 'stock'

**Verification:**
- Components render without errors
- Tailwind styles apply correctly
- Components are properly typed

---

## STEP-09: Frontend Cart Feature

**Prerequisites:** STEP-08

**Description:** Implement cart state management with Zustand (localStorage persisted) and cart UI components.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/src/stores/cart.ts` | Zustand cart store with persistence |
| `packages/frontend/src/hooks/useCart.ts` | Cart convenience hook |
| `packages/frontend/src/components/cart/CartDrawer.tsx` | Slide-out cart panel |
| `packages/frontend/src/components/cart/CartItem.tsx` | Single cart item row |
| `packages/frontend/src/components/cart/CartSummary.tsx` | Cart totals |
| `packages/frontend/src/components/cart/index.ts` | Re-exports |

**Specifications:**

**Cart Store (`stores/cart.ts`):**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@summit-gear/shared';

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
    (set, get) => ({
      items: [],
      addItem: (item) => {
        // If same product/size/color exists, increment quantity
        // Otherwise add new item with quantity 1
      },
      removeItem: (productId, size, color) => {
        // Filter out matching item
      },
      updateQuantity: (productId, size, color, quantity) => {
        // Update quantity, remove if 0
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0),
    }),
    { name: 'summit-gear-cart' }
  )
);
```

**CartDrawer:**
- Slide-in from right
- Close button
- List of CartItems
- CartSummary at bottom
- "Continue Shopping" and "Checkout" buttons
- Empty state message

**CartItem:**
- Product image thumbnail
- Name, size, color
- Price
- Quantity +/- controls
- Remove button

**CartSummary:**
- Subtotal
- Shipping (show "Calculated at checkout")
- Total

**Verification:**
- Cart persists across page refreshes
- Add/remove/update operations work correctly
- Total calculations are accurate

---

## STEP-10: Frontend Product Components

**Prerequisites:** STEP-08

**Description:** Create product-specific components for displaying product listings and details.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/src/components/products/ProductCard.tsx` | Product card for grid |
| `packages/frontend/src/components/products/ProductGrid.tsx` | Responsive product grid |
| `packages/frontend/src/components/products/ProductFilters.tsx` | Filter sidebar |
| `packages/frontend/src/components/products/ProductDetail.tsx` | Full product view |
| `packages/frontend/src/components/products/SizeSelector.tsx` | Size selection buttons |
| `packages/frontend/src/components/products/ColorSelector.tsx` | Color selection swatches |
| `packages/frontend/src/components/products/index.ts` | Re-exports |

**Specifications:**

**ProductCard:**
- Product image (aspect-square)
- Category badge
- Product name (truncate if long)
- Price
- "Quick Add" button (shown on hover)
- Click navigates to product detail

**ProductGrid:**
- Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop
- Accepts `products: Product[]` and `loading` props
- Shows Skeleton cards when loading

**ProductFilters:**
- Category checkboxes (from useCategories)
- Price range inputs (min/max)
- Sort dropdown (Name A-Z, Name Z-A, Price Low-High, Price High-Low)
- Clear filters button
- Emits filter changes via callback

**ProductDetail:**
- Large product image
- Product name, category badge
- Price (formatted)
- Description
- SizeSelector
- ColorSelector
- Quantity input
- "Add to Cart" button
- Stock indicator

**SizeSelector:**
- Grid of size buttons
- Selected state styling
- Accepts `sizes: string[]`, `selected: string`, `onChange`

**ColorSelector:**
- Row of color swatches (circles)
- Selected state with ring
- Color name shown below
- Accepts `colors: string[]`, `selected: string`, `onChange`

**Verification:**
- Components render with mock data
- Responsive grid works at different breakpoints
- Selection states work correctly

---

## STEP-11: Frontend Pages and Routing

**Prerequisites:** STEP-07, STEP-09, STEP-10

**Description:** Create page components and wire up React Router with React Query provider.

**Files to Create:**

| File | Purpose |
|------|---------|
| `packages/frontend/src/pages/HomePage.tsx` | Landing page with featured products |
| `packages/frontend/src/pages/ProductsPage.tsx` | Product listing with filters |
| `packages/frontend/src/pages/ProductDetailPage.tsx` | Single product view |
| `packages/frontend/src/pages/CartPage.tsx` | Full cart view |
| `packages/frontend/src/pages/index.ts` | Re-exports |

**Update:** `packages/frontend/src/App.tsx` with routing and providers

**Specifications:**

**App.tsx:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { HomePage, ProductsPage, ProductDetailPage, CartPage } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/category/:slug" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

**HomePage:**
- Hero section with tagline and CTA
- Featured products grid (first 8 products)
- Category cards linking to category pages

**ProductsPage:**
- Two-column layout: filters sidebar + product grid
- URL query params sync with filters
- Pagination controls
- Loading states
- "No products found" empty state
- Works for both /products and /category/:slug routes

**ProductDetailPage:**
- Uses `useParams` to get product ID
- Fetches product with `useProduct(id)`
- Renders ProductDetail component
- "Back to products" link
- Loading and error states

**CartPage:**
- Full-page cart view (alternative to drawer)
- List of cart items
- Cart summary with totals
- "Continue Shopping" link
- Empty cart state

**Verification:**
- All routes render correct pages
- Navigation between pages works
- URL query params update filters
- Cart state persists across navigation

---

## STEP-12: Integration and Polish

**Prerequisites:** STEP-05, STEP-11

**Description:** Final integration testing, bug fixes, and polish. Update README.

**Tasks:**

1. **Verify Full Stack Integration:**
   - Start backend: `npm run dev -w @summit-gear/backend`
   - Start frontend: `npm run dev -w @summit-gear/frontend`
   - Test all API calls work through proxy

2. **Fix Any Integration Issues:**
   - CORS configuration
   - API response format mismatches
   - Type inconsistencies

3. **Add Root Scripts:**
   - Ensure `npm run dev` from root starts both
   - Add `npm run db:reset` for easy database reset

4. **Update .gitignore:**
   ```
   node_modules/
   dist/
   .env
   *.db
   .DS_Store
   ```

5. **Update README.md:**
   - Project description
   - Tech stack
   - Setup instructions
   - Available scripts
   - Screenshots (placeholders)

**README Template:**
```markdown
# Summit Gear Co.

A fake outdoor e-commerce site built for the Ecomm Hacks hackathon.

## Tech Stack
- **Monorepo:** npm workspaces
- **Backend:** Express, TypeScript, SQLite (better-sqlite3), Zod
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Query, Zustand
- **Shared:** TypeScript types

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize database and seed products:
   ```bash
   npm run db:reset
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173

## Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run db:init` - Create database tables
- `npm run db:seed` - Seed 100 products
- `npm run db:reset` - Reset database

## Project Structure
[Add tree structure]

## AI Features (Coming Soon)
- Product image generation with Nano Banana Pro
- Virtual try-on for apparel
- AI-powered product recommendations
```

**Verification:**
- Full user flow works: browse → filter → view detail → add to cart → view cart
- No console errors
- Responsive design works on mobile/tablet/desktop
- README is accurate and complete

---

## File Checklist

### Root
- [ ] `package.json`
- [ ] `tsconfig.base.json`
- [ ] `.gitignore`
- [ ] `README.md`

### Shared (`packages/shared/`)
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `src/index.ts`
- [ ] `src/types/product.ts`
- [ ] `src/types/category.ts`
- [ ] `src/types/cart.ts`
- [ ] `src/types/api.ts`

### Backend (`packages/backend/`)
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `.env.example`
- [ ] `src/index.ts`
- [ ] `src/db/connection.ts`
- [ ] `src/db/schema.ts`
- [ ] `src/routes/index.ts`
- [ ] `src/routes/products.ts`
- [ ] `src/routes/categories.ts`
- [ ] `src/services/product.service.ts`
- [ ] `src/services/category.service.ts`
- [ ] `src/middleware/error-handler.ts`
- [ ] `scripts/init-db.ts`
- [ ] `scripts/seed-products.ts`
- [ ] `data/.gitkeep`

### Frontend (`packages/frontend/`)
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `tsconfig.node.json`
- [ ] `vite.config.ts`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`
- [ ] `index.html`
- [ ] `src/main.tsx`
- [ ] `src/App.tsx`
- [ ] `src/vite-env.d.ts`
- [ ] `src/styles/globals.css`
- [ ] `src/lib/utils.ts`
- [ ] `src/api/client.ts`
- [ ] `src/api/products.ts`
- [ ] `src/api/categories.ts`
- [ ] `src/hooks/useProducts.ts`
- [ ] `src/hooks/useCategories.ts`
- [ ] `src/hooks/useCart.ts`
- [ ] `src/stores/cart.ts`
- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Input.tsx`
- [ ] `src/components/ui/Select.tsx`
- [ ] `src/components/ui/Badge.tsx`
- [ ] `src/components/ui/Skeleton.tsx`
- [ ] `src/components/ui/Card.tsx`
- [ ] `src/components/ui/index.ts`
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/Footer.tsx`
- [ ] `src/components/layout/Layout.tsx`
- [ ] `src/components/layout/index.ts`
- [ ] `src/components/cart/CartDrawer.tsx`
- [ ] `src/components/cart/CartItem.tsx`
- [ ] `src/components/cart/CartSummary.tsx`
- [ ] `src/components/cart/index.ts`
- [ ] `src/components/products/ProductCard.tsx`
- [ ] `src/components/products/ProductGrid.tsx`
- [ ] `src/components/products/ProductFilters.tsx`
- [ ] `src/components/products/ProductDetail.tsx`
- [ ] `src/components/products/SizeSelector.tsx`
- [ ] `src/components/products/ColorSelector.tsx`
- [ ] `src/components/products/index.ts`
- [ ] `src/pages/HomePage.tsx`
- [ ] `src/pages/ProductsPage.tsx`
- [ ] `src/pages/ProductDetailPage.tsx`
- [ ] `src/pages/CartPage.tsx`
- [ ] `src/pages/index.ts`
