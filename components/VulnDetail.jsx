import * as React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { SevBadge } from './SevBadge';
import { CvssVector } from './CvssVector';
import { EpssBar } from './EpssBar';
import { MarkdownBody } from './MarkdownBody';
import { VulnRecommendations } from './VulnRecommendations';
import { Badge } from './ui/badge';
import { parseCvss } from '../lib/cvss';
import { cn, severityGlyph } from '../lib/utils';

const SEV_TEXT = {
  CRITICAL: 'text-critical',
  HIGH:     'text-high',
  MEDIUM:   'text-ink',
  LOW:      'text-low',
  NONE:     'text-muted',
};

function fmtIsoDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dy = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  } catch {
    return iso;
  }
}

function MetaCell({ label, value, last, tone, mono }) {
  return (
    <View className={cn('flex-1 px-3 py-2', !last && 'border-r border-divider')}>
      <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow mb-1">
        {label}
      </Text>
      <Text
        className={cn(
          'leading-tight',
          mono ? 'font-mono-bold text-sm tabular-nums' : 'font-display text-base',
          tone ?? 'text-ink'
        )}
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

function cleanDetailsMarkdown(details) {
  if (!details) return null;
  // Remove the internal separator line that shouldn't be displayed to users
  return details
    .split('\n')
    .filter(line => !line.includes('Per source details'))
    .join('\n')
    .trim();
}

export function VulnDetail({ vuln, packageInfo }) {
  const { cvss, cwes, aliases, fixedVersion } = vuln;
  const cveId = aliases.find(a => a.startsWith('CVE-')) ?? vuln.id;
  const parsed = parseCvss(cvss.vector, cvss.score);
  const metas = [
    { label: 'Severity',  value: cvss.severity, tone: SEV_TEXT[cvss.severity] },
    { label: 'Published', value: fmtIsoDate(vuln.published), mono: true },
    { label: 'Fixed In',  value: fixedVersion ?? 'N/A', mono: true },
    ...(cwes.length > 0 ? [{ label: 'CWE', value: cwes[0], mono: true }] : []),
  ];
  const headerOnDark = cvss.severity !== 'MEDIUM' && cvss.severity !== 'NONE';
  const cleanedDetails = cleanDetailsMarkdown(vuln.details);

  const osvButton = (
    <Pressable
      className="items-center py-3 web:cursor-pointer hover:bg-ink/5 active:bg-ink/10"
      onPress={() => Linking.openURL(`https://osv.dev/vulnerability/${vuln.id}`)}
      accessibilityRole="link"
      accessibilityLabel={`View ${vuln.id} on OSV.dev`}
    >
      <Text className="font-mono-bold text-xs text-ink uppercase tracking-widest">
        VIEW ON OSV ↗
      </Text>
    </Pressable>
  );

  return (
    <View className="bg-paper">
      <View
        className={cn(
          'flex-row items-center justify-between px-4 lg:px-6 py-3 border-b-2 border-ink',
          cvss.severity === 'CRITICAL' && 'bg-critical',
          cvss.severity === 'HIGH'     && 'bg-high',
          cvss.severity === 'MEDIUM'   && 'bg-medium',
          cvss.severity === 'LOW'      && 'bg-low',
          cvss.severity === 'NONE'     && 'bg-paper',
        )}
      >
        <View className="flex-row items-center gap-2 flex-1 min-w-0">
          <Text
            className={cn(
              'font-mono-bold text-base',
              headerOnDark ? 'text-paper' : 'text-ink'
            )}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {severityGlyph(cvss.severity)}
          </Text>
          <Text
            className={cn(
              'font-mono-bold text-sm uppercase tabular-nums',
              headerOnDark ? 'text-paper' : 'text-ink'
            )}
            numberOfLines={1}
          >
            {cveId}
          </Text>
          {cvss.score != null && (
            <Text className={cn(
              'font-mono text-xs tabular-nums',
              headerOnDark ? 'text-paper' : 'text-ink'
            )}>
              CVSS {cvss.score.toFixed(1)}
            </Text>
          )}
        </View>
        <SevBadge severity={cvss.severity} />
      </View>

      <View className="lg:flex-row lg:items-stretch">
        <View className="lg:flex-1 lg:border-r-2 lg:border-ink">
          {aliases.length > 0 && (
            <View className="flex-row flex-wrap gap-1 px-4 lg:px-6 py-2 border-b border-divider">
              {aliases.map(a => (
                <Badge key={a} variant="outline">
                  <Text className="font-mono text-xs text-muted">{a}</Text>
                </Badge>
              ))}
            </View>
          )}

          <View className="px-4 lg:px-6 pt-3 pb-3">
            <Text className="font-display text-xl lg:text-2xl text-ink leading-tight">{vuln.summary}</Text>
          </View>

          <View className="flex-row border-t-2 border-b-2 border-ink bg-paper">
            {metas.map((m, i) => (
              <MetaCell
                key={m.label}
                label={m.label}
                value={m.value}
                tone={m.tone}
                mono={m.mono}
                last={i === metas.length - 1}
              />
            ))}
          </View>

          {vuln.epss != null && (vuln.epss.percentile != null || vuln.epss.probability != null) && (
            <View className="px-4 lg:px-6 pt-3 pb-3 border-b border-divider">
              <EpssBar epss={vuln.epss} />
            </View>
          )}

          {parsed.parts && Object.keys(parsed.parts).length > 0 && (
            <CvssVector parts={parsed.parts} />
          )}

          {cleanedDetails ? (
            <View className="px-4 lg:px-6 py-3 border-t border-divider">
              <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mb-2">Summary</Text>
              <MarkdownBody>{cleanedDetails}</MarkdownBody>
            </View>
          ) : null}

          {vuln.references.length > 0 && (
            <View className="px-4 lg:px-6 py-3 border-t border-divider">
              <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mb-2">References</Text>
              {vuln.references.slice(0, 6).map((ref, i) => (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(ref.url)}
                  accessibilityRole="link"
                  className="mb-1 web:cursor-pointer"
                >
                  <Text className="font-mono text-xs text-low underline" numberOfLines={1}>
                    [{ref.type}] {ref.url}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View className="hidden lg:flex border-t-2 border-ink">
            {osvButton}
          </View>
        </View>

        <View className="lg:w-[380px] xl:w-[420px] lg:self-start web:lg:sticky web:lg:top-0 web:lg:max-h-screen web:lg:overflow-y-auto">
          <VulnRecommendations vuln={vuln} packageInfo={packageInfo} />
          <View className="lg:hidden border-t-2 border-ink">
            {osvButton}
          </View>
        </View>
      </View>
    </View>
  );
}
