import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  SectionList,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wordmark } from '../../components/Wordmark';
import { VulnRow } from '../../components/VulnRow';
import { RecommendedUpgrade } from '../../components/RecommendedUpgrade';
import { SpeedBlocks } from '../../components/SpeedBlocks';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Search } from 'lucide-react-native';
import { useScanPackage } from '../../hooks/useScanPackage';
import { usePackageHealth } from '../../hooks/usePackageHealth';
import { PackageHealth } from '../../components/PackageHealth';
import { cn, severityGlyph } from '../../lib/utils';

const FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SEV_RANK = {
  CRITICAL: 4,
  HIGH:     3,
  MEDIUM:   2,
  LOW:      1,
  NONE:     0,
};

const SORT_OPTIONS = [
  { label: 'Severity (high → low)', value: 'severity' },
  { label: 'Newest first', value: 'date_desc' },
  { label: 'Oldest first', value: 'date_asc' },
];

const ECO_LABEL = {
  npm: 'npm registry',
  PyPI: 'Python Package Index',
  Go: 'Go module proxy',
  Maven: 'Maven Central',
  RubyGems: 'RubyGems',
  'crates.io': 'crates.io',
  NuGet: 'NuGet gallery',
  Packagist: 'Packagist',
};

function SkeletonRow() {
  return (
    <View className="flex-row items-stretch border-b border-divider">
      <View className="w-2 bg-divider-strong" />
      <View className="flex-1 px-3 py-3 gap-2">
        <View className="h-3 w-32 bg-divider" />
        <View className="h-2 w-3/4 bg-divider" />
      </View>
    </View>
  );
}

function IndeterminateBar() {
  const translate = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);
  const translateX = translate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '300%'],
  });
  return (
    <View className="h-1 w-full bg-divider mt-3 overflow-hidden">
      <Animated.View style={{ height: '100%', width: '33%', backgroundColor: '#0a0a0a', transform: [{ translateX }] }} />
    </View>
  );
}

