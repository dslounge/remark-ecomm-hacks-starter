import { Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import type { Product } from '@summit-gear/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPrice } from '../../lib/utils';
import { useOutfitComposerStore } from '../../stores/outfitComposer';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addProduct = useOutfitComposerStore((state) => state.addProduct);
  const openComposer = useOutfitComposerStore((state) => state.openComposer);
  const hasProduct = useOutfitComposerStore((state) => state.hasProduct(product.id));

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `product-${product.id}`,
    data: {
      type: 'product',
      product,
    },
  });

  const handleAddToOutfit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addProduct(product);
    openComposer();
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <Link to={`/products/${product.id}`}>
        <Card className="group overflow-hidden h-full flex flex-col">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden bg-gray-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>

          {/* Product Info */}
          <div className="p-4 flex-1 flex flex-col">
            <Badge variant="category" className="w-fit mb-2">
              {product.subcategory}
            </Badge>

            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 flex-1">
              {product.name}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-forest-700">
                {formatPrice(product.priceInCents)}
              </span>

              {/* Stock indicator */}
              {product.stockQuantity < 10 && product.stockQuantity > 0 && (
                <span className="text-xs text-burnt-600">
                  Only {product.stockQuantity} left
                </span>
              )}
            </div>

            {/* Add to Outfit Button - shown on hover */}
            <Button
              variant={hasProduct ? 'outline' : 'primary'}
              size="sm"
              className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddToOutfit}
            >
              {hasProduct ? 'In Outfit' : 'Add to Outfit'}
            </Button>
          </div>
        </Card>
      </Link>
    </div>
  );
}
