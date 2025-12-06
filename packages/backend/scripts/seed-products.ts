import { db } from '../src/db/connection.js';
import type { ImagePrompt, SubcategoryTemplate } from '@summit-gear/shared';

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

const rng = new SeededRandom(42);

// Data pools - clothing focused
const brands = ['Summit', 'Alpine', 'Trailhead', 'Ridgeline', 'Basecamp', 'Vertex', 'Pinnacle', 'Expedition', 'Traverse', 'Wildland'];
const materials = ['Merino Wool', 'Fleece', 'Down', 'Softshell', 'Gore-Tex', 'Ripstop', 'Stretch', 'Insulated', 'Breathable', 'DWR-Coated'];
const suffixes = ['Pro', 'Elite', 'Lite', 'X2', 'Plus', 'Classic', 'Sport', 'Tech'];

const sizeConfigs = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  oneSize: ['One Size'],
};

const colorPools = {
  outdoor: ['Forest Green', 'Slate Blue', 'Burnt Orange', 'Stone Gray', 'Deep Navy'],
  neutral: ['Black', 'Charcoal', 'Olive', 'Cream', 'Burgundy'],
};

const allColors = [...colorPools.outdoor, ...colorPools.neutral];

// All clothing falls under category 1 (Apparel)
const priceRanges: Record<string, { min: number; max: number }> = {
  'outerwear': { min: 12999, max: 34999 },   // $129.99 - $349.99
  'tops': { min: 3999, max: 9999 },          // $39.99 - $99.99
  'bottoms': { min: 5999, max: 14999 },      // $59.99 - $149.99
  'base_layers': { min: 4999, max: 8999 },   // $49.99 - $89.99
  'accessories': { min: 1999, max: 4999 },   // $19.99 - $49.99
};

// =====================================================
// SUBCATEGORY TEMPLATES FOR IMAGE PROMPTS
// =====================================================

