# Product Images Generation Plan

## Executive Summary

This document outlines the plan for generating product images using Nano Banana Pro (Gemini 3 Pro Image).

- Goal: Generate high-quality, consistent studio product photography for all 100 products

- Image prompts are generated during database seeding
  - Each product gets an `image_prompt_json` column in the products table
  - Prompts follow a consistent schema per subcategory
  - Seed script generates prompts deterministically using subcategory templates

- All images are studio product photography on white background
  - Clean, professional e-commerce standard
  - 1:1 square aspect ratio for all products
  - Strictly consistent presentation per subcategory

- Local script reads prompts from database and generates images via Nano Banana Pro API
  - Renders JSON prompt to text
  - Calls API with proper parameters
  - Saves images to public folder
  - Updates product imageUrl in database

---

## Image Prompt Schema

All images are **studio product photography on white background** - clean, professional, e-commerce standard.

### Schema Definition

```typescript
// packages/shared/src/types/image-prompt.ts

export interface ImagePrompt {
  version: 1;

  subject: {
    product: string;           // "2-person backpacking tent"
    variant: string;           // "fully assembled, door unzipped showing interior"
    color: string;             // "forest green with gray accents"
    material?: string;         // "ripstop nylon"
    details?: string[];        // ["aluminum poles", "mesh panels"]
  };

  camera: {
    angle: 'front' | 'three-quarter' | 'side' | 'top-down' | 'low';
    distance: 'close-up' | 'medium' | 'full';
    focus: string;             // "sharp focus on entire product"
  };

  lighting: {
    setup: 'softbox' | 'diffused' | 'rim-accent';
    shadows: 'soft' | 'minimal' | 'none';
  };

  style: {
    quality: string;           // "professional e-commerce product photography"
  };

  technical: {
    aspectRatio: '1:1';
    resolution: '2K';
  };
}
```

---

## Subcategory Templates

Each subcategory has a **strictly consistent** template. Only product-specific data (color, material from name) varies.

