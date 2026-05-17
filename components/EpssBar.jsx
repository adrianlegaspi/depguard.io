import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../lib/utils';

const THRESHOLDS = [
  { at: 20, color: 'bg-low' },
  { at: 40, color: 'bg-medium' },
  { at: 70, color: 'bg-critical' },
];

/**
 * EPSS exploit-probability progress bar with threshold ticks.
 * @param {{
 *   percentile?: string|number|null,
 *   className?: string,
 * }} props
 */
export function EpssBar({ percentile, className }) {
  const pct = percentile != null ? parseFloat(String(percentile)) * 100 : null;

  if (pct == null) return null;

  const clamped = Math.max(0, Math.min(100, pct));
  const barColor =
    clamped >= 70 ? 'bg-critical' :
    clamped >= 40 ? 'bg-high' :
    clamped >= 20 ? 'bg-medium' : 'bg-low';

  return (
    <View className={cn('', className)}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          EPSS exploit probability
        </Text>
        <Text className="font-mono-bold text-xs text-ink tabular-nums">
          {clamped.toFixed(1)}%
        </Text>
      </View>
      <View className="relative h-2 w-full border border-ink bg-paper">
        <View
          className={cn('h-full', barColor)}
          style={{ width: `${clamped}%` }}
        />
        {THRESHOLDS.map(t => (
          <View
            key={t.at}
            className="absolute top-0 bottom-0 w-px bg-ink/40"
            style={{ left: `${t.at}%` }}
            pointerEvents="none"
          />
        ))}
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="font-mono text-[10px] text-muted tabular-nums">0</Text>
        <Text className="font-mono text-[10px] text-muted tabular-nums">20</Text>
        <Text className="font-mono text-[10px] text-muted tabular-nums">40</Text>
        <Text className="font-mono text-[10px] text-muted tabular-nums">70</Text>
        <Text className="font-mono text-[10px] text-muted tabular-nums">100</Text>
      </View>
    </View>
  );
}
