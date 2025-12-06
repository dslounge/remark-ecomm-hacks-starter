import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { ProductFilters as ProductFiltersType } from '@summit-gear/shared';
import { useProducts } from '../hooks/useProducts';
import { ProductGrid } from '../components/products/ProductGrid';
import { ProductFilters } from '../components/products/ProductFilters';
import { Button } from '../components/ui/Button';

export function ProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<ProductFiltersType>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Sync URL params with filters
  useEffect(() => {
    const newFilters: ProductFiltersType = {};

    if (searchParams.get('categoryId')) {
      newFilters.categoryId = Number(searchParams.get('categoryId'));
    }
    if (searchParams.get('minPrice')) {
      newFilters.minPrice = Number(searchParams.get('minPrice'));
    }
    if (searchParams.get('maxPrice')) {
      newFilters.maxPrice = Number(searchParams.get('maxPrice'));
    }
    if (searchParams.get('search')) {
      newFilters.search = searchParams.get('search')!;
    }
    if (searchParams.get('sortBy')) {
      newFilters.sortBy = searchParams.get('sortBy') as 'name' | 'price' | 'createdAt';
    }
    if (searchParams.get('sortOrder')) {
      newFilters.sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
    }

    setFilters(newFilters);
    setPage(1);
  }, [searchParams, slug]);

  const { data: productsResponse, isLoading } = useProducts(filters, page, pageSize);

  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <aside className="lg:col-span-1">
        <div className="sticky top-24">
          <ProductFilters filters={filters} onChange={handleFiltersChange} />
        </div>
      </aside>

      {/* Products Grid */}
      <main className="lg:col-span-3">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {slug ? slug.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'All Products'}
          </h1>
          {pagination && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {products.length} of {pagination.total} products
            </p>
          )}
        </div>

        <ProductGrid products={products} loading={isLoading} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="md"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
