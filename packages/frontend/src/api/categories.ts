import type { Category, ApiSuccess } from '@summit-gear/shared';
import { apiClient } from './client';

export async function getCategories(): Promise<ApiSuccess<Category[]>> {
  return apiClient<ApiSuccess<Category[]>>('/categories');
}

export async function getCategoryBySlug(slug: string): Promise<ApiSuccess<Category>> {
  return apiClient<ApiSuccess<Category>>(`/categories/${slug}`);
}
