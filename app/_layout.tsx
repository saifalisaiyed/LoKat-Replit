import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
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

const SPLASH_DURATION = 3200;

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  // Pin drop
  const pinY = useSharedValue(-220);
  const pinOpacity = useSharedValue(1);

  // Ripple rings
  const r1Scale = useSharedValue(0);
  const r1Opacity = useSharedValue(0);
  const r2Scale = useSharedValue(0);
  const r2Opacity = useSharedValue(0);
  const r3Scale = useSharedValue(0);
  const r3Opacity = useSharedValue(0);

  // Logo swap
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);

  // Text
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);

  // Screen fade-out
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Pin drops with a satisfying bounce
    pinY.value = withSpring(0, { damping: 7, stiffness: 90, mass: 1 });

    // 2. On impact (~550ms), three ripple rings expand outward
    r1Scale.value = withDelay(520, withTiming(1, { duration: 750, easing: Easing.out(Easing.ease) }));
    r1Opacity.value = withDelay(520, withSequence(
      withTiming(0.85, { duration: 60 }),
      withTiming(0, { duration: 690, easing: Easing.out(Easing.ease) })
    ));

    r2Scale.value = withDelay(660, withTiming(1, { duration: 750, easing: Easing.out(Easing.ease) }));
    r2Opacity.value = withDelay(660, withSequence(
      withTiming(0.55, { duration: 60 }),
      withTiming(0, { duration: 690, easing: Easing.out(Easing.ease) })
    ));

    r3Scale.value = withDelay(800, withTiming(1, { duration: 750, easing: Easing.out(Easing.ease) }));
    r3Opacity.value = withDelay(800, withSequence(
      withTiming(0.3, { duration: 60 }),
      withTiming(0, { duration: 690, easing: Easing.out(Easing.ease) })
    ));

    // 3. Pin fades out, logo springs in at same position
    pinOpacity.value = withDelay(580, withTiming(0, { duration: 220 }));
    logoOpacity.value = withDelay(680, withTiming(1, { duration: 350 }));
    logoScale.value = withDelay(680, withSpring(1, { damping: 11, stiffness: 140 }));

    // 4. App name slides up
    nameOpacity.value = withDelay(950, withTiming(1, { duration: 450 }));
    nameY.value = withDelay(950, withSpring(0, { damping: 14, stiffness: 120 }));

    // 5. Tagline fades in
    taglineOpacity.value = withDelay(1200, withTiming(1, { duration: 450 }));

    // 6. Fade out entire splash
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 450);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [{ translateY: pinY.value }],
  }));
  const r1Style = useAnimatedStyle(() => ({
    opacity: r1Opacity.value,
    transform: [{ scale: r1Scale.value }],
  }));
  const r2Style = useAnimatedStyle(() => ({
    opacity: r2Opacity.value,
    transform: [{ scale: r2Scale.value }],
  }));
  const r3Style = useAnimatedStyle(() => ({
    opacity: r3Opacity.value,
    transform: [{ scale: r3Scale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      <View style={splashStyles.centerStage}>
        {/* Ripple rings — all absolutely centered */}
        <Animated.View style={[splashStyles.ripple, { width: 180, height: 180, borderRadius: 90 }, r1Style]} />
        <Animated.View style={[splashStyles.ripple, { width: 280, height: 280, borderRadius: 140 }, r2Style]} />
        <Animated.View style={[splashStyles.ripple, { width: 380, height: 380, borderRadius: 190 }, r3Style]} />

        {/* Map pin drops in */}
        <Animated.View style={[splashStyles.pinWrap, pinStyle]}>
          <Ionicons name="location" size={80} color="#7C3AED" />
        </Animated.View>

        {/* Logo replaces the pin */}
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
  centerStage: {
    width: 380,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ripple: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  pinWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    position: "absolute",
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
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
