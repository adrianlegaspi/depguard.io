import * as React from 'react';
import { View, Text } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn, severityGlyph } from '../lib/utils';

const sevVariants = cva(
  'flex-row items-center border',
  {
    variants: {
      severity: {
        CRITICAL: 'bg-critical border-critical',
        HIGH:     'bg-high border-high',
        MEDIUM:   'bg-medium border-medium',
        LOW:      'bg-low border-low',
        NONE:     'bg-paper border-divider-strong',
      },
      size: {
        sm: 'px-2 py-0.5 gap-1',
        md: 'px-3 py-1 gap-1.5',
      },
    },
    defaultVariants: { severity: 'NONE', size: 'sm' },
  }
);

const sevTextVariants = cva('font-mono-bold uppercase tracking-widest tabular-nums', {
  variants: {
    severity: {
      CRITICAL: 'text-paper',
      HIGH:     'text-paper',
      MEDIUM:   'text-ink',
      LOW:      'text-paper',
      NONE:     'text-muted',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
    },
  },
  defaultVariants: { severity: 'NONE', size: 'sm' },
});

/**
 * @param {{
 *   severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'NONE',
 *   score?: number|null,
 *   size?: 'sm'|'md',
 *   showGlyph?: boolean,
 *   className?: string,
 * }} props
 */
export function SevBadge({ severity, score, size, showGlyph = true, className }) {
  return (
    <View className={cn(sevVariants({ severity, size }), className)}>
      {showGlyph && (
        <Text className={sevTextVariants({ severity, size })} accessibilityElementsHidden importantForAccessibility="no">
          {severityGlyph(severity)}
        </Text>
      )}
      <Text className={sevTextVariants({ severity, size })}>
        {severity}{score != null ? ` ${score.toFixed(1)}` : ''}
      </Text>
    </View>
  );
}
