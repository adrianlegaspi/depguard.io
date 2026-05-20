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
import { SWRConfig } from "swr";
import "../global.css";

export default function RootLayout() {
  useSpaceGrotesk({ SpaceGrotesk_700Bold });
  useJetBrains({ JetBrainsMono_400Regular, JetBrainsMono_700Bold });

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
