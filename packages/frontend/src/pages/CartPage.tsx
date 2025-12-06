import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem as CartItemType, SupportedImageMime } from '@summit-gear/shared';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { Button } from '../components/ui/Button';
import { generateOutfit } from '../api/outfits';
import { ApiClientError } from '../api/client';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeKey = (item: CartItemType) => `${item.productId}-${item.size}-${item.color}`;

  const selectedProductIds = useMemo(() => {
    const ids = new Set<number>();
    items.forEach((item) => {
      if (selected[makeKey(item)]) {
        ids.add(item.productId);
      }
    });
    return Array.from(ids);
  }, [items, selected]);

  const toggleSelect = (item: CartItemType) => {
    const key = makeKey(item);
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (setter: (file: File | null) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && !['image/png', 'image/jpeg'].includes(file.type)) {
        setError('Only PNG and JPEG images are supported.');
        return;
      }
      if (file && file.size > 10 * 1024 * 1024) {
        setError('Please choose images under 10MB.');
        return;
      }
      setError(null);
      setter(file || null);
    };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',').pop() || '' : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const handleGenerateOutfit = async () => {
    if (!faceFile || !bodyFile) {
      setError('Upload both a face photo and a full-body photo.');
      return;
    }
    if (selectedProductIds.length === 0) {
      setError('Select at least one item from your cart.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const [faceImageBase64, bodyImageBase64] = await Promise.all([
        toBase64(faceFile),
        toBase64(bodyFile),
      ]);

      const response = await generateOutfit({
        productIds: selectedProductIds,
        faceImageBase64,
        faceImageMimeType: faceFile.type as SupportedImageMime,
        bodyImageBase64,
        bodyImageMimeType: bodyFile.type as SupportedImageMime,
      });

      const { generatedImageBase64, generatedImageMimeType } = response.data;
      const dataUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`;
      setGeneratedImage(dataUrl);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.response.message);
      } else {
        setError('Failed to generate outfit. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

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
                  selectable
                  selected={!!selected[makeKey(item)]}
                  onToggleSelect={() => toggleSelect(item)}
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

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Outfit Composer</h2>
                <span className="text-sm text-gray-600">{selectedProductIds.length} selected</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pick items, upload face and full-body photos, then generate a combined outfit preview.
              </p>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Face image</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileChange(setFaceFile)}
                  className="block w-full text-sm text-gray-700"
                />

                <label className="block text-sm font-medium text-gray-700">Full body image</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileChange(setBodyFile)}
                  className="block w-full text-sm text-gray-700"
                />

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {error}
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleGenerateOutfit}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating outfit...' : 'Generate Outfit'}
                </Button>

                {generatedImage && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Generated outfit</p>
                    <img
                      src={generatedImage}
                      alt="Generated outfit"
                      className="w-full rounded-md border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
