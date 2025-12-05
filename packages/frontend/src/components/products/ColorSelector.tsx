import { cn } from '../../lib/utils';

export interface ColorSelectorProps {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
}

const colorMap: Record<string, string> = {
  'Forest Green': 'bg-green-700',
  'Slate Blue': 'bg-blue-600',
  'Burnt Orange': 'bg-orange-600',
  'Stone Gray': 'bg-gray-500',
  'Deep Navy': 'bg-blue-900',
  'Black': 'bg-black',
  'Charcoal': 'bg-gray-700',
  'White': 'bg-white',
  'Tan': 'bg-yellow-700',
  'Olive': 'bg-green-800',
};

export function ColorSelector({ colors, selected, onChange }: ColorSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Color
      </label>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={cn(
                'h-10 w-10 rounded-full border-2 transition-all',
                colorMap[color] || 'bg-gray-400',
                selected === color
                  ? 'border-forest-700 ring-2 ring-forest-700 ring-offset-2'
                  : 'border-gray-300 group-hover:border-gray-400',
                color === 'White' && 'border-gray-400'
              )}
            />
            <span className="text-xs text-gray-600">{color}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
