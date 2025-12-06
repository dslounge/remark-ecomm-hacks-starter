import { db } from '../src/db/connection.js';
import { allSchemas } from '../src/db/schema.js';
import { CATEGORIES } from '@summit-gear/shared';

console.log('Initializing database...');

// Create tables
for (const schema of allSchemas) {
  db.exec(schema);
}

console.log('Tables created successfully.');

// Clear existing data (products first due to foreign key)
try {
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM outfits');
  db.exec(
    "DELETE FROM sqlite_sequence WHERE name IN ('categories', 'products', 'outfits')"
  );
  console.log('Cleared existing data.');
} catch (error) {
  // Tables might be empty on first run
  console.log('Skipping data clear (tables may be new).');
}

// Seed categories
const insertCategory = db.prepare(`
  INSERT INTO categories (name, slug, description)
  VALUES (?, ?, ?)
`);

for (const category of CATEGORIES) {
  insertCategory.run(category.name, category.slug, category.description);
}

console.log(`Seeded ${CATEGORIES.length} categories.`);

console.log('Database initialization complete!');
