import { useState, useEffect } from 'react';
import type { ProductFilters as ProductFiltersType } from '@summit-gear/shared';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface ProductFiltersProps {
  filters: ProductFiltersType;
  onChange: (filters: ProductFiltersType) => void;
}

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onChange(localFilters);
  };

  const handleClear = () => {
    const cleared: ProductFiltersType = {};
    setLocalFilters(cleared);
    onChange(cleared);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.categoryId === category.id}
                onChange={(e) => {
                  setLocalFilters({
                    ...localFilters,
                    categoryId: e.target.checked ? category.id : undefined,
                  });
                }}
                className="h-4 w-4 text-forest-700 focus:ring-forest-700 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={localFilters.minPrice || ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                minPrice: e.target.value ? Number(e.target.value) * 100 : undefined,
              })
            }
            className="w-full"
          />
          <span className="text-gray-500">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={localFilters.maxPrice || ''}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                maxPrice: e.target.value ? Number(e.target.value) * 100 : undefined,
              })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Sort By</h4>
        <Select
          value={`${localFilters.sortBy || 'name'}-${localFilters.sortOrder || 'asc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-') as [
              'name' | 'price' | 'createdAt',
              'asc' | 'desc'
            ];
            setLocalFilters({
              ...localFilters,
              sortBy,
              sortOrder,
            });
          }}
        >
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="createdAt-desc">Newest First</option>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <Button variant="primary" size="md" onClick={handleApply} className="w-full">
          Apply Filters
        </Button>
        <Button variant="outline" size="md" onClick={handleClear} className="w-full">
          Clear All
        </Button>
      </div>
    </div>
  );
}
