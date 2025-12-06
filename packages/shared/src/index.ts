// Product types
export type { Product, ProductCreate, ProductFilters } from './types/product.js';

// Category types
export type { Category } from './types/category.js';
export { CATEGORIES } from './types/category.js';

// Cart types
export type { CartItem, Cart } from './types/cart.js';

// API types
export type { PaginatedResponse, ApiError, ApiSuccess } from './types/api.js';

// Outfit types
export type {
  OutfitGenerateRequest,
  OutfitGenerateResponse,
  OutfitRecord,
  SupportedImageMime,
} from './types/outfit.js';
