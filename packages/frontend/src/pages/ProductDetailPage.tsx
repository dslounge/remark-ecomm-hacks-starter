import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { ProductDetail } from '../components/products/ProductDetail';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const { data: productResponse, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !productResponse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Product Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the product you're looking for.
        </p>
        <Link to="/products">
          <Button variant="primary" size="md">
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const product = productResponse.data;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center text-sm text-gray-600 hover:text-forest-700 mb-6"
      >
        <svg
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Products
      </Link>

      <ProductDetail product={product} />
    </div>
  );
}
