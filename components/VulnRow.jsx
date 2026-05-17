import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn, severityGlyph } from '../lib/utils';

const SEV_BAR = {
  CRITICAL: 'bg-critical',
  HIGH:     'bg-high',
  MEDIUM:   'bg-medium',
  LOW:      'bg-low',
  NONE:     'bg-divider-strong',
};

const SEV_GLYPH_COLOR = {
  CRITICAL: 'text-critical',
  HIGH:     'text-high',
  MEDIUM:   'text-ink',
  LOW:      'text-low',
  NONE:     'text-muted',
};

export function VulnRow({ vuln, onPress }) {
  const { cvss, aliases, fixedVersion } = vuln;
  const cveId = aliases.find(a => a.startsWith('CVE-')) ?? vuln.id;
  const sev = cvss.severity;
  const scoreLabel = cvss.score != null ? cvss.score.toFixed(1) : '—';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${sev} severity, score ${scoreLabel}, ${cveId}, ${vuln.summary || vuln.id}`}
      className="flex-row items-stretch border-b border-divider hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
    >
      <View className={cn('w-2', SEV_BAR[sev])} />

      <View className="flex-1 px-3 py-3 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text
            className={cn('font-mono-bold text-sm', SEV_GLYPH_COLOR[sev])}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {severityGlyph(sev)}
          </Text>
          <Text className={cn('font-mono-bold text-[10px] tracking-widest tabular-nums', SEV_GLYPH_COLOR[sev])}>
            {sev}
          </Text>
          <Text className="font-mono text-[10px] text-muted tabular-nums">
            {scoreLabel}
          </Text>
          <View className="w-px h-3 bg-divider mx-1" />
          <Text className="font-mono-bold text-xs text-ink shrink-0" numberOfLines={1}>
            {cveId}
          </Text>
        </View>
        <Text className="font-mono text-xs text-muted mt-1" numberOfLines={2}>
          {vuln.summary || vuln.id}
        </Text>
        {vuln._pkg && (
          <Text className="font-mono text-[10px] text-muted mt-1" numberOfLines={1}>
            {vuln._pkg}
          </Text>
        )}
      </View>

      <View className="flex-row items-center pr-3 gap-2 shrink-0">
        {fixedVersion ? (
          <View className="border border-ink px-1.5 py-0.5">
            <Text className="font-mono text-[10px] text-ink tabular-nums">→ {fixedVersion}</Text>
          </View>
        ) : (
          <Text className="font-mono text-[10px] text-muted">no fix</Text>
        )}
        <Text className="font-mono text-xs text-muted">›</Text>
      </View>
    </Pressable>
  );
}
