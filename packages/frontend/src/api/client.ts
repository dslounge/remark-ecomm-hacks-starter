import type { ApiError } from '@summit-gear/shared';

const BASE_URL = '/api';

export class ApiClientError extends Error {
  constructor(public response: ApiError) {
    super(response.message);
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new ApiClientError(error);
  }

  return response.json();
}
