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

// Data pools
const brands = ['Summit', 'Alpine', 'Trailhead', 'Ridgeline', 'Basecamp', 'Vertex', 'Pinnacle', 'Expedition', 'Traverse', 'Wildland'];
const materials = ['Gore-Tex', 'Down', 'Merino', 'Carbon', 'Titanium', 'Ultralight', 'Ripstop', 'Breathable', 'Insulated', 'Waterproof'];
const suffixes = ['Pro', 'Elite', 'Lite', 'X2', 'Plus', 'Classic', 'Sport', 'Tech'];

const sizeConfigs = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  footwear: ['7', '8', '9', '10', '11', '12', '13'],
  tents: ['1P', '2P', '3P', '4P'],
  backpacks: ['S/M', 'M/L', 'L/XL'],
  sleepingBags: ['Regular', 'Long'],
  oneSize: ['One Size'],
  ropes: ['30m', '40m', '50m', '60m', '70m'],
};

const colorPools = {
  outdoor: ['Forest Green', 'Slate Blue', 'Burnt Orange', 'Stone Gray', 'Deep Navy'],
  neutral: ['Black', 'Charcoal', 'Olive'],
};

const allColors = [...colorPools.outdoor, ...colorPools.neutral];

const priceRanges: Record<number, { min: number; max: number }> = {
  1: { min: 2999, max: 59999 },   // Camping: $29.99 - $599.99
  2: { min: 1499, max: 29999 },   // Climbing: $14.99 - $299.99
  3: { min: 3999, max: 34999 },   // Apparel: $39.99 - $349.99
  4: { min: 7999, max: 24999 },   // Footwear: $79.99 - $249.99
  5: { min: 2499, max: 19999 },   // Cycling: $24.99 - $199.99
  6: { min: 1999, max: 39999 },   // Water: $19.99 - $399.99
  7: { min: 1999, max: 24999 },   // Winter: $19.99 - $249.99
  8: { min: 999, max: 14999 },    // Accessories: $9.99 - $149.99
};

// =====================================================
// SUBCATEGORY TEMPLATES FOR IMAGE PROMPTS
// =====================================================

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

// Product distribution
const productDistribution = [
  // Camping & Hiking (18)
  { categoryId: 1, subcategory: 'Tents', count: 4, sizes: sizeConfigs.tents },
  { categoryId: 1, subcategory: 'Sleeping Bags', count: 4, sizes: sizeConfigs.sleepingBags },
  { categoryId: 1, subcategory: 'Backpacks', count: 5, sizes: sizeConfigs.backpacks },
  { categoryId: 1, subcategory: 'Trekking Poles', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 1, subcategory: 'Stoves', count: 3, sizes: sizeConfigs.oneSize },

  // Climbing (10)
  { categoryId: 2, subcategory: 'Harnesses', count: 3, sizes: sizeConfigs.clothing },
  { categoryId: 2, subcategory: 'Ropes', count: 2, sizes: sizeConfigs.ropes },
  { categoryId: 2, subcategory: 'Carabiners', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 2, subcategory: 'Chalk Bags', count: 3, sizes: sizeConfigs.oneSize },

  // Apparel (20)
  { categoryId: 3, subcategory: 'Jackets', count: 6, sizes: sizeConfigs.clothing },
  { categoryId: 3, subcategory: 'Pants', count: 5, sizes: sizeConfigs.clothing },
  { categoryId: 3, subcategory: 'Shirts', count: 5, sizes: sizeConfigs.clothing },
  { categoryId: 3, subcategory: 'Base Layers', count: 4, sizes: sizeConfigs.clothing },

  // Footwear (12)
  { categoryId: 4, subcategory: 'Hiking Boots', count: 4, sizes: sizeConfigs.footwear },
  { categoryId: 4, subcategory: 'Trail Runners', count: 4, sizes: sizeConfigs.footwear },
  { categoryId: 4, subcategory: 'Sandals', count: 2, sizes: sizeConfigs.footwear },
  { categoryId: 4, subcategory: 'Climbing Shoes', count: 2, sizes: sizeConfigs.footwear },

  // Cycling (10)
  { categoryId: 5, subcategory: 'Helmets', count: 3, sizes: sizeConfigs.clothing },
  { categoryId: 5, subcategory: 'Jerseys', count: 3, sizes: sizeConfigs.clothing },
  { categoryId: 5, subcategory: 'Shorts', count: 2, sizes: sizeConfigs.clothing },
  { categoryId: 5, subcategory: 'Gloves', count: 2, sizes: sizeConfigs.clothing },

  // Water Sports (10)
  { categoryId: 6, subcategory: 'Dry Bags', count: 3, sizes: sizeConfigs.oneSize },
  { categoryId: 6, subcategory: 'Life Vests', count: 2, sizes: sizeConfigs.clothing },
  { categoryId: 6, subcategory: 'Wetsuits', count: 3, sizes: sizeConfigs.clothing },
  { categoryId: 6, subcategory: 'Rashguards', count: 2, sizes: sizeConfigs.clothing },

  // Winter Sports (10)
  { categoryId: 7, subcategory: 'Goggles', count: 3, sizes: sizeConfigs.oneSize },
  { categoryId: 7, subcategory: 'Gloves', count: 3, sizes: sizeConfigs.clothing },
  { categoryId: 7, subcategory: 'Beanies', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 7, subcategory: 'Neck Gaiters', count: 2, sizes: sizeConfigs.oneSize },

  // Accessories (10)
  { categoryId: 8, subcategory: 'Headlamps', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 8, subcategory: 'Water Bottles', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 8, subcategory: 'Multi-tools', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 8, subcategory: 'First Aid', count: 2, sizes: sizeConfigs.oneSize },
  { categoryId: 8, subcategory: 'Sunglasses', count: 2, sizes: sizeConfigs.oneSize },
];

