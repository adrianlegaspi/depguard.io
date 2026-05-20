import * as React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { ShieldCheck, Lightbulb, AlertTriangle, RotateCw } from 'lucide-react-native';
import { MarkdownBody } from './MarkdownBody';
import { useVulnRecommendations } from '../hooks/useVulnRecommendations';
import { cn } from '../lib/utils';

const SUBSECTIONS = [
  { key: 'prevention',     Icon: ShieldCheck,   label: 'HOW TO PREVENT',     number: '01' },
  { key: 'considerations', Icon: Lightbulb,     label: 'WHAT TO CONSIDER',   number: '02' },
  { key: 'remediation',    Icon: AlertTriangle, label: "IF YOU'RE AFFECTED", number: '03' },
];

const DESKTOP_BREAKPOINT = 1024;

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

function HeaderInner({ Icon, label, number, collapsible, expanded }) {
  return (
    <View className="flex-row items-center gap-2">
      {collapsible ? (
        <Text className="font-mono-bold text-[10px] text-ink leading-none w-3 tabular-nums">
          {expanded ? '▼' : '▶'}
        </Text>
      ) : null}
      <Icon size={14} color="#0a0a0a" strokeWidth={1.75} />
      <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow tabular-nums">
        {number}
      </Text>
      <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
        {label}
      </Text>
    </View>
  );
}

function SectionRow({ Icon, label, number, barColor, collapsible, expanded, onToggle, children }) {
  const header = (
    <HeaderInner
      Icon={Icon}
      label={label}
      number={number}
      collapsible={collapsible}
      expanded={expanded}
    />
  );
  return (
    <View className="flex-row items-stretch border-t border-divider">
      <View className={cn('w-2', barColor)} />
      <View className="flex-1">
        {collapsible ? (
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: !!expanded }}
            accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
            className="px-4 lg:px-6 py-3 hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
          >
            {header}
            {expanded ? <View className="mt-2">{children}</View> : null}
          </Pressable>
        ) : (
          <View className="px-4 lg:px-6 py-3">
            {header}
            <View className="mt-2">{children}</View>
          </View>
        )}
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

/**
 * @param {{
 *   vuln: import('../services/osv').NormalizedVuln,
 *   packageInfo: { name: string, ecosystem: string }
 * }} props
 */
export function VulnRecommendations({ vuln, packageInfo }) {
  const { data, error, isLoading, isValidating, mutate } = useVulnRecommendations(vuln, packageInfo);
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const urgentBar = remediationBarColor(vuln?.cvss?.severity);

  const [expanded, setExpanded] = React.useState({
    prevention: false,
    considerations: false,
    remediation: true,
  });
  const toggle = React.useCallback((key) => {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  }, []);

  const barFor = (key) => (key === 'remediation' ? urgentBar : 'bg-divider');

  const showSkeleton = (isLoading || isValidating) && !data;
  const showError = !!error && !data && !isValidating;

  return (
    <View className="border-t-2 border-ink lg:border-t-0">
      <View className="px-4 lg:px-6 py-3">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          Remediation Playbook
        </Text>
      </View>

      {showSkeleton && SUBSECTIONS.map(s => (
        <SubsectionSkeleton
          key={s.key}
          Icon={s.Icon}
          label={s.label}
          number={s.number}
          barColor={barFor(s.key)}
        />
      ))}

      {showError && (
        <View className="px-4 lg:px-6 py-4 border-t border-divider">
          <Text className="font-mono-bold text-[10px] text-critical uppercase tracking-eyebrow mb-2">
            Could not generate recommendations
          </Text>
          <Text className="font-mono text-xs text-muted mb-3" numberOfLines={2}>
            {String(error?.message ?? error)}
          </Text>
          <Pressable
            onPress={() => mutate()}
            disabled={isValidating}
            accessibilityRole="button"
            className={cn(
              'self-start flex-row items-center gap-2 border-2 border-ink px-3 py-1 web:cursor-pointer hover:bg-ink/5 active:bg-ink/10',
              isValidating && 'opacity-50'
            )}
          >
            <Text className="font-mono-bold text-xs text-ink uppercase tracking-widest">
              RETRY
            </Text>
            <RotateCw size={12} color="#0a0a0a" strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {data && SUBSECTIONS.map(s => (
        <SectionRow
          key={s.key}
          Icon={s.Icon}
          label={s.label}
          number={s.number}
          barColor={barFor(s.key)}
          collapsible={!isDesktop}
          expanded={isDesktop ? true : expanded[s.key]}
          onToggle={() => toggle(s.key)}
        >
          <MarkdownBody>{data[s.key]}</MarkdownBody>
        </SectionRow>
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
