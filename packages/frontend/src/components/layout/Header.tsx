import { useEffect, useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getProductSuggestions } from '../../api/products';
import type { Product } from '@summit-gear/shared';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Prevent body scroll when search is expanded
  useEffect(() => {
    if (isSearchExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchExpanded]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const results = await getProductSuggestions(query, 10);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

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
    setShowSuggestions(false);
    setIsSearchExpanded(false);
  };

  const selectSuggestion = (product: Product) => {
    setSearchTerm(product.name);
    setShowSuggestions(false);
    setIsSearchExpanded(false);
    navigate(`/products/${product.id}`);
  };

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchCollapse = () => {
    setIsSearchExpanded(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape to collapse search
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showSuggestions) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (isSearchExpanded) {
        handleSearchCollapse();
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSearch(event as unknown as FormEvent);
        }
        break;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isSearchExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={handleSearchCollapse}
          aria-hidden="true"
        />
      )}

      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-white font-bold text-lg">
                SG
              </div>
              <span className="text-xl font-bold text-gray-900">Summit Gear Co.</span>
            </Link>

            {/* Navigation */}
            <nav
              className={`hidden md:flex items-center space-x-6 transition-opacity ${
                isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
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
            <div className={`flex items-center space-x-4 transition-all ${
              isSearchExpanded ? 'absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4' : ''
            }`}>
              <div
                ref={searchContainerRef}
                className={`relative transition-all ${
                  isSearchExpanded
                    ? 'flex-1 w-full'
                    : 'w-32 sm:w-48 md:w-56 lg:w-64'
                }`}
              >
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search by name or color..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleSearchFocus}
                    aria-label="Search products by name or color"
                    className="w-full"
                    autoComplete="off"
                  />
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                    {isLoadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                    ) : suggestions.length > 0 ? (
                      <ul className="py-1">
                        {suggestions.map((product, index) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() => selectSuggestion(product)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                                index === selectedIndex ? 'bg-gray-100' : ''
                              }`}
                            >
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ${(product.priceInCents / 100).toFixed(2)}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                    )}
                  </div>
                )}
              </div>
              <Link
                to="/cart"
                className={`transition-opacity ${
                  isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
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
    </>
  );
}
