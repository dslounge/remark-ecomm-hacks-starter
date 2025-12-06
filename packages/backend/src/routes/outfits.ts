import { Router } from 'express';
import { z } from 'zod';
import type {
  ApiSuccess,
  OutfitGenerateResponse,
  OutfitRecord,
} from '@summit-gear/shared';
import { OutfitService } from '../services/outfit.service.js';
import { HttpError } from '../middleware/error-handler.js';

const router = Router();

const generateSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1),
  faceImageBase64: z.string().min(10),
  faceImageMimeType: z.enum(['image/png', 'image/jpeg']),
  bodyImageBase64: z.string().min(10),
  bodyImageMimeType: z.enum(['image/png', 'image/jpeg']),
});

router.post('/', async (req, res, next) => {
  try {
    const payload = generateSchema.parse(req.body);
    const result = await OutfitService.createOutfit(payload);

    const response: ApiSuccess<OutfitGenerateResponse> = {
      data: result,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(
        new HttpError(
          400,
          'VALIDATION_ERROR',
          error.errors[0]?.message || 'Invalid request'
        )
      );
    } else {
      next(error as Error);
    }
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      throw new HttpError(400, 'INVALID_ID', 'Outfit ID must be a number');
    }

    const outfit = OutfitService.getOutfitById(id);
    if (!outfit) {
      throw new HttpError(404, 'OUTFIT_NOT_FOUND', 'Outfit was not found');
    }

    const response: ApiSuccess<OutfitRecord> = { data: outfit };
    res.json(response);
  } catch (error) {
    next(error as Error);
  }
});

export default router;
