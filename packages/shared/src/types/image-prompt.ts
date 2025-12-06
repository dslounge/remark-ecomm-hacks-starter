/**
 * Image Prompt Schema for AI-generated product images
 * All images are studio product photography on white background
 */

export interface ImagePrompt {
  version: 1;

  subject: {
    product: string;           // "gore-tex tent"
    variant: string;           // "fully assembled, door unzipped showing interior"
    color: string;             // "forest green"
    material?: string;         // "gore-tex"
    details?: string[];        // ["pole structure visible", "mesh panels"]
  };

  camera: {
    angle: 'front' | 'three-quarter' | 'side' | 'top-down' | 'low';
    distance: 'close-up' | 'medium' | 'full';
    focus: string;             // "sharp focus on entire tent"
  };

  lighting: {
    setup: 'softbox' | 'diffused' | 'rim-accent';
    shadows: 'soft' | 'minimal' | 'none';
  };

  style: {
    quality: string;           // "professional e-commerce product photography, pure white seamless background"
  };

  technical: {
    aspectRatio: '1:1';
    resolution: '2K';
  };
}

/**
 * Subcategory template for consistent image generation
 */
export interface SubcategoryTemplate {
  variant: string;
  camera: {
    angle: 'front' | 'three-quarter' | 'side' | 'top-down' | 'low';
    distance: 'close-up' | 'medium' | 'full';
  };
  details: string[];
}
