export type SupportedImageMime = 'image/png' | 'image/jpeg';

export interface OutfitGenerateRequest {
  productIds: number[];
  faceImageBase64: string;
  faceImageMimeType: SupportedImageMime;
  bodyImageBase64: string;
  bodyImageMimeType: SupportedImageMime;
}

export interface OutfitGenerateResponse {
  outfitId: number;
  generatedImageBase64: string;
  generatedImageMimeType: SupportedImageMime;
}

export interface OutfitRecord {
  id: number;
  productIds: number[];
  createdAt: string;
  generatedImageBase64?: string;
  generatedImageMimeType?: SupportedImageMime;
}
