# Generate Product Images Plan

## Executive Summary

This document outlines the plan for generating product images using Google's Gemini Image Generation API and storing them locally.

- Goal: Generate images for all 100 products using the prompts already stored in the database

- Image prompts already exist in the database
  - Stored in the `image_prompt_json` column of the products table
  - Generated during seeding using subcategory templates
  - Currently products use placeholder URLs from placehold.co

- Images will be stored locally in the project
  - Save as JPG files in `packages/backend/public/products/`
  - Add static file serving to Express backend
  - Update `image_url` column to point to local path (e.g., `/products/CLO-0001.jpg`)

- Script reads prompts from database and generates images via Google Gemini API
  - Renders JSON prompt to text string
  - Calls Gemini `imagen-3.0-generate-002` model
  - Saves response image to disk
  - Updates product record with new image path

- Environment setup
  - `GOOGLE_API_KEY` already available in `.env`
  - `@google/generative-ai` package already installed

---

## Current State

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ...
  image_url TEXT NOT NULL,           -- Currently: placehold.co URLs
  image_prompt_json TEXT,            -- Already populated with ImagePrompt JSON
  ...
);
```

### Sample Product Record

```json
{
  "id": 1,
  "sku": "CLO-0001",
  "name": "Summit Gore-Tex Rain Jacket Pro",
  "image_url": "https://placehold.co/600x600/2d5a27/ffffff?text=Summit%20Gore-Tex%20Rain%20Ja",
  "image_prompt_json": {
    "version": 1,
    "subject": {
      "product": "gore-tex rain jacket",
      "variant": "laid flat, front view, hood visible, partially unzipped",
      "color": "forest green",
      "material": "gore-tex",
      "details": ["sealed seams visible", "adjustable hood", "pit zips", "storm flap"]
    },
    "camera": { "angle": "front", "distance": "full", "focus": "sharp focus on entire rain jacket" },
    "lighting": { "setup": "softbox", "shadows": "soft" },
    "style": { "quality": "professional e-commerce product photography, pure white seamless background, studio lighting" },
    "technical": { "aspectRatio": "1:1", "resolution": "2K" }
  }
}
```

---

## Implementation Plan

### Step 1: Create Public Folder Structure

Create directory for product images:

```
packages/backend/public/
└── products/
    └── .gitkeep
