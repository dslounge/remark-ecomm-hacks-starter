import { useQuery } from '@tanstack/react-query';
import type { ProductFilters } from '@summit-gear/shared';
import { getProducts, getProduct } from '../api/products';

export function useProducts(filters?: ProductFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['products', filters, page, pageSize],
    queryFn: () => getProducts({ ...filters, page, pageSize }),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}
