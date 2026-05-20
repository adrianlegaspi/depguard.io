import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../lib/utils';

const THRESHOLDS = [
  { at: 20 },
  { at: 40 },
  { at: 70 },
];

function fmtPct(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtSmallPct(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  const p = v * 100;
  const digits = p < 0.01 ? 4 : p < 0.1 ? 3 : p < 1 ? 2 : 1;
  return `${p.toFixed(digits)}%`;
}

function thirtyDay(daily) {
  if (daily == null || !Number.isFinite(daily)) return null;
  return 1 - Math.pow(1 - daily, 30);
}

function fmtDateShort(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}‑${m[2]}‑${m[3]}` : iso;
}

function StatCell({ label, value, last, emphasis }) {
  return (
    <View className={cn('flex-1 pr-3', !last && 'mr-3 border-r border-divider')}>
      <Text
        className={cn(
          'font-display tabular-nums text-ink leading-none mb-1',
          emphasis ? 'text-2xl' : 'text-xl'
        )}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow">
        {label}
      </Text>
    </View>
  );
}

/**
 * EPSS exploit-probability card with three-cell stat layout and a percentile
 * threshold bar (20/40/70). Renders source + freshness in the eyebrow row.
 *
 * @param {{
 *   epss?: {
 *     percentile?: number|null,
 *     probability?: number|null,
 *     date?: string|null,
 *     source?: 'first.org'|'osv'|null,
 *   } | null,
 *   className?: string,
 * }} props
 */
export function EpssBar({ epss, className }) {
  const percentile = epss?.percentile ?? null;
  const probability = epss?.probability ?? null;
  const source = epss?.source ?? null;
  const date = epss?.date ?? null;

  if (percentile == null && probability == null) {
    return (
      <View className={cn('flex-row items-center justify-between', className)}>
        <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow">
          EPSS exploit probability
        </Text>
        <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
          No EPSS data
        </Text>
      </View>
    );
  }

  const pct = percentile != null ? Math.max(0, Math.min(100, percentile * 100)) : null;
  const barColor =
    pct == null ? 'bg-divider-strong' :
    pct >= 70 ? 'bg-critical' :
    pct >= 40 ? 'bg-high' :
    pct >= 20 ? 'bg-medium' : 'bg-low';

  const sourceLabel =
    source === 'first.org' ? 'FIRST.ORG' :
    source === 'osv' ? 'OSV.DEV' : '';
  const sourceClasses =
    source === 'first.org' ? 'text-ink' : 'text-muted italic';
  const shortDate = fmtDateShort(date);

  const thirty = thirtyDay(probability);

  return (
    <View className={className}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          EPSS exploit probability
        </Text>
        {sourceLabel ? (
          <Text className={cn('font-mono-bold text-[10px] uppercase tracking-eyebrow', sourceClasses)}>
            {sourceLabel}{shortDate ? ` · ${shortDate}` : ''}
          </Text>
        ) : null}
      </View>

      <View className="flex-row mb-3">
        <StatCell
          label="Daily"
          value={fmtSmallPct(probability)}
        />
        <StatCell
          label="Percentile"
          value={percentile != null ? fmtPct(percentile, 1) : '—'}
          emphasis
        />
        <StatCell
          label="30-Day"
          value={fmtSmallPct(thirty)}
          last
        />
      </View>

      <View className="relative h-2 w-full border border-ink bg-paper">
        {pct != null && (
          <View
            className={cn('h-full', barColor)}
            style={{ width: `${pct}%` }}
          />
        )}
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
