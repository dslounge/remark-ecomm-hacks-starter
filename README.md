# Summit Gear Co.

A fake outdoor e-commerce site built for the Ecomm Hacks hackathon, featuring 100 realistic outdoor products across 8 categories.

## Tech Stack

- **Monorepo:** npm workspaces
- **Backend:** Express, TypeScript, SQLite (better-sqlite3), Zod
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Query, Zustand
- **Shared:** TypeScript types shared between frontend and backend

## Quick Start

```bash
# Install all dependencies
npm install

# Initialize database and seed 100 products
npm run db:reset

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run build` | Build all packages for production |
| `npm run db:init` | Create database tables and seed categories |
| `npm run db:seed` | Generate and insert 100 products |
| `npm run db:reset` | Reset database (init + seed) |

## Project Structure

```
summit-gear-co/
├── packages/
│   ├── shared/           # Shared TypeScript types
│   │   └── src/types/    # Product, Category, Cart, API types
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── db/       # SQLite connection and schema
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── services/ # Business logic
│   │   │   └── middleware/
│   │   ├── scripts/      # DB init and seed scripts
│   │   └── data/         # SQLite database file
│   └── frontend/         # Vite + React application
│       └── src/
│           ├── api/      # API client functions
│           ├── components/
│           │   ├── ui/       # Reusable UI components
│           │   ├── layout/   # Header, Footer, Layout
│           │   ├── products/ # Product display components
│           │   └── cart/     # Cart components
│           ├── hooks/    # React Query hooks
│           ├── stores/   # Zustand cart store
│           ├── pages/    # Page components
│           └── lib/      # Utility functions
├── package.json          # Root workspace config
└── tsconfig.base.json    # Shared TypeScript config
```

## API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/stats` | Database statistics |

**Query Parameters for `/api/products`:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `categoryId` - Filter by category ID
- `subcategory` - Filter by subcategory
- `minPrice` - Minimum price in cents
- `maxPrice` - Maximum price in cents
- `search` - Search in name and description
- `sortBy` - Sort field: `name`, `price`, `createdAt`
- `sortOrder` - Sort direction: `asc`, `desc`

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:slug` | Get category by slug |
| GET | `/api/categories/:slug/products` | Products in category |

## Product Categories

| Category | Products | Examples |
|----------|----------|----------|
| Camping & Hiking | 18 | Tents, Sleeping Bags, Backpacks |
| Climbing | 10 | Harnesses, Ropes, Carabiners |
| Apparel | 20 | Jackets, Pants, Base Layers |
| Footwear | 12 | Hiking Boots, Trail Runners |
| Cycling | 10 | Helmets, Jerseys, Shorts |
| Water Sports | 10 | Dry Bags, Life Vests, Wetsuits |
| Winter Sports | 10 | Goggles, Gloves, Beanies |
| Accessories | 10 | Headlamps, Water Bottles |

## Features

- **Product Browsing:** Filter by category, price range, and search
- **Product Details:** Size and color selection, stock indicator
- **Shopping Cart:** Persistent cart with localStorage
- **Responsive Design:** Mobile-first with Tailwind CSS
- **Type Safety:** Shared types between frontend and backend

## AI Features (Coming Soon)

This project is built for the Ecomm Hacks hackathon to integrate with:

- **Nano Banana Pro:** AI-generated product images
- **Gemini 3 Pro:** Virtual try-on, visual search, AI recommendations

## Development

```bash
# Run backend only
npm run dev -w @summit-gear/backend

# Run frontend only
npm run dev -w @summit-gear/frontend

# Build shared types
npm run build -w @summit-gear/shared
```

## License

MIT