function ScanLoading({ name }) {
  return (
    <ScrollView className="flex-1">
      <View className="w-full lg:max-w-7xl lg:mx-auto lg:flex-row lg:items-start lg:border-l-2 lg:border-r-2 lg:border-ink">
        {/* === LEFT SIDEBAR SKELETON === */}
        <View className="lg:w-[360px] xl:w-[400px] lg:border-r-2 lg:border-ink lg:self-stretch">
          <View className="flex-row items-center px-4 lg:px-6 py-3 border-b border-divider">
            <View className="h-2 w-40 bg-divider" />
          </View>
          <View className="px-4 lg:px-6 py-4 lg:py-5 border-b-2 border-ink gap-2">
            <View className="h-7 w-56 bg-divider" />
            <View className="h-3 w-20 bg-divider mt-1" />
            <View className="h-2 w-32 bg-divider" />
          </View>
          <View className="bg-ink/5 px-4 lg:px-6 py-6 border-b-2 border-ink">
            <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow">
              Scanning {name ?? 'package'}…
            </Text>
            <Text className="font-mono text-[10px] text-muted mt-1">
              Querying OSV.dev + deps.dev
            </Text>
            <IndeterminateBar />
          </View>
          <View className="hidden lg:flex border-b-2 border-ink">
            <View className="bg-ink/5 px-6 py-6 border-b-2 border-ink gap-2">
              <View className="h-10 w-14 bg-divider" />
              <View className="h-2 w-24 bg-divider" />
            </View>
            <View className="flex-row">
              <View className="flex-1 border-r-2 border-b-2 border-ink px-6 py-4 gap-2">
                <View className="h-6 w-8 bg-divider" />
                <View className="h-2 w-16 bg-divider" />
                <View className="h-1 w-full bg-divider mt-1" />
              </View>
              <View className="flex-1 border-b-2 border-ink px-6 py-4 gap-2">
                <View className="h-6 w-8 bg-divider" />
                <View className="h-2 w-16 bg-divider" />
                <View className="h-1 w-full bg-divider mt-1" />
              </View>
            </View>
            <View className="flex-row">
              <View className="flex-1 border-r-2 border-ink px-6 py-4 gap-2">
                <View className="h-6 w-8 bg-divider" />
                <View className="h-2 w-16 bg-divider" />
                <View className="h-1 w-full bg-divider mt-1" />
              </View>
              <View className="flex-1 px-6 py-4 gap-2">
                <View className="h-6 w-8 bg-divider" />
                <View className="h-2 w-16 bg-divider" />
                <View className="h-1 w-full bg-divider mt-1" />
              </View>
            </View>
          </View>
          <View className="lg:hidden flex-row border-b-2 border-ink">
            {[0, 1, 2, 3].map(i => (
              <View key={i} className={cn('flex-1 items-center py-3 gap-1', i < 3 && 'border-r-2 border-ink')}>
                <View className="h-5 w-6 bg-divider" />
                <View className="h-2 w-12 bg-divider" />
              </View>
            ))}
          </View>
        </View>

        {/* === RIGHT MAIN SKELETON === */}
        <View className="lg:flex-1 lg:self-stretch">
          <View className="flex-row items-center gap-3 border-b-2 border-ink px-4 lg:px-6 py-3">
            <View className="h-2 w-10 bg-divider" />
            <View className="h-3 flex-1 bg-divider" />
          </View>
          <View className="flex-row border-b-2 border-ink">
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} className={cn('flex-1 px-3 lg:px-5 h-11 lg:h-12 justify-center', i < 4 && 'border-r border-divider')}>
                <View className="h-3 w-14 bg-divider" />
              </View>
            ))}
          </View>
          <View className="flex-row items-center justify-between border-b border-divider px-4 lg:px-6 py-3">
            <View className="flex-row items-center gap-3">
              <View className="h-2 w-10 bg-divider" />
              <View className="h-6 w-40 bg-divider" />
            </View>
            <View className="hidden lg:flex h-2 w-24 bg-divider" />
          </View>
          <View className="bg-ink/[0.03] border-b-2 border-ink px-4 lg:px-6 py-2.5">
            <View className="h-2 w-32 bg-divider" />
          </View>
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </View>
      </View>
    </ScrollView>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name, version, ecosystem, batchJson } = params;

  const { data: result, error, isLoading } = useScanPackage({ name, version, ecosystem, batchJson });
  const { data: health } = usePackageHealth(
    !batchJson && name && ecosystem ? { name, version, ecosystem } : {}
  );

  const [filter, setFilter] = React.useState('ALL');
  const [searchText, setSearchText] = React.useState('');
  const [sortBy, setSortBy] = React.useState('severity');

  const { fixedVulns, unfixedVulns } = React.useMemo(() => {
    if (!result) return { fixedVulns: [], unfixedVulns: [] };
    const q = searchText.trim().toLowerCase();
    const sorted = result.vulns
      .filter(v => {
        if (filter !== 'ALL' && v.cvss.severity !== filter) return false;
        if (q) {
          const idMatch = v.id.toLowerCase().includes(q);
          const summaryMatch = v.summary.toLowerCase().includes(q);
          const aliasMatch = v.aliases?.some(a => a.toLowerCase().includes(q));
          if (!idMatch && !summaryMatch && !aliasMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.published) - new Date(a.published);
        if (sortBy === 'date_asc')  return new Date(a.published) - new Date(b.published);
        const rankDiff = (SEV_RANK[b.cvss.severity] ?? 0) - (SEV_RANK[a.cvss.severity] ?? 0);
        if (rankDiff !== 0) return rankDiff;
        return (b.cvss.score ?? 0) - (a.cvss.score ?? 0);
      });
    return {
      fixedVulns:   sorted.filter(v => v.fixedVersion),
      unfixedVulns: sorted.filter(v => !v.fixedVersion),
    };
  }, [result, filter, searchText, sortBy]);

  const visibleCount = fixedVulns.length + unfixedVulns.length;

  const isBatch = !!batchJson;

  const batchPackages = React.useMemo(() => {
    if (!batchJson) return null;
    try { return JSON.parse(batchJson); } catch { return null; }
  }, [batchJson]);

  const totalVulns = result ? result.vulns.length : 0;

  function openVuln(vuln) {
    router.push({
      pathname: '/results/[id]',
      params: { id: vuln.id, name, version: version ?? '', ecosystem, batchJson: batchJson ?? '' },
    });
  }

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const renderVulnItem = React.useCallback(
    ({ item }) => <VulnRow vuln={item} onPress={() => openVuln(item)} />,
    [name, version, ecosystem, batchJson]
  );
  const keyExtractor = React.useCallback(item => item.id, []);

  function renderSuccess() {
    if (!result) return null;

    const sidebar = (
      <View className="lg:w-[360px] xl:w-[400px] lg:border-r-2 lg:border-ink lg:self-stretch">

        {/* Breadcrumb */}
        <View className="flex-row items-center px-4 lg:px-6 py-3 border-b border-divider">
          <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow" numberOfLines={1}>
            Scanner / {result.ecosystem} / {result.name}
            {result.version ? ` / v${result.version}` : ''}
          </Text>
        </View>

        {/* Package Header */}
        <View className="px-4 lg:px-6 py-4 lg:py-5 border-b-2 border-ink">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 min-w-0">
              <Text
                className="font-display text-2xl lg:text-3xl text-ink"
                style={{ letterSpacing: -0.3 }}
                numberOfLines={2}
              >
                {result.name}{result.version ? `@${result.version}` : ''}
              </Text>
              <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mt-2">
                {result.ecosystem}
              </Text>
              <Text className="font-mono text-xs text-muted mt-0.5">
                Scanned via {ECO_LABEL[result.ecosystem] ?? result.ecosystem}
              </Text>
            </View>
            <Badge variant={totalVulns > 0 ? 'filled' : 'success'}>
              {totalVulns} {totalVulns === 1 ? 'VULN' : 'VULNS'}
            </Badge>
          </View>
        </View>

        {/* Mobile stats */}
        <View className="lg:hidden border-b-2 border-ink">
          <View className={cn(
            'flex-row items-center justify-between px-4 py-3 border-b-2 border-ink',
            totalVulns > 0 ? 'bg-critical' : 'bg-success'
          )}>
            <Text className="font-mono-bold text-[10px] text-paper uppercase tracking-eyebrow">
              Total
            </Text>
            <Text className="font-display text-3xl text-paper tabular-nums">{totalVulns}</Text>
          </View>
          <View className="flex-row">
            {[
              { label: 'Critical', count: result.critical, key: 'critical', color: 'text-critical' },
              { label: 'High',     count: result.high,     key: 'high',     color: 'text-high' },
              { label: 'Medium',   count: result.medium,   key: 'medium',   color: 'text-ink' },
              { label: 'Low',      count: result.low,      key: 'low',      color: 'text-low' },
            ].map(({ label, count, key, color }, i) => (
              <View
                key={key}
                className={cn('flex-1 items-center py-3', i < 3 && 'border-r-2 border-ink')}
              >
                <Text className={cn('font-display text-xl tabular-nums', color)}>{count}</Text>
                <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-0.5">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Desktop stats */}
        <View className="hidden lg:flex border-b-2 border-ink">
          <View className={cn(
            'px-6 py-6 border-b-2 border-ink',
            totalVulns > 0 ? 'bg-critical' : 'bg-success',
          )}>
            <Text className="font-display text-5xl text-paper tabular-nums">{totalVulns}</Text>
            <Text className="font-mono-bold text-[10px] text-paper uppercase tracking-eyebrow mt-1">
              {totalVulns === 1 ? 'Vulnerability' : 'Vulnerabilities'}
            </Text>
          </View>
          <View className="flex-row">
            <StatCell label="Critical" count={result.critical} total={totalVulns} color="bg-critical" textColor="text-critical" borderRight borderBottom />
            <StatCell label="High" count={result.high} total={totalVulns} color="bg-high" textColor="text-high" borderBottom />
          </View>
          <View className="flex-row">
            <StatCell label="Medium" count={result.medium} total={totalVulns} color="bg-medium" textColor="text-ink" borderRight />
            <StatCell label="Low" count={result.low} total={totalVulns} color="bg-low" textColor="text-low" />
          </View>
        </View>

        {!isBatch && totalVulns > 0 && <RecommendedUpgrade result={result} />}

        {!isBatch && (
          <PackageHealth name={result.name} version={result.version} ecosystem={result.ecosystem} />
        )}

        {isBatch && batchPackages && (
          <View className="border-b-2 border-ink px-4 lg:px-6 py-4">
            <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mb-3">
              Packages scanned ({batchPackages.length})
            </Text>
            <View className="lg:hidden">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                {batchPackages.slice(0, 10).map((p, i) => (
                  <View key={i} className="border border-ink px-2 py-1 mr-2">
                    <Text className="font-mono-bold text-xs text-ink">{p.name}</Text>
                    <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
                      {p.ecosystem}{p.version ? ` · ${p.version}` : ''}
                    </Text>
                  </View>
                ))}
                {batchPackages.length > 10 && (
                  <View className="border border-divider-strong px-2 py-1 justify-center">
                    <Text className="font-mono text-xs text-muted">+{batchPackages.length - 10} more</Text>
                  </View>
                )}
              </ScrollView>
            </View>
            <View className="hidden lg:flex gap-1.5">
              {batchPackages.slice(0, 12).map((p, i) => (
                <View key={i} className="border border-ink px-2 py-1.5">
                  <Text className="font-mono-bold text-xs text-ink" numberOfLines={1}>{p.name}</Text>
                  <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
                    {p.ecosystem}{p.version ? ` · ${p.version}` : ''}
                  </Text>
                </View>
              ))}
              {batchPackages.length > 12 && (
                <Text className="font-mono text-xs text-muted mt-1">+{batchPackages.length - 12} more</Text>
              )}
            </View>
          </View>
        )}

        <View className="px-4 lg:px-6 py-3 border-b border-divider bg-paper gap-2">
          <View className="flex-row items-center gap-4 lg:gap-0 lg:flex-col lg:items-start lg:gap-2">
            <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow tabular-nums">
              ID: {result.scanId}
            </Text>
            <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
              Src: OSV.dev{!isBatch && health ? ' + deps.dev' : ''}
            </Text>
          </View>
          <SpeedBlocks durationMs={result.durationMs} />
        </View>
      </View>
    );

    const controls = (
      <View>
        {/* Severity filter tabs */}
        <View className="flex-row border-b-2 border-ink">
          {FILTERS.map((f, idx) => {
            const active = filter === f;
            const count = f === 'ALL' ? totalVulns : (result[f.toLowerCase()] ?? 0);
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Filter ${f}, ${count} vulnerabilities`}
                className={cn(
                  'flex-row items-center gap-1.5 h-11 lg:h-12 px-3 lg:px-5 web:cursor-pointer',
                  idx < FILTERS.length - 1 && 'border-r border-divider',
                  active ? 'bg-ink' : 'bg-paper hover:bg-ink/5 active:bg-ink/10'
                )}
              >
                {f !== 'ALL' && (
                  <Text
                    className={cn(
                      'font-mono-bold text-xs',
                      active ? 'text-paper' : (
                        f === 'CRITICAL' ? 'text-critical' :
                        f === 'HIGH' ? 'text-high' :
                        f === 'MEDIUM' ? 'text-ink' :
                        f === 'LOW' ? 'text-low' : 'text-muted'
                      )
                    )}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    {severityGlyph(f)}
                  </Text>
                )}
                <Text
                  className={cn(
                    'font-mono-bold text-xs uppercase tracking-widest',
                    active ? 'text-paper' : 'text-ink'
                  )}
                >
                  {f}
                </Text>
                <Text
                  className={cn(
                    'font-mono text-[10px] tabular-nums',
                    active ? 'text-paper/70' : 'text-muted'
                  )}
                >
                  ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sort Row */}
        <View className="flex-row items-center justify-between border-b border-divider px-4 lg:px-6 py-3 gap-3">
          <View className="flex-row items-center gap-3 flex-1">
            <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
              Sort
            </Text>
            <View className="flex-1 max-w-[240px]">
              <Select
                value={sortBy}
                onValueChange={setSortBy}
                options={SORT_OPTIONS}
                accessibilityLabel="Sort vulnerabilities"
              />
            </View>
          </View>
          <Text className="hidden lg:flex font-mono text-xs text-muted tabular-nums">
            {visibleCount} of {totalVulns} shown
          </Text>
        </View>

        {/* Filter / Search — prominent */}
        <View className="border-b-2 border-ink bg-ink/[0.03] px-4 lg:px-6 py-3 lg:py-4">
          <View className="flex-row items-center gap-2 lg:gap-3">
            <View
              className="h-11 lg:h-12 w-11 lg:w-12 border-2 border-ink bg-ink items-center justify-center"
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              <Search size={20} strokeWidth={2.5} color="#ffffff" />
            </View>
            <Input
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search CVE ID, alias, or keyword…"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Filter vulnerabilities by CVE ID, alias, or keyword"
              className="flex-1 border-2 border-ink bg-paper px-3 lg:px-4 h-11 lg:h-12 text-sm lg:text-base"
            />
            {searchText.length > 0 && (
              <Pressable
                onPress={() => setSearchText('')}
                accessibilityRole="button"
                accessibilityLabel="Clear filter"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="border-2 border-ink h-11 lg:h-12 px-3 justify-center web:cursor-pointer hover:bg-ink/5 active:bg-ink/10"
              >
                <Text className="font-mono-bold text-xs text-ink uppercase tracking-widest">Clear</Text>
              </Pressable>
            )}
          </View>
          {searchText.length > 0 && (
            <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow tabular-nums mt-2 lg:mt-2.5">
              {visibleCount} of {totalVulns} match “{searchText}”
            </Text>
          )}
        </View>
      </View>
    );

    const sections = visibleCount === 0 ? [] : [
      {
        title: 'Fixed',
        tone: 'success',
        subtitle: `${fixedVulns.length} addressed ${fixedVulns.length === 1 ? 'CVE' : 'CVEs'}`,
        data: fixedVulns,
      },
      {
        title: 'Unfixed',
        tone: 'critical',
        subtitle: `${unfixedVulns.length} no fix available`,
        data: unfixedVulns,
      },
    ];

    const renderSectionHeader = ({ section }) => (
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        count={section.data.length}
        tone={section.tone}
      />
    );

    const renderSectionFooter = ({ section }) => {
      if (section.data.length > 0) return null;
      return (
        <View className="px-4 lg:px-6 py-3 border-b border-divider">
          <Text className="font-mono text-xs text-muted">
            {section.title === 'Fixed'
              ? 'No CVEs in this view have a fix available yet.'
              : 'Every CVE in this view has been addressed.'}
          </Text>
        </View>
      );
    };

    const emptyState = (
      <View className="items-center py-12 lg:py-20">
        <Text className="font-display text-2xl lg:text-5xl text-success">✓</Text>
        <Text className="font-mono-bold text-sm lg:text-base text-ink mt-2 lg:mt-4 uppercase tracking-widest">
          {totalVulns === 0 ? 'No vulnerabilities found' : 'No results match filter'}
        </Text>
        {totalVulns === 0 && (
          <View className="items-center mt-2 lg:mt-3 gap-1">
            <Text className="font-mono text-xs lg:text-sm text-muted">
              {result.name} looks clean according to OSV.dev
            </Text>
            <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow tabular-nums">
              Scan ID {result.scanId} · {result.durationMs}ms
            </Text>
          </View>
        )}
      </View>
    );

    if (isDesktop) {
      return (
        <View className="flex-1">
          <View className="w-full max-w-7xl mx-auto flex-1 flex-row items-stretch border-l-2 border-r-2 border-ink">
            <View className="w-[360px] xl:w-[400px] border-r-2 border-ink">
              <ScrollView className="flex-1">
                {sidebar}
              </ScrollView>
            </View>
            <View className="flex-1">
              <SectionList
                className="flex-1"
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderVulnItem}
                renderSectionHeader={renderSectionHeader}
                renderSectionFooter={renderSectionFooter}
                ListHeaderComponent={controls}
                ListEmptyComponent={emptyState}
                ListFooterComponent={<View className="h-8" />}
                stickySectionHeadersEnabled={false}
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews
              />
            </View>
          </View>
        </View>
      );
    }

    return (
      <SectionList
        className="flex-1"
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderVulnItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        ListHeaderComponent={<>{sidebar}{controls}</>}
        ListEmptyComponent={emptyState}
        ListFooterComponent={<View className="h-8" />}
        stickySectionHeadersEnabled={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    );
  }

  return (
    <View className="flex-1 bg-paper">
      {/* Sticky Header — global controls only (no widget-level filter) */}
      <View className="border-b-2 border-ink bg-paper">
        <View className="w-full lg:max-w-7xl lg:mx-auto px-4 lg:px-8">
          <View className="flex-row items-center gap-3 lg:gap-6 py-3 lg:py-4">
            <Pressable
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              className="border-2 border-ink px-3 py-1.5 hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
            >
              <Text className="font-mono-bold text-xs text-ink uppercase tracking-widest">← Back</Text>
            </Pressable>
            <Wordmark size="sm" className="lg:hidden flex-1" />
            <Wordmark size="md" className="hidden lg:flex" />
          </View>
        </View>
      </View>

      {isLoading && <ScanLoading name={name} />}

      {error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-display text-3xl text-critical mb-2">!</Text>
          <Text className="font-mono-bold text-sm text-critical mb-2 uppercase tracking-widest">SCAN FAILED</Text>
          <Text className="font-mono text-sm text-ink text-center">{error.message ?? String(error)}</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="mt-4 border-2 border-ink px-4 py-2 hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
          >
            <Text className="font-mono-bold text-xs uppercase text-ink tracking-widest">Try Again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !error && result && renderSuccess()}
    </View>
  );
}

function SectionHeader({ title, subtitle, count, tone }) {
  return (
    <View className="bg-ink/[0.03] border-b-2 border-ink px-4 lg:px-6 py-2.5 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Text
          className={cn(
            'font-mono-bold text-[10px] uppercase tracking-eyebrow',
            tone === 'success' ? 'text-success' : 'text-critical'
          )}
        >
          {title}
        </Text>
        <Text className="font-mono text-[10px] text-muted uppercase tracking-eyebrow">
          · {subtitle}
        </Text>
      </View>
      <Text className="font-mono text-[10px] text-muted tabular-nums">
        {count}
      </Text>
    </View>
  );
}

function StatCell({ label, count, total, color, textColor, borderRight, borderBottom }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View
      className={cn(
        'flex-1 px-6 py-4',
        borderRight && 'border-r-2 border-ink',
        borderBottom && 'border-b-2 border-ink'
      )}
    >
      <Text className={cn('font-display text-2xl tabular-nums', textColor)}>{count}</Text>
      <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
        {label}
      </Text>
      <View className="h-1 w-full bg-divider mt-2">
        <View
          className={cn('h-full', color)}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
