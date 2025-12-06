export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

// Seed data - exported for use in backend seeding
export const CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Outerwear', slug: 'outerwear', description: 'Rain jackets, insulated jackets, fleece, softshells, and vests' },
  { name: 'Tops', slug: 'tops', description: 'T-shirts, long sleeves, polos, hoodies, and sweaters' },
  { name: 'Bottoms', slug: 'bottoms', description: 'Hiking pants, cargo pants, shorts, joggers, and leggings' },
  { name: 'Base Layers', slug: 'base-layers', description: 'Thermal tops and bottoms for layering in cold conditions' },
  { name: 'Accessories', slug: 'accessories', description: 'Hats, gloves, scarves, socks, belts, and more' },
];
