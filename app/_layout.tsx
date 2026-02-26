import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/lib/store";

const lokatLogo = require("@/assets/images/lokat-logo.png");
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
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

const SPLASH_DURATION = 3000;

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const taglineOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    glowScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 80 }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(400, withSpring(0, { damping: 14, stiffness: 120 }));
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 400);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowScale.value * 0.5,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      <View style={splashStyles.content}>
        <View style={splashStyles.logoArea}>
          <Animated.View style={[splashStyles.glow, glowAnimStyle]} />
          <Animated.View style={[splashStyles.logoCircle, logoAnimStyle]}>
            <Image source={lokatLogo} style={splashStyles.logoImage} />
          </Animated.View>
        </View>

        <Animated.Text style={[splashStyles.appName, textAnimStyle]}>
          LoKat
        </Animated.Text>

        <Animated.Text style={[splashStyles.tagline, taglineAnimStyle]}>
          Seek the Moment. Anywhere, Anytime.
        </Animated.Text>
      </View>

      <View style={{ height: 20 }} />
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B2E",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoArea: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  glow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
  logoCircle: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  appName: {
    fontSize: 38,
    color: "#FFFFFF",
    fontFamily: "Archivo_700Bold",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "Archivo_400Regular",
    marginTop: 6,
  },
  footerText: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 50 : 60,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "Archivo_400Regular",
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
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ headerShown: false }} />
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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setTimeout(() => {
      router.replace("/auth");
    }, 50);
  }, []);

  if (!fontsLoaded) return null;

  if (showSplash) {
    return (
      <ErrorBoundary>
        <BrandedSplash onFinish={handleSplashFinish} />
      </ErrorBoundary>
    );
  }

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
