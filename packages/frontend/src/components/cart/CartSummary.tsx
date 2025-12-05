import { formatPrice } from '../../lib/utils';

export interface CartSummaryProps {
  subtotalInCents: number;
}

export function CartSummary({ subtotalInCents }: CartSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">
          {formatPrice(subtotalInCents)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Shipping</span>
        <span className="text-gray-500 text-xs">Calculated at checkout</span>
      </div>
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-base font-semibold text-forest-700">
            {formatPrice(subtotalInCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
