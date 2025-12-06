import { db } from '../src/db/connection.js';
import { renderPromptText } from '../src/utils/prompt-renderer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ImagePrompt } from '@summit-gear/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration - save to frontend public folder so Vite serves them directly
const OUTPUT_DIR = path.join(__dirname, '../../frontend/public/products');
const LIMIT = process.argv.includes('--all') ? undefined : 1; // Default: just 1 image

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
      console.error(`API error (${response.status}):`, errorText);
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

    console.error('No image in response:', JSON.stringify(data, null, 2));
    return null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
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

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get products with prompts
  let query = `
    SELECT id, sku, name, image_prompt_json
    FROM products
    WHERE image_prompt_json IS NOT NULL
    ORDER BY id
  `;
  if (LIMIT) {
    query += ` LIMIT ${LIMIT}`;
  }

  const products = db.prepare(query).all() as Array<{
    id: number;
    sku: string;
    name: string;
    image_prompt_json: string;
  }>;

  console.log(`Processing ${products.length} product(s)...`);

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

    console.log(`\n[${i + 1}/${products.length}] Generating ${product.sku}: ${product.name}`);
    console.log(`Prompt: ${promptText}`);

    const imageBuffer = await generateImage(promptText);

    if (imageBuffer) {
      fs.writeFileSync(filepath, imageBuffer);
      updateStmt.run(`/products/${filename}`, product.id);
      console.log(`✓ Saved to ${filepath}`);
      successCount++;
    } else {
      console.log(`✗ Failed to generate`);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Generation complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Skipped: ${products.length - successCount - failCount}`);
}

main().catch(console.error);
