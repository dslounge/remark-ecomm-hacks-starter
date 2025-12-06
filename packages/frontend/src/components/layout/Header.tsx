import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams);
    const trimmed = searchTerm.trim();

    if (trimmed) {
      params.set('search', trimmed);
      params.set('page', '1');
    } else {
      params.delete('search');
      params.delete('page');
    }

    const isProductListRoute =
      location.pathname.startsWith('/products') || location.pathname.startsWith('/category/');
    const targetPath = isProductListRoute ? location.pathname : '/products';
    const queryString = params.toString();

    navigate(`${targetPath}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-white font-bold text-lg">
              SG
            </div>
            <span className="text-xl font-bold text-gray-900">Summit Gear Co.</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/products"
              className="text-gray-700 hover:text-forest-700 font-medium transition-colors"
            >
              All Products
            </Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-forest-700 font-medium transition-colors">
                Categories
              </button>
              {/* Dropdown would go here in a full implementation */}
            </div>
          </nav>

          {/* Search and Cart */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden lg:block">
              <Input
                type="search"
                placeholder="Search by name or color..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search products by name or color"
                className="w-64"
              />
            </form>
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="sr-only">Cart</span>
                {/* Cart count badge will be added with cart store */}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
