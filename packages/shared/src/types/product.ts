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