```

Add to `.gitignore` to exclude generated images but keep the folder structure:

```
# Ignore generated product images (large files)
packages/backend/public/products/*.jpg
packages/backend/public/products/*.png
!packages/backend/public/products/.gitkeep
```

### Step 2: Add Static File Serving to Backend

Update `packages/backend/src/index.ts` to serve static files:

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));
```

Images will then be accessible at `http://localhost:3001/products/CLO-0001.jpg`

### Step 3: Create Prompt Renderer Utility

Create `packages/backend/src/utils/prompt-renderer.ts`:

```typescript
import type { ImagePrompt } from '@summit-gear/shared';

export function renderPromptText(prompt: ImagePrompt): string {
  const parts: string[] = [];

  // Style and quality first (sets the overall tone)
  parts.push(prompt.style.quality);

  // Subject description
  let subject = `A ${prompt.subject.color} ${prompt.subject.product}`;
  if (prompt.subject.material) {
    subject += ` made of ${prompt.subject.material}`;
  }
  parts.push(subject);

  // Presentation variant
  parts.push(prompt.subject.variant);

  // Visible details
  if (prompt.subject.details?.length) {
    parts.push(`with ${prompt.subject.details.join(', ')}`);
  }

  // Camera setup
  parts.push(`${prompt.camera.angle} angle, ${prompt.camera.distance} shot`);
  parts.push(prompt.camera.focus);

  // Lighting
  parts.push(`${prompt.lighting.setup} lighting with ${prompt.lighting.shadows} shadows`);

  return parts.join('. ') + '.';
}
```

### Step 4: Create Image Generation Script

Create `packages/backend/scripts/generate-product-images.ts`:

```typescript
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { db } from '../src/db/connection.js';
import { renderPromptText } from '../src/utils/prompt-renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ImagePrompt } from '@summit-gear/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../public/products');
const BATCH_SIZE = 5;  // Process in batches to avoid rate limits
const DELAY_MS = 2000; // Delay between batches

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'imagen-3.0-generate-002',
    });

    const result = await model.generateImages({
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    if (result.images && result.images.length > 0) {
      return Buffer.from(result.images[0].imageBytes, 'base64');
    }
    return null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all products with prompts
  const products = db.prepare(`
    SELECT id, sku, name, image_prompt_json
    FROM products
    WHERE image_prompt_json IS NOT NULL
  `).all() as Array<{
    id: number;
    sku: string;
    name: string;
    image_prompt_json: string;
  }>;

  console.log(`Found ${products.length} products with prompts`);

  const updateStmt = db.prepare(`
    UPDATE products SET image_url = ? WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const imagePrompt: ImagePrompt = JSON.parse(product.image_prompt_json);
    const promptText = renderPromptText(imagePrompt);
    const filename = `${product.sku}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Skip if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${products.length}] Skipping ${product.sku} - already exists`);
      continue;
    }

    console.log(`[${i + 1}/${products.length}] Generating ${product.sku}: ${product.name}`);
    console.log(`  Prompt: ${promptText.substring(0, 100)}...`);

    const imageBuffer = await generateImage(promptText);

    if (imageBuffer) {
      fs.writeFileSync(filepath, imageBuffer);
      updateStmt.run(`/products/${filename}`, product.id);
      console.log(`  ✓ Saved to ${filename}`);
      successCount++;
    } else {
      console.log(`  ✗ Failed to generate`);
      failCount++;
    }

    // Delay between requests to avoid rate limits
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log(`\nGeneration complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Skipped: ${products.length - successCount - failCount}`);
}

main().catch(console.error);
```

### Step 5: Add NPM Script

Add to `packages/backend/package.json`:

```json
{
  "scripts": {
    "generate-images": "tsx scripts/generate-product-images.ts"
  }
}
```

---

## Usage

### Generate All Images

```bash
cd packages/backend
npm run generate-images
```

### Generate Specific Product (Future Enhancement)

```bash
npm run generate-images -- --sku CLO-0001
```

---

## File Changes Summary

### New Files

- `packages/backend/public/products/.gitkeep`
- `packages/backend/src/utils/prompt-renderer.ts`
- `packages/backend/scripts/generate-product-images.ts`

### Modified Files

- `packages/backend/src/index.ts` - Add static file serving
- `packages/backend/package.json` - Add `generate-images` script
- `.gitignore` - Exclude generated images

---

## API Details

### Google Gemini Imagen 3.0

Model: `imagen-3.0-generate-002`

Parameters:
- `numberOfImages`: 1
- `aspectRatio`: '1:1' (square for e-commerce)
- `outputMimeType`: 'image/jpeg'

Rate Limits:
- Free tier: ~10 requests/minute
- Script includes 2-second delay between requests

### Cost Estimation

Based on Google AI pricing (as of Dec 2024):
- Imagen 3.0: ~$0.04 per image
- 100 products = ~$4.00 total

---

## Sample Rendered Prompt

**Product:** Summit Gore-Tex Rain Jacket Pro (Forest Green)

**Rendered Text:**
> Professional e-commerce product photography, pure white seamless background, studio lighting. A forest green gore-tex rain jacket made of gore-tex. Laid flat, front view, hood visible, partially unzipped. With sealed seams visible, adjustable hood, pit zips, storm flap. Front angle, full shot. Sharp focus on entire rain jacket. Softbox lighting with soft shadows.

---

## Fallback Strategy

If Gemini API fails or rate limits:

1. Script skips already-generated images on re-run
2. Failed products retain placeholder URLs
3. Can re-run script to retry failed products
4. Consider implementing exponential backoff for retries

---

## Future Enhancements

- Add `--dry-run` flag to preview prompts without generating
- Add `--sku` flag to generate single product
- Add `--category` flag to generate by category
- Store generation metadata (timestamp, model version) in new column
- Add image optimization/compression step
- Add thumbnail generation for faster list views