const subcategoryTemplates: Record<string, SubcategoryTemplate> = {
  // === OUTERWEAR ===
  'Rain Jackets': {
    variant: 'laid flat, front view, hood visible, partially unzipped',
    camera: { angle: 'front', distance: 'full' },
    details: ['sealed seams visible', 'adjustable hood', 'pit zips', 'storm flap']
  },
  'Insulated Jackets': {
    variant: 'laid flat, front view, showing quilted pattern',
    camera: { angle: 'front', distance: 'full' },
    details: ['baffle construction visible', 'insulated hood', 'hand warmer pockets', 'elastic cuffs']
  },
  'Softshell Jackets': {
    variant: 'laid flat, front view, sleeves extended',
    camera: { angle: 'front', distance: 'full' },
    details: ['stretchy fabric texture', 'zippered chest pocket', 'articulated sleeves', 'chin guard']
  },
  'Fleece Jackets': {
    variant: 'laid flat, front view, showing plush texture',
    camera: { angle: 'front', distance: 'full' },
    details: ['fleece texture visible', 'zippered pockets', 'elastic binding', 'full-zip front']
  },
  'Vests': {
    variant: 'laid flat, front view, showing armholes',
    camera: { angle: 'front', distance: 'full' },
    details: ['insulated body', 'zippered pockets', 'stand-up collar', 'elastic hem']
  },

  // === TOPS ===
  'T-Shirts': {
    variant: 'laid flat, front view, sleeves visible',
    camera: { angle: 'front', distance: 'full' },
    details: ['crew neck', 'relaxed fit', 'tagless label', 'reinforced shoulder seams']
  },
  'Long Sleeve Shirts': {
    variant: 'laid flat, front view, sleeves extended',
    camera: { angle: 'front', distance: 'full' },
    details: ['button placket', 'roll-up sleeve tabs', 'chest pocket', 'UPF rating label']
  },
  'Polo Shirts': {
    variant: 'laid flat, front view, collar visible',
    camera: { angle: 'front', distance: 'full' },
    details: ['ribbed collar', 'three-button placket', 'side vents', 'moisture-wicking fabric']
  },
  'Hoodies': {
    variant: 'laid flat, front view, hood spread out',
    camera: { angle: 'front', distance: 'full' },
    details: ['adjustable drawcord hood', 'kangaroo pocket', 'ribbed cuffs', 'full-zip or pullover']
  },
  'Sweaters': {
    variant: 'laid flat, front view, showing knit pattern',
    camera: { angle: 'front', distance: 'full' },
    details: ['knit texture visible', 'crew or v-neck', 'ribbed hem', 'shoulder seam detail']
  },
  'Quarter-Zip Pullovers': {
    variant: 'laid flat, front view, zipper partially open',
    camera: { angle: 'front', distance: 'full' },
    details: ['quarter-zip collar', 'chin guard', 'raglan sleeves', 'thumbhole cuffs']
  },

  // === BOTTOMS ===
  'Hiking Pants': {
    variant: 'laid flat, front view, legs straight',
    camera: { angle: 'front', distance: 'full' },
    details: ['cargo pockets visible', 'articulated knees', 'belt loops', 'gusseted crotch']
  },
  'Cargo Pants': {
    variant: 'laid flat, front view, showing cargo pockets',
    camera: { angle: 'front', distance: 'full' },
    details: ['large cargo pockets', 'reinforced seat', 'adjustable waist', 'zip-off legs']
  },
  'Shorts': {
    variant: 'laid flat, front view',
    camera: { angle: 'front', distance: 'full' },
    details: ['zippered pockets', 'elastic waistband', 'built-in brief', 'reflective details']
  },
  'Joggers': {
    variant: 'laid flat, front view, showing tapered legs',
    camera: { angle: 'front', distance: 'full' },
    details: ['elastic cuffs', 'drawstring waist', 'side pockets', 'relaxed fit']
  },
  'Leggings': {
    variant: 'laid flat, front view, legs together',
    camera: { angle: 'front', distance: 'full' },
    details: ['high waistband', 'compression fit', 'hidden pocket', 'flatlock seams']
  },

  // === BASE LAYERS ===
  'Base Layer Tops': {
    variant: 'laid flat, front view, showing fabric texture',
    camera: { angle: 'front', distance: 'full' },
    details: ['crew neck', 'flatlock seams', 'moisture-wicking fabric', 'thumbhole cuffs']
  },
  'Base Layer Bottoms': {
    variant: 'laid flat, front view, legs straight',
    camera: { angle: 'front', distance: 'full' },
    details: ['elastic waistband', 'flatlock seams', 'four-way stretch', 'odor control']
  },

  // === ACCESSORIES ===
  'Beanies': {
    variant: 'standing upright on invisible form',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['knit pattern visible', 'fold-up cuff', 'fleece lining', 'embroidered logo']
  },
  'Baseball Caps': {
    variant: 'three-quarter view showing crown and brim',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['curved brim', 'adjustable strap', 'ventilation eyelets', 'structured crown']
  },
  'Sun Hats': {
    variant: 'top-down view showing wide brim',
    camera: { angle: 'top-down', distance: 'medium' },
    details: ['wide brim', 'chin strap', 'UPF protection', 'moisture-wicking sweatband']
  },
  'Gloves': {
    variant: 'pair, one palm up showing grip, one palm down',
    camera: { angle: 'front', distance: 'medium' },
    details: ['touchscreen fingertips', 'fleece lining', 'adjustable wrist', 'grip pattern']
  },
  'Neck Gaiters': {
    variant: 'standing upright in tube form',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['seamless construction', 'moisture-wicking', 'UPF protection', 'multiple wear styles']
  },
  'Scarves': {
    variant: 'draped in loose S-curve showing fabric',
    camera: { angle: 'three-quarter', distance: 'full' },
    details: ['fringe ends', 'woven texture', 'soft hand feel', 'generous length']
  },
  'Socks': {
    variant: 'pair, laid flat side by side',
    camera: { angle: 'front', distance: 'medium' },
    details: ['cushioned sole', 'arch support', 'reinforced heel and toe', 'moisture management']
  },
  'Belts': {
    variant: 'coiled in loose circle showing buckle',
    camera: { angle: 'three-quarter', distance: 'medium' },
    details: ['metal buckle', 'webbing material', 'adjustable fit', 'bottle opener buckle']
  }
};

