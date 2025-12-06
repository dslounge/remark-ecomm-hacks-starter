import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { Button } from '../components/ui/Button';
import { useOutfitComposerStore } from '../stores/outfitComposer';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const openComposer = useOutfitComposerStore((state) => state.openComposer);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="h-24 w-24 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
        <Link to="/products">
          <Button variant="primary" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items ({items.length})</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Cart
              </Button>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.size}-${item.color}`}
                  item={item}
                  onUpdateQuantity={(quantity) =>
                    updateQuantity(item.productId, item.size, item.color, quantity)
                  }
                  onRemove={() => removeItem(item.productId, item.size, item.color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <CartSummary subtotalInCents={totalPrice} />

              <div className="mt-6 space-y-3">
                <Button variant="primary" size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Outfit Composer CTA */}
            <div className="bg-gradient-to-br from-forest-50 to-burnt-50 rounded-lg border border-forest-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-6 h-6 text-forest-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Try Our Outfit Composer
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Visualize how products look on you with AI. Drag products from anywhere on the site, upload your photos, and generate a custom outfit preview.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={openComposer}
                    className="w-full"
                  >
                    Open Outfit Composer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