```typescript
// packages/backend/scripts/seed-products.ts

interface SubcategoryTemplate {
  variant: string;
  camera: { angle: string; distance: string };
  details: string[];
}

const subcategoryTemplates: Record<string, SubcategoryTemplate> = {
  // === CAMPING & HIKING ===
  'Tents': {
    variant: 'fully assembled, door unzipped showing interior',
    camera: { angle: 'three-quarter', distance: 'full' },
    details: ['pole structure visible', 'mesh ventilation panels', 'rain fly attached']
  },
  'Sleeping Bags': {
    variant: 'partially unzipped, laid diagonally showing lining',
    camera: { angle: 'three-quarter', distance: 'full' },
    details: ['hood visible', 'draft collar', 'zipper detail']
  },
  'Backpacks': {
    variant: 'standing upright, front view, hip belt extended',
    camera: { angle: 'three-quarter', distance: 'full' },
    details: ['compression straps', 'front pocket', 'load lifters visible']
  },
  'Trekking Poles': {
    variant: 'pair crossed in X formation',
    camera: { angle: 'front', distance: 'full' },
    details: ['adjustable locks visible', 'cork grips', 'wrist straps']
  },
  'Stoves': {
    variant: 'assembled with pot supports extended, from above',
    camera: { angle: 'top-down', distance: 'medium' },
    details: ['burner head visible', 'control valve', 'folding legs']
  },

  // === CLIMBING ===
  'Harnesses': {
    variant: 'laid flat showing leg loops and waist belt spread',
    camera: { angle: 'front', distance: 'full' },
    details: ['gear loops visible', 'belay loop', 'adjustable buckles']
  },
  'Ropes': {
    variant: 'neatly coiled, showing rope ends',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['middle marker visible', 'rope texture', 'end caps']
  },
  'Carabiners': {
    variant: 'gate open, three-quarter view',
    camera: { angle: 'three-quarter', distance: 'close-up' },
    details: ['gate mechanism visible', 'nose shape', 'spine detail']
  },
  'Chalk Bags': {
    variant: 'standing upright, drawstring open showing fleece lining',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['fleece lining visible', 'drawstring cord', 'belt loop']
  },

  // === APPAREL ===
  'Jackets': {
    variant: 'laid flat, front view, partially unzipped',
    camera: { angle: 'front', distance: 'full' },
    details: ['hood visible', 'chest pocket', 'cuff detail']
  },
  'Pants': {
    variant: 'laid flat, front view, legs straight',
    camera: { angle: 'front', distance: 'full' },
    details: ['cargo pockets visible', 'waistband', 'articulated knees']
  },
  'Shirts': {
    variant: 'laid flat, front view, sleeves visible',
    camera: { angle: 'front', distance: 'full' },
    details: ['collar detail', 'button placket', 'chest pocket']
  },
  'Base Layers': {
    variant: 'laid flat, front view',
    camera: { angle: 'front', distance: 'full' },
    details: ['fabric texture visible', 'flatlock seams', 'crew neck']
  },

  // === FOOTWEAR ===
  'Hiking Boots': {
    variant: 'pair, one boot angled showing tread, laces tied',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['aggressive tread pattern', 'ankle padding', 'lace hooks']
  },
  'Trail Runners': {
    variant: 'pair, side profile showing cushioning',
    camera: { angle: 'side', distance: 'medium' },
    details: ['midsole visible', 'tread pattern', 'breathable mesh']
  },
  'Sandals': {
    variant: 'pair, top-down view showing straps',
    camera: { angle: 'top-down', distance: 'medium' },
    details: ['adjustable straps', 'contoured footbed', 'tread pattern']
  },
  'Climbing Shoes': {
    variant: 'pair, one showing rubber toe, one showing heel',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['sticky rubber toe', 'heel hook zone', 'velcro straps']
  },

  // === CYCLING ===
  'Helmets': {
    variant: 'three-quarter view showing vents and visor',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['ventilation channels', 'adjustment dial', 'visor']
  },
  'Jerseys': {
    variant: 'laid flat, front view, showing graphics',
    camera: { angle: 'front', distance: 'full' },
    details: ['full zipper', 'rear pocket openings', 'collar detail']
  },
  'Shorts': {
    variant: 'laid flat, front view',
    camera: { angle: 'front', distance: 'full' },
    details: ['chamois pad visible at waist', 'gripper elastic', 'side panels']
  },
  'Gloves': {
    variant: 'pair, one palm up showing padding, one palm down',
    camera: { angle: 'front', distance: 'medium' },
    details: ['gel padding', 'velcro closure', 'knuckle protection']
  },

  // === WATER SPORTS ===
  'Dry Bags': {
    variant: 'standing upright, roll-top sealed',
    camera: { angle: 'three-quarter', distance: 'full' },
    details: ['roll-top closure', 'welded seams', 'D-ring attachment']
  },
  'Life Vests': {
    variant: 'front view, buckles fastened',
    camera: { angle: 'front', distance: 'full' },
    details: ['adjustable straps', 'foam panels', 'whistle attachment']
  },
  'Wetsuits': {
    variant: 'laid flat, front view',
    camera: { angle: 'front', distance: 'full' },
    details: ['chest zip visible', 'sealed seams', 'knee pads']
  },
  'Rashguards': {
    variant: 'laid flat, front view showing graphics',
    camera: { angle: 'front', distance: 'full' },
    details: ['flatlock seams', 'tagless collar', 'fabric texture']
  },

  // === WINTER SPORTS ===
  'Goggles': {
    variant: 'front view showing lens, strap extended',
    camera: { angle: 'front', distance: 'medium' },
    details: ['dual lens visible', 'foam padding', 'adjustable strap']
  },
  // Note: 'Gloves' already defined in Cycling - Winter uses same template
  'Beanies': {
    variant: 'standing upright on invisible form',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['knit pattern visible', 'fold-up cuff', 'fabric texture']
  },
  'Neck Gaiters': {
    variant: 'standing upright in tube form',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['fabric pattern visible', 'seam detail', 'breathable mesh']
  },

  // === ACCESSORIES ===
  'Headlamps': {
    variant: 'front view, light off, strap extended flat',
    camera: { angle: 'front', distance: 'close-up' },
    details: ['LED array visible', 'power button', 'adjustable strap']
  },
  'Water Bottles': {
    variant: 'standing upright, cap on',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['cap mechanism', 'volume markings', 'grip texture']
  },
  'Multi-tools': {
    variant: 'partially opened showing several tools',
    camera: { angle: 'three-quarter', distance: 'close-up' },
    details: ['knife blade', 'pliers head', 'screwdriver tips']
  },
  'First Aid': {
    variant: 'closed case, front view with logo visible',
    camera: { angle: 'front', distance: 'medium' },
    details: ['red cross symbol', 'zipper detail', 'carrying handle']
  },
  'Sunglasses': {
    variant: 'front view, temples folded',
    camera: { angle: 'front', distance: 'close-up' },
    details: ['lens gradient visible', 'frame detail', 'nose pads']
  }
};
```

---

## Prompt Generation Logic

The seed script generates prompts by combining subcategory template with product-specific data:

