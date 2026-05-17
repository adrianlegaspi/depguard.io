import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Wordmark } from "../components/Wordmark";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { checkOsvHealth } from "../services/osv";
import { fetchRecentAdvisories } from "../services/githubAdvisories";
import { parseLockfile } from "../lib/lockfile";
import { cn, severityGlyph } from "../lib/utils";

const ECOSYSTEMS = [
  { label: "npm", value: "npm" },
  { label: "PyPI", value: "PyPI" },
  { label: "Go", value: "Go" },
  { label: "Maven", value: "Maven" },
  { label: "RubyGems", value: "RubyGems" },
  { label: "crates.io", value: "crates.io" },
  { label: "NuGet", value: "NuGet" },
  { label: "Packagist", value: "Packagist" },
];

const SEV_BG = {
  critical: "#FF1F1F",
  high: "#FF6A00",
  medium: "#F5C518",
  low: "#2563EB",
  unknown: "#888888",
};

const TAB_CAPTION = {
  search: "Audit a single package — type the name, optionally append @version.",
  paste: "Paste lockfile contents (package-lock.json, yarn.lock, pnpm-lock, requirements.txt).",
  upload: "Upload a lockfile from disk. We never send your file to a server.",
};

export default function HomeScreen() {
  const router = useRouter();
  const [tab, setTab] = React.useState("search");
  const [ecosystem, setEcosystem] = React.useState("npm");
  const [query, setQuery] = React.useState("");
  const [pasteText, setPasteText] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState(null);
  const [osvOnline, setOsvOnline] = React.useState(null);
  const [recentPkgs, setRecentPkgs] = React.useState(null);
  const [recentCves, setRecentCves] = React.useState(null);

  React.useEffect(() => {
    checkOsvHealth().then((ok) => setOsvOnline(ok));

    fetchRecentAdvisories({ severity: "high", perPage: 20 }).then(
      (advisories) => {
        const seen = new Set();
        const flat = [];
        for (const a of advisories) {
          for (const p of a.packages) {
            const key = `${p.ecosystem}|${p.name}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push({
              name: p.name,
              ecosystem: p.ecosystem,
              severity: a.severity,
              advisoryId: a.cveId ?? a.ghsaId,
            });
            if (flat.length >= 8) break;
          }
          if (flat.length >= 8) break;
        }
        setRecentPkgs(flat);
      },
    );

    fetchRecentAdvisories({ severity: "critical", perPage: 15 }).then(
      setRecentCves,
    );
  }, []);

  function parseQueryInput(raw) {
    const trimmed = raw.trim();
    const atIdx = trimmed.lastIndexOf("@");
    if (atIdx > 0) {
      return {
        name: trimmed.slice(0, atIdx),
        version: trimmed.slice(atIdx + 1),
      };
    }
    return { name: trimmed, version: "" };
  }

  function handleSearch() {
    const { name, version } = parseQueryInput(query);
    if (!name) return;
    router.push({ pathname: "/results", params: { name, version, ecosystem } });
  }

  function navigateToBatch(text, label) {
    const { packages, ecosystem: detectedEco, error } = parseLockfile(text);
    if (error === "package_json") {
      Alert.alert(
        "Wrong file",
        "This looks like package.json — paste package-lock.json instead.",
      );
      return;
    }
    if (!packages.length) {
      Alert.alert(
        "No packages found",
        "Could not detect a supported lockfile format.",
      );
      return;
    }
    const first = packages[0];
    router.push({
      pathname: "/results",
      params: {
        name: first.name,
        version: first.version,
        ecosystem: detectedEco,
        batchJson: JSON.stringify(packages.slice(0, 50)),
      },
    });
  }

  async function handlePasteScan() {
    if (!pasteText.trim()) return;
    navigateToBatch(pasteText, "paste");
  }

  async function handleUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setUploadedFile(result.assets[0]);
    } catch (e) {
      Alert.alert("Error", "Could not open file picker.");
    }
  }

  async function handleUploadScan() {
    if (!uploadedFile) return;
    try {
      const res = await fetch(uploadedFile.uri);
      const text = await res.text();
      navigateToBatch(text, uploadedFile.name);
    } catch {
      Alert.alert("Error", "Could not read the selected file.");
    }
  }

  function fillRecentPkg(pkg) {
    setEcosystem(pkg.ecosystem);
    setQuery(pkg.name);
    setTab("search");
  }

  function openAdvisory(ghsaId) {
    Linking.openURL(`https://osv.dev/vulnerability/${ghsaId}`).catch(() => {});
  }

  const osvPillState = osvOnline == null
    ? "checking"
    : osvOnline
    ? "online"
    : "offline";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Sticky Header (full-width on desktop) */}
      <View className="border-b-2 border-ink bg-paper">
        <View className="w-full lg:max-w-7xl lg:mx-auto flex-row items-center justify-between px-4 lg:px-8 py-3 lg:py-4">
          <Wordmark size="md" />
          <View
            className={cn(
              "flex-row items-center gap-2 border px-2 py-1",
              osvPillState === "offline"
                ? "bg-critical border-critical"
                : "bg-paper border-ink"
            )}
            accessibilityRole="status"
            accessibilityLabel={`OSV is ${osvPillState}`}
          >
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  osvPillState === "checking"
                    ? "#888"
                    : osvPillState === "online"
                    ? "#00C853"
                    : "#FFFFFF",
              }}
            />
            <Text
              className={cn(
                "font-mono-bold text-[10px] uppercase tracking-eyebrow",
                osvPillState === "offline" ? "text-paper" : "text-ink"
              )}
            >
              {osvPillState === "checking"
                ? "Checking"
                : osvPillState === "online"
                ? "OSV Online"
                : "OSV Offline"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="w-full lg:max-w-7xl lg:mx-auto lg:flex-row lg:items-stretch lg:border-l-2 lg:border-r-2 lg:border-ink">
          {/* === LEFT COLUMN (Hero + Scanner) === */}
          <View className="lg:flex-1 lg:border-r-2 lg:border-ink">
            {/* Hero */}
            <View className="border-b-2 border-ink px-4 lg:px-10 py-8 lg:py-14">
              <Text
                className="font-display text-3xl lg:text-5xl text-ink"
                style={{ lineHeight: Platform.OS === "web" ? undefined : 38, letterSpacing: -0.5 }}
              >
                Audit any package.{"\n"}Trust nothing.
              </Text>
              <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mt-4">
                Powered by OSV.dev
              </Text>
              <Text className="font-mono text-xs text-muted mt-1">
                Real-time vulnerability data across npm, PyPI, Go, Maven, and 4 more ecosystems.
              </Text>
            </View>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="paste">Paste</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              {/* Tab caption */}
              <View className="px-4 lg:px-8 py-3 border-b border-divider">
                <Text className="font-mono text-xs text-muted">
                  {TAB_CAPTION[tab]}
                </Text>
              </View>

              {/* Search Tab */}
              <TabsContent value="search">
                <View className="p-4 lg:p-8 gap-3 lg:gap-4 border-b-2 border-ink">
                  <View className="lg:flex-row lg:gap-3 gap-3">
                    <View className="lg:w-48">
                      <Select
                        value={ecosystem}
                        onValueChange={setEcosystem}
                        options={ECOSYSTEMS}
                        placeholder="Ecosystem"
                        accessibilityLabel="Select package ecosystem"
                      />
                    </View>
                    <View className="lg:flex-1">
                      <Input
                        value={query}
                        onChangeText={setQuery}
                        placeholder="lodash@4.17.15 or package name"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        accessibilityLabel="Package name and optional version"
                      />
                    </View>
                    <View className="lg:w-40">
                      <Button onPress={handleSearch} disabled={!query.trim()}>
                        SCAN
                      </Button>
                    </View>
                  </View>
                  <Text className="hidden lg:flex font-mono text-xs text-muted">
                    Append <Text className="text-ink">@version</Text> to scan a specific release · Press{" "}
                    <Text className="text-ink">Enter</Text> to scan
                  </Text>
                </View>
              </TabsContent>

              {/* Paste Tab */}
              <TabsContent value="paste">
                <View className="p-4 lg:p-8 gap-3 border-b-2 border-ink">
                  <Input
                    value={pasteText}
                    onChangeText={setPasteText}
                    placeholder={'{\n  "lockfileVersion": 3,\n  ...\n}'}
                    multiline
                    numberOfLines={8}
                    className="min-h-[140px] lg:min-h-[260px]"
                    textAlignVertical="top"
                    accessibilityLabel="Paste lockfile contents"
                  />
                  <Button
                    onPress={handlePasteScan}
                    disabled={!pasteText.trim()}
                  >
                    SCAN PACKAGES
                  </Button>
                </View>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload">
                <View className="p-4 lg:p-8 gap-3 border-b-2 border-ink">
                  <Pressable
                    onPress={handleUpload}
                    accessibilityRole="button"
                    accessibilityLabel={uploadedFile ? `Selected file ${uploadedFile.name}, tap to change` : "Select lockfile to upload"}
                    className="items-center justify-center border-2 border-dashed border-ink py-12 lg:py-20 web:cursor-pointer hover:bg-ink/5 active:bg-ink/10"
                  >
                    <Text className="font-display text-2xl lg:text-5xl text-ink">
                      ↑
                    </Text>
                    <Text className="font-mono-bold text-sm lg:text-base text-ink uppercase mt-2 lg:mt-4 tracking-widest">
                      {uploadedFile ? uploadedFile.name : "Tap to select file"}
                    </Text>
                    <Text className="font-mono text-xs lg:text-sm text-muted mt-1 lg:mt-2">
                      package-lock.json · yarn.lock · pnpm-lock.yaml · requirements.txt
                    </Text>
                  </Pressable>
                  {uploadedFile && (
                    <Button onPress={handleUploadScan}>
                      SCAN {uploadedFile.name}
                    </Button>
                  )}
                </View>
              </TabsContent>
            </Tabs>

            {/* Stats strip (desktop-only marketing) */}
            <View className="hidden lg:flex flex-row border-b-2 border-ink">
              <View className="flex-1 px-6 py-5 border-r-2 border-ink">
                <Text className="font-display text-3xl text-ink tabular-nums">8</Text>
                <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
                  Ecosystems
                </Text>
              </View>
              <View className="flex-1 px-6 py-5 border-r-2 border-ink">
                <Text className="font-display text-3xl text-ink">OSV+GHSA</Text>
                <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
                  Sources
                </Text>
              </View>
              <View className="flex-1 px-6 py-5 border-r-2 border-ink">
                <Text className="font-display text-3xl text-ink">CVE</Text>
                <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
                  Standard IDs
                </Text>
              </View>
              <View className="flex-1 px-6 py-5">
                <Text className="font-display text-3xl text-success">LIVE</Text>
                <Text className="font-mono-bold text-[10px] text-muted uppercase tracking-eyebrow mt-1">
                  Realtime
                </Text>
              </View>
            </View>

            {/* Mobile-only: recent vulnerable packages — horizontal scroll for predictability */}
            <View className="lg:hidden">
              {recentPkgs !== null && recentPkgs.length > 0 && (
                <View className="border-b-2 border-ink py-4">
                  <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow mb-3 px-4">
                    Recent vulnerable packages
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="flex-row gap-2 px-4"
                  >
                    {recentPkgs.slice(0, 8).map((pkg) => (
                      <Pressable
                        key={`${pkg.ecosystem}|${pkg.name}`}
                        onPress={() => fillRecentPkg(pkg)}
                        accessibilityRole="button"
                        accessibilityLabel={`Fill search with ${pkg.name} from ${pkg.ecosystem}, ${pkg.severity} severity`}
                        className="flex-row items-stretch border border-ink hover:bg-ink/5 active:bg-ink/10"
                      >
                        <View
                          style={{
                            width: 6,
                            backgroundColor:
                              SEV_BG[pkg.severity] ?? SEV_BG.unknown,
                          }}
                        />
                        <View className="px-3 py-2">
                          <Text className="font-mono-bold text-xs text-ink">
                            {pkg.name}
                          </Text>
                          <Text className="font-mono text-[10px] text-muted uppercase mt-0.5 tracking-eyebrow">
                            {pkg.ecosystem}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {recentCves !== null && recentCves.length > 0 && (
                <View className="bg-ink px-4 py-5">
                  <Text className="font-mono-bold text-[10px] text-paper uppercase tracking-eyebrow mb-3">
                    Recent critical CVEs
                  </Text>
                  {recentCves.slice(0, 5).map((cve) => (
                    <Pressable
                      key={cve.ghsaId}
                      onPress={() => openAdvisory(cve.ghsaId)}
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${cve.cveId ?? cve.ghsaId}, ${cve.severity} severity`}
                      hitSlop={{ top: 4, bottom: 4 }}
                      className="flex-row items-center justify-between py-3 border-b border-paper/10"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="font-mono-bold text-sm text-paper tabular-nums">
                          {cve.cveId ?? cve.ghsaId}
                        </Text>
                        <Text
                          className="font-mono text-xs text-paper/60"
                          numberOfLines={1}
                        >
                          {cve.summary}
                        </Text>
                        {cve.packages?.[0] && (
                          <Text className="font-mono text-[10px] text-paper/40 mt-0.5 uppercase tracking-eyebrow">
                            {cve.packages[0].ecosystem} · {cve.packages[0].name}
                          </Text>
                        )}
                      </View>
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5"
                        style={{
                          backgroundColor:
                            SEV_BG[cve.severity] ?? SEV_BG.unknown,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "JetBrainsMono_700Bold",
                          }}
                          className={cn(
                            cve.severity === "medium"
                              ? "text-ink"
                              : "text-paper",
                          )}
                        >
                          {severityGlyph(cve.severity)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "JetBrainsMono_700Bold",
                          }}
                          className={cn(
                            "uppercase tabular-nums",
                            cve.severity === "medium"
                              ? "text-ink"
                              : "text-paper",
                          )}
                        >
                          {cve.severity.toUpperCase()}
                          {cve.cvssScore != null
                            ? ` ${cve.cvssScore.toFixed(1)}`
                            : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* === RIGHT SIDEBAR (desktop only) === */}
          <View className="hidden lg:flex lg:w-[440px] xl:w-[480px]">
            {/* Recent vulnerable packages */}
            <View className="border-b-2 border-ink px-6 py-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-mono-bold text-[10px] text-ink uppercase tracking-eyebrow">
                  Recent vulnerable packages
                </Text>
                <View className="h-2 w-2 rounded-full bg-critical" />
              </View>
              {recentPkgs !== null && recentPkgs.length > 0 ? (
                <View className="flex-row flex-wrap -m-1">
                  {recentPkgs.slice(0, 8).map((pkg) => (
                    <View
                      key={`${pkg.ecosystem}|${pkg.name}`}
                      className="w-1/2 p-1"
                    >
                      <Pressable
                        onPress={() => fillRecentPkg(pkg)}
                        accessibilityRole="button"
                        accessibilityLabel={`Fill search with ${pkg.name} from ${pkg.ecosystem}`}
                        className="flex-row items-stretch border border-ink h-full hover:bg-ink/5 active:bg-ink/10 web:cursor-pointer"
                      >
                        <View
                          style={{
                            width: 6,
                            backgroundColor:
                              SEV_BG[pkg.severity] ?? SEV_BG.unknown,
                          }}
                        />
                        <View className="flex-1 px-3 py-2">
                          <Text
                            className="font-mono-bold text-xs text-ink"
                            numberOfLines={1}
                          >
                            {pkg.name}
                          </Text>
                          <Text className="font-mono text-[10px] text-muted uppercase mt-0.5 tracking-eyebrow">
                            {pkg.ecosystem}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="flex-row flex-wrap -m-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View key={i} className="w-1/2 p-1">
                      <View className="border border-divider px-3 py-2">
                        <View className="h-3 w-24 bg-divider mb-1" />
                        <View className="h-2 w-12 bg-divider" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recent critical CVEs */}
            <View className="flex-1 bg-ink px-6 py-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-mono-bold text-[10px] text-paper uppercase tracking-eyebrow">
                  Recent critical CVEs
                </Text>
                <View className="flex-row items-center gap-1.5 px-2 py-0.5 bg-critical">
                  <View className="h-1.5 w-1.5 rounded-full bg-paper" />
                  <Text className="font-mono-bold text-[10px] text-paper uppercase tracking-eyebrow">
                    LIVE
                  </Text>
                </View>
              </View>
              {recentCves !== null && recentCves.length > 0
                ? recentCves.slice(0, 7).map((cve) => (
                    <Pressable
                      key={cve.ghsaId}
                      onPress={() => openAdvisory(cve.ghsaId)}
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${cve.cveId ?? cve.ghsaId}, ${cve.severity} severity`}
                      hitSlop={{ top: 4, bottom: 4 }}
                      className="flex-row items-center justify-between py-3 border-b border-paper/10 hover:bg-paper/5 web:cursor-pointer"
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className="font-mono-bold text-sm text-paper tabular-nums"
                          numberOfLines={1}
                        >
                          {cve.cveId ?? cve.ghsaId}
                        </Text>
                        <Text
                          className="font-mono text-xs text-paper/60 mt-0.5"
                          numberOfLines={1}
                        >
                          {cve.summary}
                        </Text>
                        {cve.packages?.[0] && (
                          <Text className="font-mono text-[10px] text-paper/40 mt-0.5 uppercase tracking-eyebrow">
                            {cve.packages[0].ecosystem} · {cve.packages[0].name}
                          </Text>
                        )}
                      </View>
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5"
                        style={{
                          backgroundColor:
                            SEV_BG[cve.severity] ?? SEV_BG.unknown,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "JetBrainsMono_700Bold",
                          }}
                          className={cn(
                            cve.severity === "medium"
                              ? "text-ink"
                              : "text-paper",
                          )}
                        >
                          {severityGlyph(cve.severity)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "JetBrainsMono_700Bold",
                          }}
                          className={cn(
                            "uppercase tabular-nums",
                            cve.severity === "medium"
                              ? "text-ink"
                              : "text-paper",
                          )}
                        >
                          {cve.severity.toUpperCase()}
                          {cve.cvssScore != null
                            ? ` ${cve.cvssScore.toFixed(1)}`
                            : ""}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                : [0, 1, 2, 3, 4].map((i) => (
                    <View key={i} className="py-3 border-b border-paper/10">
                      <View className="h-3 w-32 bg-paper/10 mb-1" />
                      <View className="h-2 w-48 bg-paper/10" />
                    </View>
                  ))}
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
