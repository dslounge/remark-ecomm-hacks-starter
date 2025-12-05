import { Router } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service.js';
import { HttpError } from '../middleware/error-handler.js';
import type { PaginatedResponse, ApiSuccess, Product } from '@summit-gear/shared';

const router = Router();

const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  categoryId: z.coerce.number().optional(),
  subcategory: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// GET /api/products - List products with pagination and filters
router.get('/', (req, res, next) => {
  try {
    const params = productQuerySchema.parse(req.query);

    const { products, total } = ProductService.getProducts(
      {
        categoryId: params.categoryId,
        subcategory: params.subcategory,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        search: params.search,
      },
      params.page,
      params.pageSize,
      params.sortBy,
      params.sortOrder
    );

    const totalPages = Math.ceil(total / params.pageSize);

    const response: PaginatedResponse<Product> = {
      data: products,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, 'VALIDATION_ERROR', error.errors[0].message));
    } else {
      next(error);
    }
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new HttpError(400, 'INVALID_ID', 'Product ID must be a number');
    }

    const product = ProductService.getProductById(id);

    if (!product) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${id} not found`);
    }

    const response: ApiSuccess<Product> = {
      data: product,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
