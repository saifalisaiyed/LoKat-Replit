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
  withRepeat,
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

const SPLASH_DURATION = 3400;
const PULSE_SIZE = 110; // logo circle diameter
const PULSE_INTERVAL = 420; // ms between each ring launch

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  // Logo
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);

  // Background purple glow that breathes
  const bgGlow = useSharedValue(0);

  // 4 radar pulse rings — each loops independently
  const p1Scale = useSharedValue(1);
  const p1Opacity = useSharedValue(0);
  const p2Scale = useSharedValue(1);
  const p2Opacity = useSharedValue(0);
  const p3Scale = useSharedValue(1);
  const p3Opacity = useSharedValue(0);
  const p4Scale = useSharedValue(1);
  const p4Opacity = useSharedValue(0);

  // Text
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);

  // Screen fade-out
  const screenOpacity = useSharedValue(1);

  const launchPulse = (scale: ReturnType<typeof useSharedValue>, opacity: ReturnType<typeof useSharedValue>, delay: number) => {
    scale.value = withDelay(delay, withRepeat(
      withTiming(2.8, { duration: 1400, easing: Easing.out(Easing.ease) }),
      -1,
      false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.75, { duration: 80 }),
        withTiming(0, { duration: 1320, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    ));
  };

  useEffect(() => {
    // 1. Logo springs in
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 120 });

    // 2. Background glow breathes slowly
    bgGlow.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    ));

    // 3. Four radar rings staggered — start after logo is visible
    launchPulse(p1Scale, p1Opacity, 500);
    launchPulse(p2Scale, p2Opacity, 500 + PULSE_INTERVAL);
    launchPulse(p3Scale, p3Opacity, 500 + PULSE_INTERVAL * 2);
    launchPulse(p4Scale, p4Opacity, 500 + PULSE_INTERVAL * 3);

    // 4. Text
    nameOpacity.value = withDelay(850, withTiming(1, { duration: 500 }));
    nameY.value = withDelay(850, withSpring(0, { damping: 14, stiffness: 120 }));
    taglineOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));

    // 5. Fade out
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const bgGlowStyle = useAnimatedStyle(() => ({ opacity: bgGlow.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const p1Style = useAnimatedStyle(() => ({ opacity: p1Opacity.value, transform: [{ scale: p1Scale.value }] }));
  const p2Style = useAnimatedStyle(() => ({ opacity: p2Opacity.value, transform: [{ scale: p2Scale.value }] }));
  const p3Style = useAnimatedStyle(() => ({ opacity: p3Opacity.value, transform: [{ scale: p3Scale.value }] }));
  const p4Style = useAnimatedStyle(() => ({ opacity: p4Opacity.value, transform: [{ scale: p4Scale.value }] }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      {/* Breathing background glow */}
      <Animated.View style={[splashStyles.bgGlow, bgGlowStyle]} />

      <View style={splashStyles.centerStage}>
        {/* Radar pulse rings — all absolutely centered, same starting size as logo */}
        <Animated.View style={[splashStyles.pulseRing, p1Style]} />
        <Animated.View style={[splashStyles.pulseRing, p2Style]} />
        <Animated.View style={[splashStyles.pulseRing, p3Style]} />
        <Animated.View style={[splashStyles.pulseRing, p4Style]} />

        {/* Logo at center */}
        <Animated.View style={[splashStyles.logoWrap, logoStyle]}>
          <Image source={lokatLogo} style={splashStyles.logoImage} />
        </Animated.View>
      </View>

      <Animated.Text style={[splashStyles.appName, nameStyle]}>
        LoKat
      </Animated.Text>
      <Animated.Text style={[splashStyles.tagline, taglineStyle]}>
        Seek the Moment. Anywhere, Anytime.
      </Animated.Text>
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
  bgGlow: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    alignSelf: "center",
    top: "50%",
    marginTop: -310,
  },
  centerStage: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  pulseRing: {
    position: "absolute",
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  logoWrap: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#2D1B69",
  },
  logoImage: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
  },
  appName: {
    fontSize: 40,
    color: "#FFFFFF",
    fontFamily: "Archivo_700Bold",
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.55)",
    fontFamily: "Archivo_400Regular",
    marginTop: 8,
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
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
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
    SplashScreen.hideAsync();
  }, []);

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
