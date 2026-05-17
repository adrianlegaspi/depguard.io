import * as React from 'react';
import { View, Text } from 'react-native';
import { CVSS_METRIC_ORDER, cvssMetricLabel } from '../lib/cvss';
import { cn } from '../lib/utils';

/**
 * CVSS metric breakdown: 2 cols on mobile, 4 cols on desktop.
 * Right-borders are intentionally clipped by parent overflow so the layout
 * works for any column count without per-cell index math.
 *
 * @param {{
 *   parts: Record<string, string>,
 *   className?: string,
 * }} props
 */
export function CvssVector({ parts, className }) {
  if (!parts || Object.keys(parts).length === 0) return null;

  const cells = CVSS_METRIC_ORDER
    .map(key => ({ key, val: parts[key] }))
    .filter(c => c.val);

  return (
    <View className={cn('border-t-2 border-ink', className)}>
      <View className="px-4 pt-3 pb-1">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          CVSS vector
        </Text>
      </View>
      <View className="flex-row flex-wrap overflow-hidden">
        {cells.map(({ key, val }) => {
          const { metricLabel, valueLabel } = cvssMetricLabel(key, val);
          return (
            <View
              key={key}
              className="w-1/2 lg:w-1/4 border-r-2 border-b-2 border-ink px-3 py-2"
            >
              <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mb-1">
                {metricLabel}
              </Text>
              <Text className="font-mono-bold text-xs text-ink" numberOfLines={2}>
                {valueLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
