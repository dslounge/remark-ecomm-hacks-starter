import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../src/db/connection.js';
import { allSchemas } from '../src/db/schema.js';
import { CATEGORIES } from '@summit-gear/shared';

// Load .env from project root (two levels up from scripts/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.join(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

console.log('Initializing database...');

// Drop existing tables if they exist (in reverse order due to foreign keys)
try {
  db.exec('DROP TABLE IF EXISTS outfits');
  db.exec('DROP TABLE IF EXISTS products');
  db.exec('DROP TABLE IF EXISTS categories');
  console.log('Dropped existing tables.');
} catch (error) {
  // Tables might not exist
  console.log('Skipping table drop (tables may not exist).');
}

// Create tables
for (const schema of allSchemas) {
  db.exec(schema);
}

console.log('Tables created successfully.');

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
