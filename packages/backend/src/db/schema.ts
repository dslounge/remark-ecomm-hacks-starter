export const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
  );
`;

export const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    subcategory TEXT NOT NULL,
    price_in_cents INTEGER NOT NULL,
    sizes TEXT NOT NULL,
    colors TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL,
    weight_oz REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`;

export const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
  CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_in_cents);
`;

export const allSchemas = [
  createCategoriesTable,
  createProductsTable,
  createIndexes,
];
