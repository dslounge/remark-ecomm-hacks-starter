import Fuse from 'fuse.js';
import { db } from '../db/connection.js';
import type { Product, ProductFilters } from '@summit-gear/shared';

interface DbProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  category_id: number;
  subcategory: string;
  price_in_cents: number;
  sizes: string;
  colors: string;
  image_url: string;
  stock_quantity: number;
  weight_oz: number;
  created_at: string;
}

function mapDbProduct(dbProduct: DbProduct): Product {
  return {
    id: dbProduct.id,
    sku: dbProduct.sku,
    name: dbProduct.name,
    description: dbProduct.description,
    categoryId: dbProduct.category_id,
    subcategory: dbProduct.subcategory,
    priceInCents: dbProduct.price_in_cents,
    sizes: JSON.parse(dbProduct.sizes),
    colors: JSON.parse(dbProduct.colors),
    imageUrl: dbProduct.image_url,
    stockQuantity: dbProduct.stock_quantity,
    weightOz: dbProduct.weight_oz,
    createdAt: dbProduct.created_at,
  };
}

export class ProductService {
  static getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    pageSize: number = 20,
    sortBy: 'name' | 'price' | 'createdAt' = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): { products: Product[]; total: number } {
    const searchTerm = filters.search?.trim();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.categoryId !== undefined) {
      conditions.push('category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.subcategory) {
      conditions.push('subcategory = ?');
      params.push(filters.subcategory);
    }

    if (filters.minPrice !== undefined) {
      conditions.push('price_in_cents >= ?');
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push('price_in_cents <= ?');
      params.push(filters.maxPrice);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Map sortBy to database column names
    const sortColumn = {
      name: 'name',
      price: 'price_in_cents',
      createdAt: 'created_at',
    }[sortBy];

    const orderClause = `ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    // Run fuzzy search when a search term is present
    if (searchTerm) {
      const baseQuery = `SELECT * FROM products ${whereClause}`;
      const filteredProducts = db.prepare(baseQuery).all(...params) as DbProduct[];
      const mappedProducts = filteredProducts.map(mapDbProduct);

      const fuse = new Fuse(mappedProducts, {
        includeScore: true,
        keys: ['name', 'colors'],
        threshold: 0.35,
        ignoreLocation: true,
      });

      const results = fuse.search(searchTerm);
      const total = results.length;

      const offset = (page - 1) * pageSize;
      const paginated = results.slice(offset, offset + pageSize).map((result) => result.item);

      return {
        products: paginated,
        total,
      };
    }

    // Get total count when not searching
    const countQuery = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { count: number };
    const total = countResult.count;

    // Get paginated products
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT * FROM products
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, pageSize, offset) as DbProduct[];

    return {
      products: products.map(mapDbProduct),
      total,
    };
  }

  static getProductById(id: number): Product | null {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const result = stmt.get(id) as DbProduct | undefined;
    return result ? mapDbProduct(result) : null;
  }

  static getProductBySku(sku: string): Product | null {
    const stmt = db.prepare('SELECT * FROM products WHERE sku = ?');
    const result = stmt.get(sku) as DbProduct | undefined;
    return result ? mapDbProduct(result) : null;
  }

  static countProducts(filters: ProductFilters = {}): number {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.categoryId !== undefined) {
      conditions.push('category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.subcategory) {
      conditions.push('subcategory = ?');
      params.push(filters.subcategory);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  static searchSuggestions(searchTerm: string, limit: number = 10): Product[] {
    const trimmed = searchTerm.trim();
    
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    // Get all products for fuzzy search
    const query = 'SELECT * FROM products';
    const allProducts = db.prepare(query).all() as DbProduct[];
    const mappedProducts = allProducts.map(mapDbProduct);

    // Use Fuse.js for fuzzy matching
    const fuse = new Fuse(mappedProducts, {
      includeScore: true,
      keys: [
        { name: 'name', weight: 2 },
        { name: 'colors', weight: 1 },
        { name: 'subcategory', weight: 0.5 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });

    const results = fuse.search(trimmed);
    
    // Return top N results
    return results.slice(0, limit).map((result) => result.item);
  }
}
