import * as React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { usePackageHealth } from '../hooks/usePackageHealth';
import { osvEcosystemToDepsDev } from '../services/depsDev';
import { cn, scorecardGrade, scorecardGradeColor, fmtRelativeTime } from '../lib/utils';

const SCORE_COLOR = {
  success:  '#00C853',
  low:      '#2563EB',
  high:     '#FF6A00',
  critical: '#FF1F1F',
  muted:    'rgba(0,0,0,0.30)',
};

function ScoreBar({ score10, color }) {
  const pct = Math.max(0, Math.min(1, (score10 ?? 0) / 10));
  return (
    <View className="h-1 w-full bg-divider mt-1.5">
      <View
        className="h-full"
        style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: SCORE_COLOR[color] ?? SCORE_COLOR.muted }}
      />
    </View>
  );
}

function CheckRow({ check }) {
  const grade = scorecardGrade(check.score);
  const colorKey = scorecardGradeColor(grade);
  return (
    <View className="flex-row items-start py-1.5 border-b border-divider">
      <View className="w-24 shrink-0">
        <Text className="font-mono text-[10px] text-ink" numberOfLines={1}>{check.name}</Text>
      </View>
      <View className="flex-1 px-2">
        <Text className="font-mono text-[10px] text-muted" numberOfLines={2}>{check.reason}</Text>
      </View>
      <Text
        className="font-mono-bold text-[10px] tabular-nums"
        style={{ color: SCORE_COLOR[colorKey] ?? SCORE_COLOR.muted, minWidth: 24, textAlign: 'right' }}
      >
        {check.score >= 0 ? `${check.score}/10` : 'N/A'}
      </Text>
    </View>
  );
}

function SkeletonHealth() {
  return (
    <View className="border-b-2 border-ink">
      <View className="flex-row items-center justify-between px-4 lg:px-6 py-3 border-b border-divider">
        <View className="h-2.5 w-28 bg-divider" />
        <View className="h-2 w-14 bg-divider" />
      </View>
      <View className="px-4 lg:px-6 py-4 gap-2">
        <View className="h-8 w-20 bg-divider" />
        <View className="h-1 w-full bg-divider" />
        <View className="h-2 w-48 bg-divider mt-2" />
        <View className="h-2 w-36 bg-divider" />
      </View>
    </View>
  );
}

/**
 * Package health card powered by deps.dev.
 *
 * variant="full"    — sidebar card with score, metadata, expandable checks
 * variant="compact" — single-line strip for the detail page
 */