// =====================================================
// IMAGE PROMPT GENERATION
// =====================================================

function generateImagePrompt(
  subcategory: string,
  material: string,
  colors: string[]
): ImagePrompt {
  const template = subcategoryTemplates[subcategory];

  if (!template) {
    // Fallback for any missing subcategories
    return {
      version: 1,
      subject: {
        product: `${material.toLowerCase()} ${subcategory.toLowerCase()}`,
        variant: 'front view',
        color: colors[0].toLowerCase(),
        material: material.toLowerCase(),
        details: []
      },
      camera: {
        angle: 'front',
        distance: 'full',
        focus: `sharp focus on entire product`
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

  const primaryColor = colors[0];
  // Singularize the subcategory for product type
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
      angle: template.camera.angle,
      distance: template.camera.distance,
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

// Product distribution - ALL CLOTHING (100 products)
// Category IDs: 1=Outerwear, 2=Tops, 3=Bottoms, 4=Base Layers, 5=Accessories
const productDistribution = [
  // Outerwear (20 products) - Category 1
  { categoryId: 1, subcategory: 'Rain Jackets', count: 5, sizes: sizeConfigs.clothing, priceType: 'outerwear' },
  { categoryId: 1, subcategory: 'Insulated Jackets', count: 5, sizes: sizeConfigs.clothing, priceType: 'outerwear' },
  { categoryId: 1, subcategory: 'Softshell Jackets', count: 4, sizes: sizeConfigs.clothing, priceType: 'outerwear' },
  { categoryId: 1, subcategory: 'Fleece Jackets', count: 3, sizes: sizeConfigs.clothing, priceType: 'outerwear' },
  { categoryId: 1, subcategory: 'Vests', count: 3, sizes: sizeConfigs.clothing, priceType: 'outerwear' },

  // Tops (25 products) - Category 2
  { categoryId: 2, subcategory: 'T-Shirts', count: 6, sizes: sizeConfigs.clothing, priceType: 'tops' },
  { categoryId: 2, subcategory: 'Long Sleeve Shirts', count: 5, sizes: sizeConfigs.clothing, priceType: 'tops' },
  { categoryId: 2, subcategory: 'Polo Shirts', count: 4, sizes: sizeConfigs.clothing, priceType: 'tops' },
  { categoryId: 2, subcategory: 'Hoodies', count: 5, sizes: sizeConfigs.clothing, priceType: 'tops' },
  { categoryId: 2, subcategory: 'Sweaters', count: 3, sizes: sizeConfigs.clothing, priceType: 'tops' },
  { categoryId: 2, subcategory: 'Quarter-Zip Pullovers', count: 2, sizes: sizeConfigs.clothing, priceType: 'tops' },

  // Bottoms (20 products) - Category 3
  { categoryId: 3, subcategory: 'Hiking Pants', count: 5, sizes: sizeConfigs.clothing, priceType: 'bottoms' },
  { categoryId: 3, subcategory: 'Cargo Pants', count: 4, sizes: sizeConfigs.clothing, priceType: 'bottoms' },
  { categoryId: 3, subcategory: 'Shorts', count: 4, sizes: sizeConfigs.clothing, priceType: 'bottoms' },
  { categoryId: 3, subcategory: 'Joggers', count: 4, sizes: sizeConfigs.clothing, priceType: 'bottoms' },
  { categoryId: 3, subcategory: 'Leggings', count: 3, sizes: sizeConfigs.clothing, priceType: 'bottoms' },

  // Base Layers (10 products) - Category 4
  { categoryId: 4, subcategory: 'Base Layer Tops', count: 5, sizes: sizeConfigs.clothing, priceType: 'base_layers' },
  { categoryId: 4, subcategory: 'Base Layer Bottoms', count: 5, sizes: sizeConfigs.clothing, priceType: 'base_layers' },

  // Accessories (25 products) - Category 5
  { categoryId: 5, subcategory: 'Beanies', count: 4, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Baseball Caps', count: 4, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Sun Hats', count: 3, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Gloves', count: 4, sizes: sizeConfigs.clothing, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Neck Gaiters', count: 3, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Scarves', count: 2, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Socks', count: 3, sizes: sizeConfigs.clothing, priceType: 'accessories' },
  { categoryId: 5, subcategory: 'Belts', count: 2, sizes: sizeConfigs.oneSize, priceType: 'accessories' },
];

function generateSKU(index: number): string {
  return `CLO-${String(index).padStart(4, '0')}`;
}

function generateDescription(productType: string, material: string): string {
  const descriptions: Record<string, string> = {
    // Outerwear
    'Rain Jackets': `Fully waterproof ${material.toLowerCase()} rain jacket with sealed seams and adjustable hood. Lightweight, packable, and perfect for unpredictable weather on the trail.`,
    'Insulated Jackets': `Premium ${material.toLowerCase()} insulated jacket offering exceptional warmth-to-weight ratio. Features quilted baffles and water-resistant shell for cold weather adventures.`,
    'Softshell Jackets': `Versatile ${material.toLowerCase()} softshell jacket with four-way stretch and wind resistance. Ideal for high-output activities in cool conditions.`,
    'Fleece Jackets': `Cozy ${material.toLowerCase()} fleece jacket providing warmth without bulk. Perfect as a midlayer or standalone piece for casual outdoor wear.`,
    'Vests': `Lightweight ${material.toLowerCase()} vest delivering core warmth and freedom of movement. Great for layering or solo wear on mild days.`,

    // Tops
    'T-Shirts': `Comfortable ${material.toLowerCase()} t-shirt with moisture-wicking performance. Perfect for hiking, training, or everyday adventures.`,
    'Long Sleeve Shirts': `Versatile ${material.toLowerCase()} long sleeve shirt with UPF sun protection. Roll-up sleeves and ventilation for all-day comfort.`,
    'Polo Shirts': `Classic ${material.toLowerCase()} polo shirt with athletic fit and quick-dry fabric. Transitions seamlessly from trail to town.`,
    'Hoodies': `Relaxed ${material.toLowerCase()} hoodie with adjustable drawcord and kangaroo pocket. Your go-to layer for cool mornings and campfire evenings.`,
    'Sweaters': `Timeless ${material.toLowerCase()} sweater with natural temperature regulation. Breathable, odor-resistant, and incredibly soft.`,
    'Quarter-Zip Pullovers': `Athletic ${material.toLowerCase()} quarter-zip pullover with thumbhole cuffs. Ideal for active pursuits in variable conditions.`,

    // Bottoms
    'Hiking Pants': `Durable ${material.toLowerCase()} hiking pants with articulated knees and gusseted crotch. Built for all-day comfort on the trail.`,
    'Cargo Pants': `Functional ${material.toLowerCase()} cargo pants with ample pocket storage. Reinforced construction handles rugged terrain.`,
    'Shorts': `Lightweight ${material.toLowerCase()} shorts with quick-dry fabric and secure pockets. Perfect for warm weather adventures.`,
    'Joggers': `Comfortable ${material.toLowerCase()} joggers with relaxed fit and tapered legs. Versatile enough for trail or travel.`,
    'Leggings': `High-performance ${material.toLowerCase()} leggings with compression fit and hidden pocket. Flatlock seams prevent chafing during high-output activities.`,

    // Base Layers
    'Base Layer Tops': `Thermal ${material.toLowerCase()} base layer top providing warmth without bulk. Flatlock seams and four-way stretch for next-to-skin comfort.`,
    'Base Layer Bottoms': `Technical ${material.toLowerCase()} base layer bottoms with moisture-wicking performance. Essential foundation for cold weather layering.`,

    // Accessories
    'Beanies': `Warm ${material.toLowerCase()} beanie with fleece lining and classic cuff. A cold-weather essential for any outdoor enthusiast.`,
    'Baseball Caps': `Structured ${material.toLowerCase()} baseball cap with curved brim and adjustable strap. Perfect for sun protection on the trail.`,
    'Sun Hats': `Wide-brim ${material.toLowerCase()} sun hat with UPF 50+ protection. Breathable construction and adjustable chin strap for windy conditions.`,
    'Gloves': `Touchscreen-compatible ${material.toLowerCase()} gloves with fleece lining. Maintain dexterity while keeping hands warm.`,
    'Neck Gaiters': `Versatile ${material.toLowerCase()} neck gaiter with seamless construction. Wear it multiple ways for wind and sun protection.`,
    'Scarves': `Luxuriously soft ${material.toLowerCase()} scarf with generous length. Adds warmth and style to any outdoor outfit.`,
    'Socks': `Cushioned ${material.toLowerCase()} socks with arch support and blister prevention. Moisture-wicking performance for all-day comfort.`,
    'Belts': `Durable ${material.toLowerCase()} belt with quick-release buckle. Lightweight and low-profile for comfortable all-day wear.`,
  };

  return descriptions[productType] || `High-quality ${material.toLowerCase()} ${productType.toLowerCase()} for outdoor enthusiasts.`;
}

function generateImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name.substring(0, 30));
  return `https://placehold.co/600x600/2d5a27/ffffff?text=${encodedName}`;
}

console.log('Seeding clothing products...');

const insertProduct = db.prepare(`
  INSERT INTO products (
    sku, name, description, category_id, subcategory,
    price_in_cents, sizes, colors, image_url, image_prompt_json,
    stock_quantity, weight_oz, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalProducts = 0;

for (const config of productDistribution) {
  for (let i = 0; i < config.count; i++) {
    const brand = rng.pick(brands);
    const material = rng.pick(materials);
    const suffix = rng.pick(suffixes);
    const name = `${brand} ${material} ${config.subcategory.replace(/s$/, '')} ${suffix}`;

    const sku = generateSKU(totalProducts + 1);
    const description = generateDescription(config.subcategory, material);

    const priceRange = priceRanges[config.priceType];
    const priceInCents = rng.range(priceRange.min, priceRange.max);

    // Select random subset of sizes
    const numSizes = rng.range(Math.min(2, config.sizes.length), config.sizes.length);
    const sizes = rng.shuffle(config.sizes).slice(0, numSizes);

    // Select random subset of colors
    const numColors = rng.range(3, 5);
    const colors = rng.shuffle(allColors).slice(0, numColors);

    const imageUrl = generateImageUrl(name);
    const stockQuantity = rng.range(5, 150);
    const weightOz = rng.range(4, 320) / 10; // 0.4 - 32.0 oz (clothing weight range)

    const createdAt = new Date(
      Date.now() - rng.range(0, 365) * 24 * 60 * 60 * 1000
    ).toISOString();

    // Generate image prompt JSON
    const imagePrompt = generateImagePrompt(config.subcategory, material, colors);
    const imagePromptJson = JSON.stringify(imagePrompt);

    insertProduct.run(
      sku,
      name,
      description,
      config.categoryId,
      config.subcategory,
      priceInCents,
      JSON.stringify(sizes),
      JSON.stringify(colors),
      imageUrl,
      imagePromptJson,
      stockQuantity,
      weightOz,
      createdAt
    );

    totalProducts++;
  }
}

console.log(`Successfully seeded ${totalProducts} clothing products with image prompts!`);

// Verify count
const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
console.log(`Database now contains ${count.count} products.`);

// Show sample prompt
const sampleProduct = db.prepare('SELECT name, image_prompt_json FROM products LIMIT 1').get() as { name: string; image_prompt_json: string };
console.log(`\nSample image prompt for "${sampleProduct.name}":`);
console.log(JSON.parse(sampleProduct.image_prompt_json));
