import type {
  ApiSuccess,
  OutfitGenerateRequest,
  OutfitGenerateResponse,
  OutfitRecord,
} from '@summit-gear/shared';
import { apiClient } from './client';

export function generateOutfit(payload: OutfitGenerateRequest) {
  return apiClient<ApiSuccess<OutfitGenerateResponse>>('/outfits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchOutfit(outfitId: number) {
  return apiClient<ApiSuccess<OutfitRecord>>(`/outfits/${outfitId}`);
}