export function PackageHealth({ name, version, ecosystem, variant = 'full' }) {
  const supported = !!osvEcosystemToDepsDev(ecosystem);
  const { data: health, isLoading } = usePackageHealth({ name, version, ecosystem });
  const [expanded, setExpanded] = React.useState(false);

  if (!supported) {
    if (variant === 'compact') return null;
    return (
      <View className="px-4 lg:px-6 py-3 border-b border-divider">
        <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
          Health data unavailable for {ecosystem}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    if (variant === 'compact') return (
      <View className="px-4 lg:px-6 py-2 border-b border-divider flex-row gap-2">
        <View className="h-2 w-16 bg-divider" />
        <View className="h-2 w-32 bg-divider" />
      </View>
    );
    return <SkeletonHealth />;
  }

  if (!health) {
    if (variant === 'compact') return null;
    return (
      <View className="px-4 lg:px-6 py-3 border-b border-divider">
        <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
          Health data unavailable
        </Text>
      </View>
    );
  }

  const { license, publishedAt, repoUrl, isLatest, latestVersion, scorecard } = health;
  const score = scorecard?.score ?? null;
  const grade = scorecardGrade(score);
  const colorKey = scorecardGradeColor(grade);

  // ── Compact variant (detail page strip) ───────────────────────────────────
  if (variant === 'compact') {
    const parts = [];
    if (score != null) parts.push(`Score ${score.toFixed(1)}`);
    if (grade !== '—') parts.push(grade);
    if (license) parts.push(license);
    if (publishedAt) parts.push(fmtRelativeTime(publishedAt));
    if (!isLatest && latestVersion) parts.push(`Latest: ${latestVersion}`);

    return (
      <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 px-4 lg:px-6 py-2.5 border-b-2 border-ink bg-paper">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          Health
        </Text>
        {score != null && (
          <Text
            className="font-mono-bold text-xs tabular-nums"
            style={{ color: SCORE_COLOR[colorKey] ?? SCORE_COLOR.muted }}
          >
            {score.toFixed(1)}/10 {grade}
          </Text>
        )}
        {license ? (
          <View className="border border-ink px-1.5 py-0.5">
            <Text className="font-mono text-[10px] text-ink">{license}</Text>
          </View>
        ) : null}
        {publishedAt ? (
          <Text className="font-mono text-[10px] text-muted">{fmtRelativeTime(publishedAt)}</Text>
        ) : null}
        {!isLatest && latestVersion ? (
          <Text className="font-mono text-[10px] text-high">↑ {latestVersion}</Text>
        ) : null}
        {repoUrl ? (
          <Pressable
            onPress={() => Linking.openURL(repoUrl).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel="Open repository"
            className="web:cursor-pointer"
          >
            <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-widest">
              Repo ↗
            </Text>
          </Pressable>
        ) : null}
        <Text className="font-mono text-[10px] text-muted ml-auto">deps.dev</Text>
      </View>
    );
  }

  // ── Full variant (results sidebar) ────────────────────────────────────────
  return (
    <View className="border-b-2 border-ink">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 lg:px-6 py-2.5 border-b border-divider">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          Package Health
        </Text>
        <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
          deps.dev
        </Text>
      </View>

      {/* Score */}
      <View className="flex-row items-end gap-3 px-4 lg:px-6 pt-4 pb-3 border-b border-divider">
        <View className="flex-1">
          <View className="flex-row items-baseline gap-2">
            {score != null ? (
              <>
                <Text
                  className="font-display text-3xl tabular-nums"
                  style={{ color: SCORE_COLOR[colorKey] ?? SCORE_COLOR.muted }}
                >
                  {score.toFixed(1)}
                </Text>
                <Text className="font-mono text-xs text-muted">/ 10</Text>
              </>
            ) : (
              <Text className="font-display text-3xl text-muted">—</Text>
            )}
            <View
              className="px-1.5 py-0.5"
              style={{ backgroundColor: SCORE_COLOR[colorKey] ?? SCORE_COLOR.muted }}
              accessibilityLabel={`Scorecard grade ${grade}`}
            >
              <Text className="font-mono-bold text-xs text-paper">{grade}</Text>
            </View>
          </View>
          <ScoreBar score10={score ?? 0} color={colorKey} />
          <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
            OpenSSF Scorecard
          </Text>
        </View>
      </View>

      {/* Metadata */}
      <View className="px-4 lg:px-6 py-3 gap-1.5 border-b border-divider">
        <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1">
          {license ? (
            <View className="border border-ink px-1.5 py-0.5">
              <Text className="font-mono-bold text-[10px] text-ink">{license}</Text>
            </View>
          ) : (
            <Text className="font-mono text-[10px] text-muted">No license</Text>
          )}
          {publishedAt ? (
            <Text className="font-mono text-[10px] text-muted">
              Published {fmtRelativeTime(publishedAt)}
            </Text>
          ) : null}
        </View>
        {!isLatest && latestVersion ? (
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Text className="font-mono text-[10px] text-high">↑</Text>
            <Text className="font-mono text-[10px] text-high">
              Latest: {latestVersion} available
            </Text>
          </View>
        ) : isLatest ? (
          <Text className="font-mono text-[10px] text-success">✓ Latest stable version</Text>
        ) : null}
      </View>

      {/* Repo link */}
      {repoUrl ? (
        <Pressable
          onPress={() => Linking.openURL(repoUrl).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel="Open source repository"
          className="flex-row items-center justify-between px-4 lg:px-6 py-2.5 border-b border-divider hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
        >
          <Text className="font-mono text-xs text-muted" numberOfLines={1} style={{ flex: 1 }}>
            {repoUrl.replace(/^https?:\/\//, '')}
          </Text>
          <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-widest ml-3">↗</Text>
        </Pressable>
      ) : null}

      {/* Scorecard details (expandable) */}
      {scorecard?.checks?.length > 0 ? (
        <>
          <Pressable
            onPress={() => setExpanded(e => !e)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Collapse scorecard details' : 'Expand scorecard details'}
            className="flex-row items-center justify-between px-4 lg:px-6 py-2.5 hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
          >
            <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
              {expanded ? '▼' : '▶'} Scorecard checks
            </Text>
            <Text className="font-mono text-[10px] text-muted tabular-nums">
              {scorecard.checks.length}
            </Text>
          </Pressable>
          {expanded ? (
            <View className="px-4 lg:px-6 pb-3">
              {scorecard.checks.map((c, i) => <CheckRow key={i} check={c} />)}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
