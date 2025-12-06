import { db } from '../src/db/connection.js';
import { renderPromptText } from '../src/utils/prompt-renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ImagePrompt } from '@summit-gear/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration - save to frontend public folder so Vite serves them directly
const OUTPUT_DIR = path.join(__dirname, '../../frontend/public/products');
const CONCURRENCY = 5; // Number of parallel requests

// Parse arguments: --all for everything, or a number for specific count (default: 1)
function getTargetCount(): number | null {
  if (process.argv.includes('--all')) return null; // null means unlimited

  // Look for a number argument
  for (const arg of process.argv.slice(2)) {
    const num = parseInt(arg, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 1; // default
}

const TARGET_COUNT = getTargetCount();

// Use Nano Banana Pro (gemini-3-pro-image-preview) or fast model (gemini-2.5-flash-image)
const MODEL = process.argv.includes('--fast')
  ? 'gemini-2.5-flash-image'
  : 'gemini-3-pro-image-preview';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

interface ProductRecord {
  id: number;
  sku: string;
  name: string;
  image_prompt_json: string;
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '2K',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText.substring(0, 200));
      return null;
    }

    const data = (await response.json()) as GeminiResponse;

    if (data.error) {
      console.error('API returned error:', data.error.message);
      return null;
    }

    // Extract image from response
    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }

    console.error('No image in response');
    return null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}

async function processProduct(
  product: ProductRecord,
  updateStmt: ReturnType<typeof db.prepare>
): Promise<'success' | 'fail' | 'skip'> {
  const filename = `${product.sku}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Skip if image already exists
  if (fs.existsSync(filepath)) {
    return 'skip';
  }

  const imagePrompt: ImagePrompt = JSON.parse(product.image_prompt_json);
  const promptText = renderPromptText(imagePrompt);

  console.log(`  ⏳ ${product.sku}: ${product.name.substring(0, 40)}...`);

  const imageBuffer = await generateImage(promptText);

  if (imageBuffer) {
    fs.writeFileSync(filepath, imageBuffer);
    updateStmt.run(`/products/${filename}`, product.id);
    console.log(`  ✓ ${product.sku} saved`);
    return 'success';
  } else {
    console.log(`  ✗ ${product.sku} failed`);
    return 'fail';
  }
}

async function main() {
  // Check for API key
  if (!process.env.GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_API_KEY environment variable is required');
    console.error('Make sure you have a .env file with GOOGLE_API_KEY=your-key');
    process.exit(1);
  }

  console.log(`Using model: ${MODEL}`);
  console.log(`Target: ${TARGET_COUNT === null ? 'all remaining' : TARGET_COUNT} image(s)`);
  console.log(`Concurrency: ${CONCURRENCY} parallel requests\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get ALL products with prompts - we'll filter by file existence
  const allProducts = db.prepare(`
    SELECT id, sku, name, image_prompt_json
    FROM products
    WHERE image_prompt_json IS NOT NULL
    ORDER BY id
  `).all() as ProductRecord[];

  // Filter to only products that need images
  const products = allProducts.filter(p => {
    const filepath = path.join(OUTPUT_DIR, `${p.sku}.jpg`);
    return !fs.existsSync(filepath);
  });

  const skipCount = allProducts.length - products.length;
  console.log(`Found ${allProducts.length} products, ${skipCount} already have images`);
  console.log(`Generating ${TARGET_COUNT === null ? products.length : Math.min(TARGET_COUNT, products.length)} images...\n`);

  // Limit to target count
  const toProcess = TARGET_COUNT === null ? products : products.slice(0, TARGET_COUNT);

  const updateStmt = db.prepare(`
    UPDATE products SET image_url = ? WHERE id = ?
  `);

  let successCount = 0;
  let failCount = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(toProcess.length / CONCURRENCY);

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} images):`);

    const results = await Promise.all(
      batch.map(product => processProduct(product, updateStmt))
    );

    for (const result of results) {
      if (result === 'success') successCount++;
      else if (result === 'fail') failCount++;
    }

    console.log('');
  }

  console.log(`========================================`);
  console.log(`Generation complete!`);
  console.log(`  Generated: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Already existed: ${skipCount}`);
  console.log(`  Remaining: ${allProducts.length - skipCount - successCount}`);
}

main().catch(console.error);
