import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'category' | 'price' | 'stock';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-forest-100 text-forest-800': variant === 'category',
          'bg-burnt-100 text-burnt-800': variant === 'price',
          'bg-blue-100 text-blue-800': variant === 'stock',
        },
        className
      )}
      {...props}
    />
  );
}
