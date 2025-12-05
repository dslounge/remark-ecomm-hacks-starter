import { Router } from 'express';
import { z } from 'zod';
import { CategoryService } from '../services/category.service.js';
import { ProductService } from '../services/product.service.js';
import { HttpError } from '../middleware/error-handler.js';
import type { ApiSuccess, Category, PaginatedResponse, Product } from '@summit-gear/shared';

const router = Router();

const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  subcategory: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// GET /api/categories - List all categories
router.get('/', (req, res, next) => {
  try {
    const categories = CategoryService.getAllCategories();

    const response: ApiSuccess<Category[]> = {
      data: categories,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = CategoryService.getCategoryBySlug(slug);

    if (!category) {
      throw new HttpError(404, 'CATEGORY_NOT_FOUND', `Category with slug '${slug}' not found`);
    }

    const response: ApiSuccess<Category> = {
      data: category,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:slug/products - Get products in category
router.get('/:slug/products', (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = CategoryService.getCategoryBySlug(slug);

    if (!category) {
      throw new HttpError(404, 'CATEGORY_NOT_FOUND', `Category with slug '${slug}' not found`);
    }

    const params = productQuerySchema.parse(req.query);

    const { products, total } = ProductService.getProducts(
      {
        categoryId: category.id,
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

export default router;
