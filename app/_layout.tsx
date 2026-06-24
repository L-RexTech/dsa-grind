import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DSAProvider, useDSA } from "@/context/DSAContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Watches isBlocked and redirects to /focus-gate whenever it becomes true.
 * Must live inside DSAProvider so it can call useDSA().
 */
function GateGuard() {
  const { isBlocked } = useDSA();
  const segments = useSegments();

  useEffect(() => {
    const onGate = segments[0] === "focus-gate";
    if (isBlocked && !onGate) {
      router.replace("/focus-gate");
    }
  }, [isBlocked, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <GateGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="question/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="focus-gate"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <DSAProvider>
                <RootLayoutNav />
              </DSAProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
