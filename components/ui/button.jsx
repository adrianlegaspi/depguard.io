import * as React from 'react';
import { Pressable, Text, Platform } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center border-2 border-ink transition-transform',
  {
    variants: {
      variant: {
        default:     'bg-ink hover:bg-ink/90 active:bg-ink/80',
        outline:     'bg-paper hover:bg-ink/5 active:bg-ink/10',
        ghost:       'bg-transparent border-transparent hover:bg-ink/5 active:bg-ink/10',
        destructive: 'bg-critical border-critical hover:bg-critical/90 active:bg-critical/80',
      },
      size: {
        default: 'px-6 py-3',
        sm:      'px-4 py-2',
        lg:      'px-8 py-4',
        icon:    'p-2',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const buttonTextVariants = cva('font-mono-bold text-sm uppercase tracking-widest', {
  variants: {
    variant: {
      default:     'text-paper',
      outline:     'text-ink',
      ghost:       'text-ink',
      destructive: 'text-paper',
    },
  },
  defaultVariants: { variant: 'default' },
});

/**
 * @param {{
 *   variant?: 'default'|'outline'|'ghost'|'destructive',
 *   size?: 'default'|'sm'|'lg'|'icon',
 *   className?: string,
 *   textClassName?: string,
 *   disabled?: boolean,
 *   onPress?: () => void,
 *   accessibilityLabel?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function Button({ variant, size, className, textClassName, disabled, onPress, accessibilityLabel, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => Platform.OS !== 'web' && pressed ? { transform: [{ translateY: 1 }] } : null}
      className={cn(
        buttonVariants({ variant, size }),
        'web:active:translate-y-px web:cursor-pointer',
        disabled && 'opacity-40 web:cursor-not-allowed',
        className
      )}
    >
      {typeof children === 'string' ? (
        <Text className={cn(buttonTextVariants({ variant }), textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
