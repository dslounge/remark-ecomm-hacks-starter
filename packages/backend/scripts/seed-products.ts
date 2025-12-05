import { db } from '../src/db/connection.js';

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
    price_in_cents, sizes, colors, image_url, stock_quantity,
    weight_oz, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      stockQuantity,
      weightOz,
      createdAt
    );

    totalProducts++;
  }
}

console.log(`Successfully seeded ${totalProducts} products!`);

// Verify count
const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
console.log(`Database now contains ${count.count} products.`);
