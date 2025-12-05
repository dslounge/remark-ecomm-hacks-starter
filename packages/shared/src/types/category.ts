export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

// Seed data - exported for use in backend seeding
export const CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Camping & Hiking', slug: 'camping-hiking', description: 'Tents, sleeping bags, backpacks, and trail essentials' },
  { name: 'Climbing', slug: 'climbing', description: 'Harnesses, ropes, carabiners, and climbing gear' },
  { name: 'Apparel', slug: 'apparel', description: 'Jackets, pants, base layers, and outdoor clothing' },
  { name: 'Footwear', slug: 'footwear', description: 'Hiking boots, trail runners, and outdoor shoes' },
  { name: 'Cycling', slug: 'cycling', description: 'Helmets, jerseys, shorts, and bike accessories' },
  { name: 'Water Sports', slug: 'water-sports', description: 'Kayaking, paddleboarding, and water gear' },
  { name: 'Winter Sports', slug: 'winter-sports', description: 'Ski and snowboard apparel and accessories' },
  { name: 'Accessories', slug: 'accessories', description: 'Headlamps, water bottles, tools, and more' },
];