```typescript
function generateImagePrompt(
  subcategory: string,
  productName: string,
  material: string,
  colors: string[]
): ImagePrompt {
  const template = subcategoryTemplates[subcategory];
  const primaryColor = colors[0];

  // Extract product type from subcategory (singularize)
  const productType = subcategory.replace(/s$/, '').toLowerCase();

  return {
    version: 1,
    subject: {
      product: `${material.toLowerCase()} ${productType}`,
      variant: template.variant,
      color: primaryColor.toLowerCase(),
      material: material.toLowerCase(),
      details: template.details
    },
    camera: {
      angle: template.camera.angle as ImagePrompt['camera']['angle'],
      distance: template.camera.distance as ImagePrompt['camera']['distance'],
      focus: `sharp focus on entire ${productType}`
    },
    lighting: {
      setup: 'softbox',
      shadows: 'soft'
    },
    style: {
      quality: 'professional e-commerce product photography, pure white seamless background, studio lighting'
    },
    technical: {
      aspectRatio: '1:1',
      resolution: '2K'
    }
  };
}
```

---

## Prompt Renderer

Converts JSON prompt to text for the API:

```typescript
function renderPromptText(prompt: ImagePrompt): string {
  const parts: string[] = [];

  // Style and quality first
  parts.push(prompt.style.quality);

  // Subject
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

  // Camera
  parts.push(`${prompt.camera.angle} angle, ${prompt.camera.distance} shot`);
  parts.push(prompt.camera.focus);

  // Lighting
  parts.push(`${prompt.lighting.setup} lighting with ${prompt.lighting.shadows} shadows`);

  return parts.join('. ') + '.';
}
```

### Example Rendered Output

**Input:** Tent with Forest Green color, Gore-Tex material

**Output:**
> Professional e-commerce product photography, pure white seamless background, studio lighting. A forest green gore-tex tent made of gore-tex. Fully assembled, door unzipped showing interior. With pole structure visible, mesh ventilation panels, rain fly attached. Three-quarter angle, full shot. Sharp focus on entire tent. Softbox lighting with soft shadows.

---

## Database Schema

### Updated products table

```sql
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  subcategory TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  sizes TEXT NOT NULL,
  colors TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_prompt_json TEXT,              -- NEW: JSON blob of ImagePrompt
  stock_quantity INTEGER NOT NULL,
  weight_oz REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

---

## Implementation Steps

### Phase 1: Schema & Seed (This Session)

1. Add `ImagePrompt` type to `@summit-gear/shared`
2. Update database schema to add `image_prompt_json` column
3. Add subcategory templates to seed script
4. Add `generateImagePrompt()` function to seed script
5. Update seed script to populate `image_prompt_json` for each product
6. Rebuild shared package
7. Reset database (`npm run db:reset`)

### Phase 2: Generation Script (Later)

8. Create `packages/backend/scripts/generate-product-images.ts`
9. Add Nano Banana API client
10. Read prompts from database, call API, save images
11. Update `image_url` column with generated image paths

### Phase 3: Frontend Display (Later)

12. Add admin page to view/debug prompts at `/admin/image-prompts`
13. Show rendered prompt text alongside JSON
14. Display current placeholder vs generated image

---

## File Checklist

### Phase 1 (This Session)

- [ ] `packages/shared/src/types/image-prompt.ts`
- [ ] `packages/shared/src/index.ts` (export new type)
- [ ] `packages/backend/src/db/schema.ts` (add column)
- [ ] `packages/backend/scripts/seed-products.ts` (add templates + generation)
- [ ] Rebuild shared: `npm run build -w @summit-gear/shared`
- [ ] Reset database: `npm run db:reset`

### Phase 2 (Later)

- [ ] `packages/backend/scripts/generate-product-images.ts`
- [ ] `packages/backend/src/services/nano-banana.service.ts`
- [ ] `packages/backend/src/services/prompt-renderer.ts`
- [ ] `packages/backend/public/products/.gitkeep`

### Phase 3 (Later)

- [ ] `packages/frontend/src/pages/AdminImagePromptsPage.tsx`
- [ ] Frontend components for prompt viewing

---

## Cost Estimation

Based on hackathon pricing:
- 2K images: $0.134 each
- 4K images: $0.24 each

For 100 products at 2K resolution:
- **Total: ~$13.40**

Budget allows for initial generation plus ~500 re-generations within $100 budget.

---

## Environment Variables

```bash
# .env
GOOGLE_API_KEY=your-gemini-api-key
```

---

## Sources

- [Gemini Image Generation API](https://ai.google.dev/gemini-api/docs/image-generation)
- [How to prompt Gemini for best results](https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/)
