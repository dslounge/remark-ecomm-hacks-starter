# Backend API Documentation

The backend is an Express server with TypeScript, serving a REST API for products and categories.

## Server Setup

```typescript
// packages/backend/src/index.ts
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T23:31:01.026Z"
}
```

### Database Stats

```
GET /api/stats
```

Response:
```json
{
  "data": {
    "products": 100,
    "categories": 8
  }
}
```

---

## Products API

### List Products

```
GET /api/products
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| categoryId | number | - | Filter by category ID |
| subcategory | string | - | Filter by subcategory |
| minPrice | number | - | Minimum price in cents |
| maxPrice | number | - | Maximum price in cents |
| search | string | - | Search in name and description |
| sortBy | string | "name" | Sort field: `name`, `price`, `createdAt` |
| sortOrder | string | "asc" | Sort direction: `asc`, `desc` |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "sku": "CMP-0001",
      "name": "Summit Ultralight Tent Pro",
      "description": "...",
      "categoryId": 1,
      "subcategory": "Tents",
      "priceInCents": 34999,
      "sizes": ["2P", "3P", "4P"],
      "colors": ["Forest Green", "Stone Gray"],
      "imageUrl": "https://placehold.co/600x600/...",
      "stockQuantity": 25,
      "weightOz": 48.5,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Get Single Product

```
GET /api/products/:id
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "sku": "CMP-0001",
    "name": "Summit Ultralight Tent Pro",
    ...
  }
}
```

**Error (404):**
```json
{
  "error": "NOT_FOUND",
  "message": "Product with id 999 not found",
  "statusCode": 404
}
```

---

## Categories API

### List Categories

```
GET /api/categories
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Camping & Hiking",
      "slug": "camping-hiking",
      "description": "Tents, sleeping bags, backpacks, and trail essentials"
    },
    ...
  ]
}
```

### Get Category by Slug

```
GET /api/categories/:slug
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Camping & Hiking",
    "slug": "camping-hiking",
    "description": "..."
  }
}
```

### Get Products in Category

```
GET /api/categories/:slug/products
```

Accepts the same query parameters as `GET /api/products`.

---

## File Structure

```
packages/backend/
├── src/
│   ├── index.ts                    # Express app entry
│   ├── db/
│   │   ├── connection.ts           # SQLite singleton
│   │   └── schema.ts               # SQL definitions
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   ├── products.ts             # Product endpoints
│   │   └── categories.ts           # Category endpoints
│   ├── services/
│   │   ├── product.service.ts      # Product queries
│   │   └── category.service.ts     # Category queries
│   └── middleware/
│       └── error-handler.ts        # Error handling
├── scripts/
│   ├── init-db.ts                  # Create tables
│   └── seed-products.ts            # Generate products
└── data/
    └── summit-gear.db              # SQLite database
```

---

## Services

### ProductService

```typescript
// packages/backend/src/services/product.service.ts

class ProductService {
  // Get paginated products with filters
  getProducts(
    filters: ProductFilters,
    page: number,
    pageSize: number,
    sortBy: string,
    sortOrder: string
  ): Product[]

  // Get single product by ID
  getProductById(id: number): Product | undefined

  // Count products matching filters
  countProducts(filters: ProductFilters): number
}
```

### CategoryService

```typescript
// packages/backend/src/services/category.service.ts

class CategoryService {
  // Get all categories
  getAllCategories(): Category[]

  // Get category by slug
  getCategoryBySlug(slug: string): Category | undefined
}
```

---

## Request Validation

Uses Zod for query parameter validation:

```typescript
// packages/backend/src/routes/products.ts
import { z } from 'zod';

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

---

## Error Handling

### HttpError Class

```typescript
// packages/backend/src/middleware/error-handler.ts

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string
  ) {
    super(message);
  }
}

// Usage
throw new HttpError(404, 'NOT_FOUND', 'Product not found');
```

### Error Response Format

All errors return:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "statusCode": 404
}
```

---

## Adding New Endpoints

1. **Add service method** (if database access needed):
   ```typescript
   // packages/backend/src/services/product.service.ts
   getProductBySku(sku: string): Product | undefined {
     return db.prepare('SELECT * FROM products WHERE sku = ?').get(sku);
   }
   ```

2. **Add route handler**:
   ```typescript
   // packages/backend/src/routes/products.ts
   router.get('/sku/:sku', (req, res) => {
     const product = productService.getProductBySku(req.params.sku);
     if (!product) {
       throw new HttpError(404, 'NOT_FOUND', 'Product not found');
     }
     res.json({ data: product });
   });
   ```

3. **Update shared types** (if new response shape):
   ```typescript
   // packages/shared/src/types/api.ts
   export interface NewResponseType { ... }
   ```

4. **Rebuild shared package**:
   ```bash
   npm run build -w @summit-gear/shared
   ```
