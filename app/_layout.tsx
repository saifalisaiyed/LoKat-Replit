import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { getApiUrl } from "@/lib/query-client";
import { View, Text, Image, ImageBackground, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/lib/store";

const splashBg = require("@/assets/images/splash.png");
const lokatFullLogo = require("@/assets/images/lokat-full-logo.png");
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from "@expo-google-fonts/archivo";

SplashScreen.preventAutoHideAsync();

const SPLASH_DURATION = 4500;

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withDelay(1500, withTiming(1, { duration: 600 }));
    logoTranslateY.value = withDelay(1500, withSpring(0, { damping: 14, stiffness: 100 }));
    taglineOpacity.value = withDelay(2000, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 400);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: fadeOut.value }));
  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));
  const taglineAnimStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      <ImageBackground source={splashBg} style={splashStyles.bg} resizeMode="cover">
        <View style={splashStyles.content}>
          <Animated.Image
            source={lokatFullLogo}
            style={[splashStyles.fullLogo, logoAnimStyle]}
            resizeMode="contain"
          />
          <Animated.Text style={[splashStyles.tagline, taglineAnimStyle]}>
            Seek the Moment. Anywhere, Anytime.
          </Animated.Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  fullLogo: {
    width: 260,
    height: 66,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="create-request"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="request-detail/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="lokater-mode/[id]"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="camera/[id]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="receipt/[id]"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-security" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="payment-setup" options={{ headerShown: false }} />
      <Stack.Screen name="payout-setup" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
      <Stack.Screen
        name="map-picker"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashFinish = useCallback(async () => {
    setShowSplash(false);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}api/auth/me`, { credentials: "include" });
      if (res.ok) {
        // Already authenticated — stay on current route, don't redirect to /auth
        return;
      }
    } catch (_) {}
    setTimeout(() => {
      router.replace("/auth");
    }, 50);
  }, []);

  if (showSplash) {
    if (!fontsLoaded) {
      // Fonts still loading — show the same dark background as the splash so
      // there is no visible gap or flash after the native splash hides.
      return <View style={{ flex: 1, backgroundColor: "#1A1B2E" }} />;
    }
    return (
      <ErrorBoundary>
        <BrandedSplash onFinish={handleSplashFinish} />
      </ErrorBoundary>
    );
  }

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
