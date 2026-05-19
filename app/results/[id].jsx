import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wordmark } from '../../components/Wordmark';
import { VulnDetail } from '../../components/VulnDetail';
import { PackageHealth } from '../../components/PackageHealth';
import { useScanPackage } from '../../hooks/useScanPackage';

export default function VulnDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name, version, ecosystem, batchJson } = params;

  const { data: result, error, isLoading } = useScanPackage({
    name,
    version,
    ecosystem,
    batchJson: batchJson || undefined,
  });

  const vuln = React.useMemo(() => {
    if (!result || !id) return null;
    return result.vulns.find(
      v => v.id === id || v.aliases?.includes(id)
    );
  }, [result, id]);

  const packageInfo = React.useMemo(() => {
    if (!vuln) return null;
    const eco = ecosystem ?? result?.ecosystem ?? 'unknown';
    if (vuln._pkg) {
      const at = vuln._pkg.lastIndexOf('@');
      const pkgName = at > 0 ? vuln._pkg.slice(0, at) : vuln._pkg;
      return { name: pkgName, ecosystem: eco };
    }
    return { name: name ?? 'unknown', ecosystem: eco };
  }, [vuln, name, ecosystem, result]);

  const pkgLabel = name ? `${name}${version ? `@${version}` : ''}` : 'results';

  return (
    <View className="flex-1 bg-paper">
      {/* Sticky Header */}
      <View className="border-b-2 border-ink bg-paper">
        <View className="w-full lg:max-w-7xl lg:mx-auto px-4 lg:px-8">
          <View className="flex-row items-center gap-3 lg:gap-6 py-3 lg:py-4">
            <Pressable
              onPress={() => router.push({
                pathname: '/results',
                params: { name, version, ecosystem, ...(batchJson ? { batchJson } : {}) },
              })}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${pkgLabel}`}
              className="border-2 border-ink px-3 py-1.5 hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
            >
              <Text
                className="font-mono-bold text-xs text-ink uppercase tracking-widest"
                numberOfLines={1}
              >
                ← Back to {pkgLabel}
              </Text>
            </Pressable>
            <Wordmark size="sm" className="lg:hidden flex-1" />
            <Wordmark size="md" className="hidden lg:flex" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="w-full lg:max-w-5xl lg:mx-auto lg:border-l-2 lg:border-r-2 lg:border-ink">

          {/* Breadcrumb */}
          <View className="flex-row items-center px-4 lg:px-6 py-3 border-b border-divider">
            <Text
              className="font-mono text-[10px] text-muted uppercase tracking-eyebrow flex-1"
              numberOfLines={1}
            >
              Scanner / {ecosystem ?? '—'} / {name ?? '—'}
              {version ? ` / v${version}` : ''} / {id}
            </Text>
          </View>

          {isLoading && (
            <View className="px-4 lg:px-6 py-8 gap-3">
              <View className="h-6 w-48 bg-divider" />
              <View className="h-3 w-3/4 bg-divider" />
              <View className="h-3 w-1/2 bg-divider mt-4" />
              <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-4">
                Loading {id}…
              </Text>
            </View>
          )}

          {error && !isLoading && (
            <View className="items-center px-6 py-12">
              <Text className="font-display text-3xl text-critical mb-2">!</Text>
              <Text className="font-mono-bold text-sm text-critical mb-2 uppercase tracking-widest">
                Could not load vulnerability
              </Text>
              <Text className="font-mono text-sm text-ink text-center">
                {error.message ?? String(error)}
              </Text>
            </View>
          )}

          {!isLoading && !error && result && !vuln && (
            <View className="items-center px-6 py-12">
              <Text className="font-display text-3xl text-ink mb-2">?</Text>
              <Text className="font-mono-bold text-sm text-ink mb-2 uppercase tracking-widest">
                {id} not found
              </Text>
              <Text className="font-mono text-sm text-muted text-center">
                OSV scan of {pkgLabel} did not return this vulnerability.
              </Text>
            </View>
          )}

          {vuln && name && ecosystem && (
            <PackageHealth name={name} version={version || ''} ecosystem={ecosystem} variant="compact" />
          )}
          {vuln && <VulnDetail vuln={vuln} packageInfo={packageInfo} />}

          <View className="h-8" />
        </View>
      </ScrollView>
    </View>
  );
}
