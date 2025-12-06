import { Router } from 'express';
import productsRouter from './products.js';
import categoriesRouter from './categories.js';
import outfitsRouter from './outfits.js';
import { db } from '../db/connection.js';

const router = Router();

// Mount route modules
router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/outfits', outfitsRouter);

// GET /api/stats - Database statistics
router.get('/stats', (req, res) => {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  res.json({
    data: {
      products: productCount.count,
      categories: categoryCount.count,
    },
  });
});

export default router;
