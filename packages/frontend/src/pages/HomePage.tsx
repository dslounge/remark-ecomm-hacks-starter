import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductGrid } from '../components/products/ProductGrid';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function HomePage() {
  const { data: productsResponse, isLoading } = useProducts({}, 1, 8);
  const { data: categoriesResponse } = useCategories();

  const featuredProducts = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-br from-forest-50 to-forest-100 rounded-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Gear Up for Your Next Adventure
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Premium outdoor equipment for camping, hiking, climbing, and more.
          Quality gear that keeps you safe and comfortable in the wild.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/products">
            <Button variant="primary" size="lg">
              Shop All Products
            </Button>
          </Link>
          <Link to="/category/camping-hiking">
            <Button variant="outline" size="lg">
              Camping & Hiking
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <ProductGrid products={featuredProducts} loading={isLoading} />
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id} to={`/category/${category.slug}`}>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
