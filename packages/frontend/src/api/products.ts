import type { Product, ProductFilters, PaginatedResponse, ApiSuccess } from '@summit-gear/shared';
import { apiClient } from './client';

export async function getProducts(
  params?: ProductFilters & { page?: number; pageSize?: number }
): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  return apiClient<PaginatedResponse<Product>>(endpoint);
}

export async function getProduct(id: number): Promise<ApiSuccess<Product>> {
  return apiClient<ApiSuccess<Product>>(`/products/${id}`);
}

export async function getProductSuggestions(query: string, limit: number = 10): Promise<Product[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchParams = new URLSearchParams();
  searchParams.append('q', query.trim());
  searchParams.append('limit', String(limit));

  const result = await apiClient<ApiSuccess<Product[]>>(`/products/suggestions?${searchParams.toString()}`);
  return result.data;
}
