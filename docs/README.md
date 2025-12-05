# Summit Gear Co. - Technical Documentation

This documentation describes how the Summit Gear Co. e-commerce site works. It's designed as a reference for AI agents working on this codebase.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Database](./database.md) | SQLite schema, tables, seeding, queries |
| [Backend API](./backend.md) | Express routes, services, middleware |
| [Frontend](./frontend.md) | React components, pages, state management |
| [Shared Types](./shared-types.md) | TypeScript interfaces used across packages |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Vite + React + TypeScript + Tailwind + React Query + Zustand│
│                    http://localhost:5173                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ /api/* (proxied)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│              Express + TypeScript + Zod                      │
│                    http://localhost:3001                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│                   SQLite (better-sqlite3)                    │
│            packages/backend/data/summit-gear.db              │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

```
summit-gear-co/
├── packages/
│   ├── shared/           # @summit-gear/shared
│   │   └── src/types/    # TypeScript types (Product, Category, Cart, API)
│   ├── backend/          # @summit-gear/backend
│   │   ├── src/
│   │   │   ├── db/       # Database connection and schema
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── services/ # Business logic
│   │   │   └── middleware/
│   │   ├── scripts/      # Database init and seed
│   │   └── data/         # SQLite database file
│   └── frontend/         # @summit-gear/frontend
│       └── src/
│           ├── api/      # API client functions
│           ├── components/
│           ├── hooks/    # React Query hooks
│           ├── stores/   # Zustand stores
│           ├── pages/    # Route pages
│           └── lib/      # Utilities
├── package.json          # npm workspaces root
└── tsconfig.base.json    # Shared TypeScript config
```

## Key Files by Purpose

### Configuration
- `/package.json` - Workspace root, npm scripts
- `/tsconfig.base.json` - Base TypeScript config
- `/packages/*/package.json` - Package dependencies
- `/packages/frontend/vite.config.ts` - Vite config with API proxy
- `/packages/frontend/tailwind.config.js` - Tailwind theme (forest green, burnt orange)

### Database
- `/packages/backend/data/summit-gear.db` - SQLite database (checked in)
- `/packages/backend/src/db/connection.ts` - Database singleton
- `/packages/backend/src/db/schema.ts` - SQL schema definitions
- `/packages/backend/scripts/init-db.ts` - Table creation
- `/packages/backend/scripts/seed-products.ts` - 100 product generator

### API
- `/packages/backend/src/index.ts` - Express app entry
- `/packages/backend/src/routes/products.ts` - Product endpoints
- `/packages/backend/src/routes/categories.ts` - Category endpoints
- `/packages/backend/src/services/product.service.ts` - Product queries
- `/packages/backend/src/services/category.service.ts` - Category queries

### Frontend Entry
- `/packages/frontend/src/main.tsx` - React entry
- `/packages/frontend/src/App.tsx` - Router + providers

### State
- `/packages/frontend/src/stores/cart.ts` - Zustand cart (localStorage)
- `/packages/frontend/src/hooks/useProducts.ts` - React Query product hooks
- `/packages/frontend/src/hooks/useCategories.ts` - React Query category hooks

## Common Tasks

### Start Development
```bash
npm run dev  # Starts both frontend and backend
```

### Reset Database
```bash
npm run db:reset  # Recreates tables and seeds 100 products
```

### Add a New API Endpoint
1. Add service method in `packages/backend/src/services/`
2. Add route in `packages/backend/src/routes/`
3. Register route in `packages/backend/src/routes/index.ts`
4. Add types to `packages/shared/src/types/` if needed
5. Rebuild shared: `npm run build -w @summit-gear/shared`

### Add a New Frontend Page
1. Create page in `packages/frontend/src/pages/`
2. Add route in `packages/frontend/src/App.tsx`
3. Export from `packages/frontend/src/pages/index.ts`

### Add a New Component
1. Create component in appropriate folder under `packages/frontend/src/components/`
2. Export from the folder's `index.ts`
