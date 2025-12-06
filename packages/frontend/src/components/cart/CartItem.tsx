import type { CartItem as CartItemType } from '@summit-gear/shared';
import { Button } from '../ui/Button';
import { formatPrice } from '../../lib/utils';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  selectable = false,
  selected = false,
  onToggleSelect = () => undefined,
}: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {selectable && (
        <div className="pt-1">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-forest-700 focus:ring-forest-700"
            checked={selected}
            onChange={onToggleSelect}
          />
        </div>
      )}
      {/* Product Image */}
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-20 w-20 object-cover rounded-md"
      />

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Size: {item.size} | Color: {item.color}
        </p>
        <p className="text-sm font-semibold text-forest-700 mt-1">
          {formatPrice(item.priceInCents)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="h-8 w-8 p-0"
        >
          -
        </Button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="h-8 w-8 p-0"
        >
          +
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Remove
      </Button>
    </div>
  );
}
