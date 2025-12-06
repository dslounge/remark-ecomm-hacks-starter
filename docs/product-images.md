# Product Images

AI-generated product images using Google's Nano Banana Pro (Gemini 3 Pro Image).

## Overview

- 100 product images generated via Nano Banana Pro API
- Images stored in `packages/frontend/public/products/`
- Vite serves them directly at `/products/{sku}.jpg`
- Database `image_url` column references local paths

## Generation Script

Location: `packages/backend/scripts/generate-product-images.ts`

### Usage

```bash
cd packages/backend

# Generate 1 image (default)
npm run generate-images

# Generate specific count
npm run generate-images -- 10

# Generate all remaining
npm run generate-images -- --all

# Use faster model (gemini-2.5-flash-image instead of gemini-3-pro-image-preview)
npm run generate-images -- --fast
```

### Features

- Parallel processing (5 concurrent requests)
- Skips already-generated images
- Updates database `image_url` on success
- Retries work automatically (just re-run)

## Image Prompt Schema

Defined in `packages/shared/src/types/image-prompt.ts`:

```typescript
export interface ImagePrompt {
  version: 1;
  subject: {
    product: string;      // "gore-tex rain jacket"
    variant: string;      // "laid flat, front view, hood visible"
    color: string;        // "forest green"
    material?: string;    // "gore-tex"
    details?: string[];   // ["sealed seams", "adjustable hood"]
  };
  camera: {
    angle: 'front' | 'three-quarter' | 'side' | 'top-down' | 'low';
    distance: 'close-up' | 'medium' | 'full';
    focus: string;
  };
  lighting: {
    setup: 'softbox' | 'diffused' | 'rim-accent';
    shadows: 'soft' | 'minimal' | 'none';
  };
  style: {
    quality: string;
  };
  technical: {
    aspectRatio: '1:1';
    resolution: '2K';
  };
}
```

Prompts are stored in the database `image_prompt_json` column and generated during seeding.

## Prompt Renderer

Location: `packages/backend/src/utils/prompt-renderer.ts`

Converts JSON prompt to text string for the API:

```typescript
renderPromptText(prompt: ImagePrompt): string
```

Example output:
> professional e-commerce product photography, pure white seamless background, studio lighting. A burgundy breathable rain jacket made of breathable. laid flat, front view, hood visible, partially unzipped. with sealed seams visible, adjustable hood, pit zips, storm flap. front angle, full shot. sharp focus on entire rain jacket. softbox lighting with soft shadows.

## API Configuration

- **Model**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Fast model**: `gemini-2.5-flash-image`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Resolution**: 1K (1024x1024)
- **Aspect ratio**: 1:1

### Request Format

```typescript
{
  contents: [{ parts: [{ text: promptText }] }],
  generationConfig: {
    responseModalities: ['IMAGE'],
    imageConfig: {
      aspectRatio: '1:1',
      imageSize: '1K',
    },
  },
}
```

## File Structure

```
packages/
├── frontend/
│   └── public/
│       └── products/
│           ├── CLO-0001.jpg
│           ├── CLO-0002.jpg
│           └── ... (100 images)
├── backend/
│   ├── scripts/
│   │   └── generate-product-images.ts
│   └── src/
│       └── utils/
│           └── prompt-renderer.ts
└── shared/
    └── src/
        └── types/
            └── image-prompt.ts
```

## Environment

Requires `GOOGLE_API_KEY` in `.env` file at project root.
