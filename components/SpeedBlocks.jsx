import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../lib/utils';

const BLOCK = '█';
const EMPTY = '░';
const TOTAL = 8;

/**
 * ASCII block gauge + thin progress strip showing scan speed / cache hit.
 * @param {{
 *   durationMs?: number,
 *   cacheHit?: boolean,
 *   className?: string,
 * }} props
 */
export function SpeedBlocks({ durationMs, cacheHit, className }) {
  const ratio = cacheHit
    ? 1
    : durationMs != null
    ? 1 - Math.min(durationMs, 2000) / 2000
    : 0;

  const filled = Math.round(ratio * TOTAL);
  const blocks = Array.from({ length: TOTAL }, (_, i) =>
    i < filled ? BLOCK : EMPTY
  ).join('');

  const label = cacheHit
    ? 'CACHE HIT'
    : durationMs != null
    ? `${durationMs}ms`
    : '—';

  return (
    <View className={cn('', className)}>
      <View className="flex-row items-center gap-2">
        <Text className="font-mono text-xs text-success">{blocks}</Text>
        <Text className={cn(
          'font-mono text-xs tabular-nums',
          cacheHit ? 'text-success' : 'text-muted'
        )}>
          {label}
        </Text>
      </View>
      <View className="h-1 w-full border border-ink bg-paper mt-1">
        <View
          className="h-full bg-success"
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </View>
    </View>
  );
}
