import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SpaceGrotesk_700Bold,
  useFonts as useSpaceGrotesk,
} from "@expo-google-fonts/space-grotesk";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
  useFonts as useJetBrains,
} from "@expo-google-fonts/jetbrains-mono";
import { View, Text } from "react-native";
import { SWRConfig } from "swr";
import "../global.css";

export default function RootLayout() {
  const [spaceLoaded] = useSpaceGrotesk({ SpaceGrotesk_700Bold });
  const [jbLoaded] = useJetBrains({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!spaceLoaded || !jbLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <Text style={{ fontFamily: "System", fontSize: 14, color: "#000" }}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateIfStale: false,
        shouldRetryOnError: false,
      }}
    >
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      />
    </SWRConfig>
  );
}
