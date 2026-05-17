import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function Card({ className, children }) {
  return (
    <View className={cn('border-2 border-ink bg-paper', className)}>
      {children}
    </View>
  );
}

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function CardHeader({ className, children }) {
  return (
    <View className={cn('border-b-2 border-ink px-4 py-3', className)}>
      {children}
    </View>
  );
}

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function CardContent({ className, children }) {
  return (
    <View className={cn('px-4 py-3', className)}>
      {children}
    </View>
  );
}

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function CardFooter({ className, children }) {
  return (
    <View className={cn('border-t-2 border-ink px-4 py-3', className)}>
      {children}
    </View>
  );
}

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function CardTitle({ className, children }) {
  return (
    <Text className={cn('font-display text-lg text-ink', className)}>
      {children}
    </Text>
  );
}
