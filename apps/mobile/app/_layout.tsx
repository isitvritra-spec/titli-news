import "../global.css";

import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
  Mukta_700Bold,
} from "@expo-google-fonts/mukta";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useIsRestoring } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";

import { colors } from "@repo/tokens";
import { queryClient, asyncStoragePersister } from "../lib/queryClient";
import { useRefetchOnForeground } from "../lib/useRefetchOnForeground";
import { useOnboardingStatus } from "../lib/onboarding";
import { AnimatedSplash } from "../components/AnimatedSplash";
import { flushEvents, trackEvent } from "../lib/analytics";

SplashScreen.preventAutoHideAsync();

/**
 * Redirects to /onboarding on first launch only. Gated on useIsRestoring()
 * so it doesn't fire against useHasSeenOnboarding()'s initialData:false
 * fallback before the persisted (AsyncStorage-backed) query cache finishes
 * hydrating — without that guard, returning users would flash-redirect to
 * onboarding on every cold start.
 */
function OnboardingGate() {
  const router = useRouter();
  const isRestoring = useIsRestoring();
  const { data: hasSeenOnboarding = false, isPending } = useOnboardingStatus();

  useEffect(() => {
    if (!isRestoring && !isPending && !hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [isRestoring, isPending, hasSeenOnboarding, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
    Mukta_700Bold,
  });

  useRefetchOnForeground();

  useEffect(() => {
    trackEvent("app_open");
    void flushEvents();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <StatusBar style="dark" />
          <AnimatedSplash>
            <OnboardingGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ presentation: "modal", gestureEnabled: false }} />
              <Stack.Screen name="card/[slug]" options={{ presentation: "card", animation: "slide_from_right" }} />
              <Stack.Screen name="pulse" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
              <Stack.Screen name="shh" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            </Stack>
          </AnimatedSplash>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
