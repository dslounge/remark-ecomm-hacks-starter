import { db } from '../db/connection.js';
import type { Category } from '@summit-gear/shared';

export class CategoryService {
  static getAllCategories(): Category[] {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    return stmt.all() as Category[];
  }

  static getCategoryBySlug(slug: string): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE slug = ?');
    const result = stmt.get(slug) as Category | undefined;
    return result || null;
  }

  static getCategoryById(id: number): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const result = stmt.get(id) as Category | undefined;
    return result || null;
  }
}
