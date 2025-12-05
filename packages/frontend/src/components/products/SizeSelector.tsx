import { cn } from '../../lib/utils';

export interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onChange: (size: string) => void;
}

export function SizeSelector({ sizes, selected, onChange }: SizeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Size
      </label>
      <div className="grid grid-cols-4 gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md border transition-colors',
              selected === size
                ? 'border-forest-700 bg-forest-50 text-forest-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