function generateSKU(categoryId: number, index: number): string {
  const prefix = ['CMP', 'CLM', 'APP', 'FTW', 'CYC', 'WTR', 'WNT', 'ACC'][categoryId - 1];
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

function generateDescription(productType: string, material: string): string {
  const descriptions: Record<string, string> = {
    'Tents': `Premium ${material.toLowerCase()} tent designed for all-season camping. Features durable construction, easy setup, and excellent weather protection. Perfect for backpacking and car camping adventures.`,
    'Sleeping Bags': `High-performance ${material.toLowerCase()} sleeping bag offering exceptional warmth and comfort. Lightweight and compressible for easy packing. Ideal for three-season camping.`,
    'Backpacks': `Ergonomic ${material.toLowerCase()} backpack with advanced suspension system and ample storage. Features multiple compartments, hydration compatibility, and rain cover included.`,
    'Trekking Poles': `Lightweight ${material.toLowerCase()} trekking poles with adjustable length and shock absorption. Provides stability and reduces strain on knees during long hikes.`,
    'Stoves': `Compact ${material.toLowerCase()} camping stove with efficient fuel consumption and fast boil times. Includes piezo ignition and wind protection.`,
    'Harnesses': `Professional-grade ${material.toLowerCase()} climbing harness with reinforced tie-in points and adjustable leg loops. Comfortable for all-day wear.`,
    'Ropes': `Dynamic ${material.toLowerCase()} climbing rope meeting UIAA safety standards. Excellent handling characteristics and durability for sport and trad climbing.`,
    'Carabiners': `Ultra-strong ${material.toLowerCase()} carabiner with smooth gate action. Certified for climbing and rescue operations.`,
    'Chalk Bags': `Practical ${material.toLowerCase()} chalk bag with fleece lining and drawstring closure. Includes adjustable waist belt.`,
    'Jackets': `Technical ${material.toLowerCase()} jacket providing superior weather protection. Features fully sealed seams, adjustable hood, and pit zips for ventilation.`,
    'Pants': `Durable ${material.toLowerCase()} pants built for outdoor performance. Quick-drying fabric with articulated knees and reinforced seat and knees.`,
    'Shirts': `Moisture-wicking ${material.toLowerCase()} shirt perfect for active pursuits. Anti-odor treatment and UPF sun protection.`,
    'Base Layers': `Thermal ${material.toLowerCase()} base layer providing warmth without bulk. Flatlock seams prevent chafing during high-output activities.`,
    'Hiking Boots': `Rugged ${material.toLowerCase()} hiking boots with ankle support and aggressive tread. Waterproof construction keeps feet dry on any trail.`,
    'Trail Runners': `Lightweight ${material.toLowerCase()} trail running shoes with responsive cushioning. Superior traction and quick-draining design.`,
    'Sandals': `Versatile ${material.toLowerCase()} sandals with contoured footbed and adjustable straps. Perfect for camp, water crossings, and casual wear.`,
    'Climbing Shoes': `Precision ${material.toLowerCase()} climbing shoes with sticky rubber and asymmetric last. Excels on vertical terrain and overhangs.`,
    'Helmets': `Aerodynamic ${material.toLowerCase()} cycling helmet with in-mold construction. Multiple vents for cooling and MIPS technology for added protection.`,
    'Jerseys': `Performance ${material.toLowerCase()} cycling jersey with full-length zipper and rear pockets. Moisture management and reflective details.`,
    'Shorts': `Padded ${material.toLowerCase()} cycling shorts with ergonomic chamois. Flatlock seams and gripper elastic at leg openings.`,
    'Gloves': `Protective ${material.toLowerCase()} gloves with padded palms and touchscreen-compatible fingertips. Breathable construction for all-day comfort.`,
    'Dry Bags': `Waterproof ${material.toLowerCase()} dry bag with roll-top closure. Keeps gear dry during kayaking, rafting, and boat trips.`,
    'Life Vests': `Coast Guard approved ${material.toLowerCase()} life vest with secure buckles and D-ring. Comfortable fit doesn't restrict movement.`,
    'Wetsuits': `Premium ${material.toLowerCase()} wetsuit with flatlock seams and flexible panels. Provides thermal protection for water sports.`,
    'Rashguards': `Quick-drying ${material.toLowerCase()} rashguard with UPF 50+ sun protection. Flatlock seams and athletic fit.`,
    'Goggles': `Anti-fog ${material.toLowerCase()} goggles with interchangeable lenses. Wide field of view and comfortable foam padding.`,
    'Beanies': `Warm ${material.toLowerCase()} beanie with fold-up cuff. Soft, stretchy fabric provides all-day comfort.`,
    'Neck Gaiters': `Versatile ${material.toLowerCase()} neck gaiter for wind and cold protection. Can be worn multiple ways.`,
    'Headlamps': `Powerful ${material.toLowerCase()} headlamp with multiple brightness modes. Long battery life and weather-resistant construction.`,
    'Water Bottles': `Insulated ${material.toLowerCase()} water bottle keeps drinks cold for 24 hours. Leak-proof lid and fits most cup holders.`,
    'Multi-tools': `Compact ${material.toLowerCase()} multi-tool with 15 functions. Includes knife, pliers, screwdrivers, and bottle opener.`,
    'First Aid': `Comprehensive ${material.toLowerCase()} first aid kit for outdoor emergencies. Includes bandages, medications, and survival tools.`,
    'Sunglasses': `Polarized ${material.toLowerCase()} sunglasses with 100% UV protection. Lightweight frame and impact-resistant lenses.`,
  };

  return descriptions[productType] || `High-quality ${material.toLowerCase()} ${productType.toLowerCase()} for outdoor enthusiasts.`;
}

function generateImageUrl(name: string): string {
  const encodedName = encodeURIComponent(name.substring(0, 30));
  return `https://placehold.co/600x600/2d5a27/ffffff?text=${encodedName}`;
}

console.log('Seeding products...');

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

    const sku = generateSKU(config.categoryId, totalProducts + 1);
    const description = generateDescription(config.subcategory, material);

    const priceRange = priceRanges[config.categoryId];
    const priceInCents = rng.range(priceRange.min, priceRange.max);

    // Select random subset of sizes
    const numSizes = rng.range(Math.min(2, config.sizes.length), config.sizes.length);
    const sizes = rng.shuffle(config.sizes).slice(0, numSizes);

    // Select random subset of colors
    const numColors = rng.range(3, 5);
    const colors = rng.shuffle(allColors).slice(0, numColors);

    const imageUrl = generateImageUrl(name);
    const stockQuantity = rng.range(5, 150);
    const weightOz = rng.range(4, 800) / 10; // 0.4 - 80.0 oz

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

console.log(`Successfully seeded ${totalProducts} products with image prompts!`);

// Verify count
const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
console.log(`Database now contains ${count.count} products.`);

// Show sample prompt
const sampleProduct = db.prepare('SELECT name, image_prompt_json FROM products LIMIT 1').get() as { name: string; image_prompt_json: string };
console.log(`\nSample image prompt for "${sampleProduct.name}":`);
console.log(JSON.parse(sampleProduct.image_prompt_json));
