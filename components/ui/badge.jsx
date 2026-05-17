import * as React from 'react';
import { View, Text } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'flex-row items-center border',
  {
    variants: {
      variant: {
        default:     'border-ink bg-paper',
        filled:      'border-ink bg-ink',
        critical:    'border-critical bg-critical',
        high:        'border-high bg-high',
        medium:      'border-medium bg-medium',
        low:         'border-low bg-low',
        success:     'border-success bg-success',
        outline:     'border-ink bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5',
        md: 'px-3 py-1',
      },
    },
    defaultVariants: { variant: 'default', size: 'sm' },
  }
);

const badgeTextVariants = cva('font-mono-bold uppercase tracking-widest tabular-nums', {
  variants: {
    variant: {
      default:  'text-ink',
      filled:   'text-paper',
      critical: 'text-paper',
      high:     'text-paper',
      medium:   'text-ink',
      low:      'text-paper',
      success:  'text-paper',
      outline:  'text-ink',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
    },
  },
  defaultVariants: { variant: 'default', size: 'sm' },
});

/**
 * @param {{
 *   variant?: 'default'|'filled'|'critical'|'high'|'medium'|'low'|'success'|'outline',
 *   size?: 'sm'|'md',
 *   className?: string,
 *   textClassName?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function Badge({ variant, size, className, textClassName, children }) {
  return (
    <View className={cn(badgeVariants({ variant, size }), className)}>
      <Text className={cn(badgeTextVariants({ variant, size }), textClassName)}>{children}</Text>
    </View>
  );
}
