import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  OutfitGenerateRequest,
  OutfitGenerateResponse,
  OutfitRecord,
  SupportedImageMime,
} from '@summit-gear/shared';
import { db } from '../db/connection.js';
import { HttpError } from '../middleware/error-handler.js';

const MODEL_ID =
  process.env.GENAI_MODEL_ID?.trim() || 'gemini-3-pro-image-preview';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

type DbOutfit = {
  id: number;
  product_ids: string;
  face_image: Buffer;
  body_image: Buffer;
  generated_image: Buffer | null;
  created_at: string;
};

export class OutfitService {
  private static getClient() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new HttpError(
        500,
        'GEN_AI_CONFIG_MISSING',
        'Google API key is not configured'
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private static validateImage(base64: string, mime: SupportedImageMime) {
    if (!base64) {
      throw new HttpError(400, 'INVALID_IMAGE', 'Image data is required');
    }
    if (!['image/png', 'image/jpeg'].includes(mime)) {
      throw new HttpError(
        400,
        'UNSUPPORTED_IMAGE_TYPE',
        'Only PNG and JPEG images are supported'
      );
    }
    const cleanedBase64 = base64.includes(',')
      ? base64.split(',').pop() || ''
      : base64;
    const buffer = Buffer.from(cleanedBase64, 'base64');
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new HttpError(
        400,
        'IMAGE_TOO_LARGE',
        `Images must be less than ${MAX_IMAGE_BYTES / (1024 * 1024)}MB`
      );
    }
    return { buffer, base64: cleanedBase64 };
  }

  private static getProductsSummary(productIds: number[]) {
    const placeholders = productIds.map(() => '?').join(',');
    const rows = db
      .prepare(
        `SELECT name, description, colors, sizes FROM products WHERE id IN (${placeholders})`
      )
      .all(...productIds) as {
      name: string;
      description: string;
      colors: string;
      sizes: string;
    }[];

    if (rows.length !== productIds.length) {
      throw new HttpError(
        404,
        'PRODUCT_NOT_FOUND',
        'One or more products could not be found'
      );
    }

    return rows.map((row) => {
      const colors = JSON.parse(row.colors) as string[];
      const sizes = JSON.parse(row.sizes) as string[];
      return `${row.name} (colors: ${colors.join(
        ', '
      )}, sizes: ${sizes.join(', ')}). Description: ${row.description}`;
    });
  }

  private static async callGenAi(
    productSummary: string[],
    faceImageBase64: string,
    bodyImageBase64: string,
    faceMime: SupportedImageMime,
    bodyMime: SupportedImageMime
  ): Promise<{ imageBase64: string; mimeType: SupportedImageMime }> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: MODEL_ID });

    const prompt = `
Combine the provided face and body photos into a single realistic person wearing the selected products. Use the product descriptions as styling guidance and keep proportions natural and lighting consistent. Avoid logos or text overlays. Only return the composed outfit image. Products: ${productSummary.join(
      '; '
    )}
`;

    const result = await model.generateContent(
      [
        { inlineData: { data: faceImageBase64, mimeType: faceMime } },
        { inlineData: { data: bodyImageBase64, mimeType: bodyMime } },
        { text: prompt },
      ],
      { timeout: 90_000 }
    );

    const response = await result.response;
    const imagePart = response?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.inlineData
    ) as { inlineData?: { data: string; mimeType?: string } } | undefined;

    const imageBase64 = imagePart?.inlineData?.data;
    const mimeType =
      (imagePart?.inlineData?.mimeType as SupportedImageMime | undefined) ||
      'image/png';

    if (!imageBase64) {
      throw new HttpError(
        502,
        'GEN_AI_NO_IMAGE',
        'The generation service did not return an image'
      );
    }

    return { imageBase64, mimeType };
  }

  static async createOutfit(
    payload: OutfitGenerateRequest
  ): Promise<OutfitGenerateResponse & { outfitId: number }> {
    const { productIds, faceImageBase64, faceImageMimeType, bodyImageBase64, bodyImageMimeType } =
      payload;

    if (!productIds?.length) {
      throw new HttpError(
        400,
        'NO_PRODUCTS_SELECTED',
        'At least one product must be selected'
      );
    }

    const { buffer: faceBuffer, base64: faceCleaned } = this.validateImage(
      faceImageBase64,
      faceImageMimeType
    );
    const { buffer: bodyBuffer, base64: bodyCleaned } = this.validateImage(
      bodyImageBase64,
      bodyImageMimeType
    );
    const productSummary = this.getProductsSummary(productIds);

    const { imageBase64, mimeType } = await this.callGenAi(
      productSummary,
      faceCleaned,
      bodyCleaned,
      faceImageMimeType,
      bodyImageMimeType
    );

    const insert = db.prepare(
      `
      INSERT INTO outfits (product_ids, face_image, body_image, generated_image, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `
    );

    const result = insert.run(
      JSON.stringify(productIds),
      faceBuffer,
      bodyBuffer,
      Buffer.from(imageBase64, 'base64')
    );

    return {
      outfitId: Number(result.lastInsertRowid),
      generatedImageBase64: imageBase64,
      generatedImageMimeType: mimeType,
    };
  }

  static getOutfitById(id: number): OutfitRecord | null {
    const row = db
      .prepare(
        `
        SELECT id, product_ids, generated_image, created_at
        FROM outfits
        WHERE id = ?
      `
      )
      .get(id) as DbOutfit | undefined;

    if (!row) return null;

    return {
      id: row.id,
      productIds: JSON.parse(row.product_ids) as number[],
      createdAt: row.created_at,
      generatedImageBase64: row.generated_image
        ? row.generated_image.toString('base64')
        : undefined,
      generatedImageMimeType: row.generated_image
        ? ('image/png' as SupportedImageMime)
        : undefined,
    };
  }
}

