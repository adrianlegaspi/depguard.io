import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ShieldCheck, Lightbulb, AlertTriangle, RotateCw } from 'lucide-react-native';
import { MarkdownBody } from './MarkdownBody';
import { useVulnRecommendations } from '../hooks/useVulnRecommendations';
import { cn } from '../lib/utils';

const SUBSECTIONS = [
  { key: 'prevention',     Icon: ShieldCheck,   label: 'HOW TO PREVENT',     number: '01' },
  { key: 'considerations', Icon: Lightbulb,     label: 'WHAT TO CONSIDER',   number: '02' },
  { key: 'remediation',    Icon: AlertTriangle, label: "IF YOU'RE AFFECTED", number: '03' },
];

function remediationBarColor(severity) {
  switch (severity) {
    case 'CRITICAL': return 'bg-critical';
    case 'HIGH':     return 'bg-high';
    case 'MEDIUM':   return 'bg-medium';
    case 'LOW':      return 'bg-low';
    default:         return 'bg-ink';
  }
}

function SkeletonBar({ width = 'w-full' }) {
  return <View className={`bg-ink/10 h-3 ${width} mb-2`} />;
}

function SectionRow({ Icon, label, number, barColor, children }) {
  return (
    <View className="flex-row items-stretch border-t border-divider">
      <View className={cn('w-2', barColor)} />
      <View className="flex-1 px-4 lg:px-6 py-3">
        <View className="flex-row items-center gap-2 mb-2">
          <Icon size={14} color="#0a0a0a" strokeWidth={1.75} />
          <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow tabular-nums">
            {number}
          </Text>
          <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
            {label}
          </Text>
        </View>
        {children}
      </View>
    </View>
  );
}

function SubsectionSkeleton({ Icon, label, number, barColor }) {
  return (
    <SectionRow Icon={Icon} label={label} number={number} barColor={barColor}>
      <SkeletonBar />
      <SkeletonBar width="w-11/12" />
      <SkeletonBar width="w-4/5" />
    </SectionRow>
  );
}

function Subsection({ Icon, label, number, barColor, body }) {
  return (
    <SectionRow Icon={Icon} label={label} number={number} barColor={barColor}>
      <MarkdownBody>{body}</MarkdownBody>
    </SectionRow>
  );
}

/**
 * @param {{
 *   vuln: import('../services/osv').NormalizedVuln,
 *   packageInfo: { name: string, ecosystem: string }
 * }} props
 */
export function VulnRecommendations({ vuln, packageInfo }) {
  const { data, error, isLoading, mutate } = useVulnRecommendations(vuln, packageInfo);
  const urgentBar = remediationBarColor(vuln?.cvss?.severity);

  const barFor = (key) => (key === 'remediation' ? urgentBar : 'bg-divider');

  return (
    <View className="border-t-2 border-ink">
      <View className="px-4 lg:px-6 py-3">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          Remediation Playbook
        </Text>
      </View>

      {isLoading && !data && SUBSECTIONS.map(s => (
        <SubsectionSkeleton
          key={s.key}
          Icon={s.Icon}
          label={s.label}
          number={s.number}
          barColor={barFor(s.key)}
        />
      ))}

      {error && !data && (
        <View className="px-4 lg:px-6 py-4 border-t border-divider">
          <Text className="font-mono-bold text-[10px] text-critical uppercase tracking-eyebrow mb-2">
            Could not generate recommendations
          </Text>
          <Text className="font-mono text-xs text-muted mb-3" numberOfLines={2}>
            {String(error?.message ?? error)}
          </Text>
          <Pressable
            onPress={() => mutate()}
            accessibilityRole="button"
            className="self-start flex-row items-center gap-2 border-2 border-ink px-3 py-1 web:cursor-pointer hover:bg-ink/5 active:bg-ink/10"
          >
            <Text className="font-mono-bold text-xs text-ink uppercase tracking-widest">
              RETRY
            </Text>
            <RotateCw size={12} color="#0a0a0a" strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {data && SUBSECTIONS.map(s => (
        <Subsection
          key={s.key}
          Icon={s.Icon}
          label={s.label}
          number={s.number}
          barColor={barFor(s.key)}
          body={data[s.key]}
        />
      ))}

      {data && (
        <View className="px-4 lg:px-6 py-2 border-t border-divider">
          <Text className="font-mono text-[10px] text-muted">
            Synthesized from public advisories — verify in production.
          </Text>
        </View>
      )}
    </View>
  );
}
