# Database Documentation

The application uses SQLite with better-sqlite3 for synchronous database operations.

## Database Location

```
packages/backend/data/summit-gear.db
```

The database file is checked into git for hackathon convenience.

## Connection

```typescript
// packages/backend/src/db/connection.ts
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH || './data/summit-gear.db';
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
```

## Schema

### Categories Table

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);
```

**Seed Data (8 categories):**

| id | name | slug | description |
|----|------|------|-------------|
| 1 | Camping & Hiking | camping-hiking | Tents, sleeping bags, backpacks, and trail essentials |
| 2 | Climbing | climbing | Harnesses, ropes, carabiners, and climbing gear |
| 3 | Apparel | apparel | Jackets, pants, base layers, and outdoor clothing |
| 4 | Footwear | footwear | Hiking boots, trail runners, and outdoor shoes |
| 5 | Cycling | cycling | Helmets, jerseys, shorts, and bike accessories |
| 6 | Water Sports | water-sports | Kayaking, paddleboarding, and water gear |
| 7 | Winter Sports | winter-sports | Ski and snowboard apparel and accessories |
| 8 | Accessories | accessories | Headlamps, water bottles, tools, and more |

### Products Table

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  subcategory TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  sizes TEXT NOT NULL,           -- JSON array: '["S","M","L"]'
  colors TEXT NOT NULL,          -- JSON array: '["Black","Navy"]'
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  weight_oz REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory);
CREATE INDEX idx_products_price ON products(price_in_cents);
```

## Product Distribution (100 total)

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

## Product Name Generation

Products are named using the pattern: `{Brand} {Material} {ProductType} {Suffix}`

**Brands:** Summit, Alpine, Trailhead, Ridgeline, Basecamp, Vertex, Pinnacle, Expedition, Traverse, Wildland

**Materials:** Gore-Tex, Down, Merino, Carbon, Titanium, Ultralight, Ripstop, Breathable, Insulated, Waterproof

**Suffixes:** Pro, Elite, Lite, X2, Plus, Classic, Sport, Tech

## Size Configurations

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

## Price Ranges (in cents)

| Category ID | Category | Min | Max |
|-------------|----------|-----|-----|
| 1 | Camping & Hiking | $29.99 | $599.99 |
| 2 | Climbing | $14.99 | $299.99 |
| 3 | Apparel | $39.99 | $349.99 |
| 4 | Footwear | $79.99 | $249.99 |
| 5 | Cycling | $24.99 | $199.99 |
| 6 | Water Sports | $19.99 | $399.99 |
| 7 | Winter Sports | $19.99 | $249.99 |
| 8 | Accessories | $9.99 | $149.99 |

## Colors

```typescript
const colors = [
  'Forest Green', 'Slate Blue', 'Burnt Orange', 'Stone Gray', 'Deep Navy',
  'Black', 'Charcoal', 'White', 'Tan', 'Olive'
];
```

## Common Queries

### Get all products with category name
```sql
SELECT p.*, c.name as category_name, c.slug as category_slug
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY p.name;
```

### Filter products by category
```sql
SELECT * FROM products WHERE category_id = ? ORDER BY name;
```

### Search products
```sql
SELECT * FROM products
WHERE name LIKE '%' || ? || '%'
   OR description LIKE '%' || ? || '%'
ORDER BY name;
```

### Filter by price range
```sql
SELECT * FROM products
WHERE price_in_cents >= ? AND price_in_cents <= ?
ORDER BY price_in_cents;
```

### Get product counts by category
```sql
SELECT c.name, c.slug, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id
ORDER BY c.name;
```

## Database Scripts

### Initialize Database
```bash
npm run db:init -w @summit-gear/backend
```
Creates tables and seeds categories.

### Seed Products
```bash
npm run db:seed -w @summit-gear/backend
```
Generates 100 products with deterministic random (seed=42).

### Reset Database
```bash
npm run db:reset
```
Runs both init and seed.

## Important Notes

- `sizes` and `colors` columns store JSON arrays as strings
- Parse them with `JSON.parse()` when reading
- Stringify with `JSON.stringify()` when writing
- The seed script uses a seeded random generator for reproducibility
- All prices are stored in cents to avoid floating point issues
