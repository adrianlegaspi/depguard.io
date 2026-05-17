import * as React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { compareVersions, maxVersion } from '../lib/semver';
import { cn } from '../lib/utils';

function installCommand(ecosystem, name, version) {
  switch (ecosystem) {
    case 'npm':       return `npm install ${name}@${version}`;
    case 'PyPI':      return `pip install ${name}==${version}`;
    case 'RubyGems':  return `gem install ${name} -v ${version}`;
    case 'Go':        return `go get ${name}@v${version}`;
    case 'crates.io': return `cargo add ${name}@${version}`;
    case 'Packagist': return `composer require ${name}:${version}`;
    case 'NuGet':     return `dotnet add package ${name} --version ${version}`;
    default:          return `${name}@${version}`;
  }
}

export function RecommendedUpgrade({ result }) {
  const [copied, setCopied] = React.useState(false);

  const target = React.useMemo(() => {
    const fixes = result.vulns.map(v => v.fixedVersion).filter(Boolean);
    return maxVersion(fixes);
  }, [result.vulns]);

  if (!target) {
    return (
      <View className="px-4 py-3 border-b-2 border-ink bg-paper">
        <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
          No fixed version available — monitor for updates
        </Text>
      </View>
    );
  }

  const resolved = result.vulns.filter(
    v => v.fixedVersion && compareVersions(v.fixedVersion, target) <= 0
  ).length;
  const total = result.vulns.length;
  const cmd = installCommand(result.ecosystem, result.name, target);

  const canCopy = Platform.OS === 'web' && typeof navigator !== 'undefined' && !!navigator.clipboard;

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <View className="flex-row items-stretch border-b-2 border-ink">
      <View className="w-2 bg-success" />
      <View className="flex-1 px-4 py-4">
        <Text className="font-mono-bold text-[10px] text-success uppercase tracking-eyebrow mb-1">
          Recommended fix
        </Text>
        <Text className="font-display text-xl text-ink leading-tight">
          Upgrade to {result.name}@{target}
        </Text>
        <Text className="font-mono text-xs text-muted mt-1 tabular-nums">
          Resolves {resolved} of {total} {total === 1 ? 'vulnerability' : 'vulnerabilities'}
        </Text>
        <View className="flex-row items-center mt-3 gap-2">
          <View
            className={cn(
              'flex-1 border border-ink px-3 py-2 transition-colors',
              copied ? 'bg-ink' : 'bg-paper'
            )}
          >
            <Text
              className={cn(
                'font-mono text-xs',
                copied ? 'text-paper' : 'text-ink'
              )}
              numberOfLines={1}
              selectable
            >
              {cmd}
            </Text>
          </View>
          {canCopy && (
            <Pressable
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Command copied' : 'Copy command to clipboard'}
              className={cn(
                'border-2 border-ink px-3 py-2 web:cursor-pointer transition-colors',
                copied ? 'bg-success border-success' : 'bg-paper hover:bg-ink/5 active:bg-ink/10'
              )}
            >
              <Text
                className={cn(
                  'font-mono-bold text-xs uppercase tracking-widest',
                  copied ? 'text-paper' : 'text-ink'
                )}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
