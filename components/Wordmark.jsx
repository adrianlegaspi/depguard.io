import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../lib/utils';

/**
 * @param {{ className?: string, size?: 'sm'|'md'|'lg' }} props
 */
export function Wordmark({ className, size = 'md' }) {
  const textSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size];
  return (
    <View className={cn('flex-row items-baseline', className)}>
      <Text className={cn('font-display text-ink', textSize)}>DEP</Text>
      <Text className={cn('font-display text-critical', textSize)}>GUARD</Text>
      <Text className={cn('font-mono text-muted text-xs ml-1 self-end mb-0.5')}>.IO</Text>
    </View>
  );
}
