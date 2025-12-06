import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Product } from '@summit-gear/shared';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SizeSelector } from './SizeSelector';
import { ColorSelector } from './ColorSelector';
import { Input } from '../ui/Input';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../hooks/useCart';
import { useOutfitComposerStore } from '../../stores/outfitComposer';

export interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const addProduct = useOutfitComposerStore((state) => state.addProduct);
  const openComposer = useOutfitComposerStore((state) => state.openComposer);
  const hasProduct = useOutfitComposerStore((state) => state.hasProduct(product.id));

  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `product-detail-${product.id}`,
    data: {
      type: 'product',
      product,
    },
  });

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      priceInCents: product.priceInCents,
      size: selectedSize,
      color: selectedColor,
      imageUrl: product.imageUrl,
    });

    // Reset quantity and show feedback
    setQuantity(1);
    alert('Added to cart!'); // In a real app, use a toast notification
  };

  const handleAddToOutfit = () => {
    addProduct(product);
    openComposer();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Image */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {/* Drag hint overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
          <span className="opacity-0 hover:opacity-100 bg-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            Drag to Outfit
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <Badge variant="category" className="mb-2">
            {product.subcategory}
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold text-forest-700">
            {formatPrice(product.priceInCents)}
          </p>
        </div>

        <div className="prose prose-sm text-gray-600">
          <p>{product.description}</p>
        </div>

        {/* Stock Status */}
        <div>
          {product.stockQuantity > 0 ? (
            <Badge variant="stock">
              {product.stockQuantity > 10
                ? 'In Stock'
                : `Only ${product.stockQuantity} left`}
            </Badge>
          ) : (
            <Badge variant="default" className="bg-red-100 text-red-800">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Size Selection */}
        {product.sizes.length > 0 && (
          <SizeSelector
            sizes={product.sizes}
            selected={selectedSize}
            onChange={setSelectedSize}
          />
        )}

        {/* Color Selection */}
        {product.colors.length > 0 && (
          <ColorSelector
            colors={product.colors}
            selected={selectedColor}
            onChange={setSelectedColor}
          />
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 p-0"
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 p-0"
            >
              +
            </Button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0}
            className="w-full"
          >
            {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {/* Add to Outfit Button */}
          <Button
            variant={hasProduct ? 'outline' : 'secondary'}
            size="lg"
            onClick={handleAddToOutfit}
            className="w-full"
          >
            {hasProduct ? '✓ In Outfit Composer' : 'Add to Outfit Composer'}
          </Button>
        </div>

        {/* Product Details */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Product Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">SKU</dt>
              <dd className="text-gray-900 font-medium">{product.sku}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Weight</dt>
              <dd className="text-gray-900 font-medium">{product.weightOz} oz</dd>
            </div>
          </dl>
        </div>

        {/* Image Prompt JSON */}
        {product.imagePromptJson && (
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-medium text-gray-900">
                Image Prompt
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${isPromptExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isPromptExpanded && (
              <div className="mt-3">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(product.imagePromptJson));
                      alert('Prompt copied to clipboard!');
                    }}
                  >
                    Copy Prompt
                  </Button>
                </div>
                <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(product.imagePromptJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
