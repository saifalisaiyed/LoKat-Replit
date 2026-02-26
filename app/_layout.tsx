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

const SPLASH_DURATION = 3600;
const IRIS_SIZE = 1200; // large enough to cover screen diagonal on any device
const LOGO_SIZE = 110;

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  // Iris overlay — dark circle that contracts, revealing content beneath
  const irisScale = useSharedValue(1);

  // Logo — fades/focuses in as the iris opens
  const logoScale = useSharedValue(0.82);
  const logoOpacity = useSharedValue(0);

  // Lens aperture ring — faint circle that appears around logo after iris opens
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.7);

  // Brief white lens-flash at the moment iris fully opens
  const flashOpacity = useSharedValue(0);

  // Location pin — pulses once below the logo
  const pinScale = useSharedValue(0);
  const pinOpacity = useSharedValue(0);

  // Text
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(22);
  const taglineOpacity = useSharedValue(0);

  // Screen fade-out
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Iris contracts — dark aperture opens to reveal logo
    irisScale.value = withTiming(0, {
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // 2. Logo focuses into view as iris opens
    logoOpacity.value = withDelay(150, withTiming(1, { duration: 700 }));
    logoScale.value = withDelay(150, withSpring(1, { damping: 14, stiffness: 100 }));

    // 3. Aperture ring appears around logo as iris finishes
    ringOpacity.value = withDelay(900, withTiming(0.35, { duration: 400 }));
    ringScale.value = withDelay(900, withSpring(1, { damping: 12, stiffness: 120 }));

    // 4. Lens flash at the snap point
    flashOpacity.value = withDelay(950, withSequence(
      withTiming(0.55, { duration: 60 }),
      withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) })
    ));

    // 5. Location pin drops in below logo with a bounce
    pinOpacity.value = withDelay(1050, withTiming(1, { duration: 200 }));
    pinScale.value = withDelay(1050, withSpring(1, { damping: 6, stiffness: 180 }));

    // 6. App name slides up
    nameOpacity.value = withDelay(1180, withTiming(1, { duration: 450 }));
    nameY.value = withDelay(1180, withSpring(0, { damping: 14, stiffness: 120 }));

    // 7. Tagline fades in
    taglineOpacity.value = withDelay(1400, withTiming(1, { duration: 450 }));

    // 8. Fade out
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const irisStyle = useAnimatedStyle(() => ({ transform: [{ scale: irisScale.value }] }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinOpacity.value,
    transform: [{ scale: pinScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>

      {/* Content: logo + pin + text — revealed as iris opens */}
      <View style={splashStyles.centerStage}>
        {/* Aperture ring around logo */}
        <Animated.View style={[splashStyles.apertureRing, ringStyle]} />

        {/* Logo */}
        <Animated.View style={[splashStyles.logoWrap, logoStyle]}>
          <Image source={lokatLogo} style={splashStyles.logoImage} />
        </Animated.View>

        {/* Location pin below logo */}
        <Animated.View style={[splashStyles.pinWrap, pinStyle]}>
          <Ionicons name="location" size={30} color="#7C3AED" />
        </Animated.View>
      </View>

      <Animated.Text style={[splashStyles.appName, nameStyle]}>
        LoKat
      </Animated.Text>
      <Animated.Text style={[splashStyles.tagline, taglineStyle]}>
        Seek the Moment. Anywhere, Anytime.
      </Animated.Text>

      {/* Iris overlay — rendered on top so it hides content until it opens */}
      <View style={splashStyles.irisContainer}>
        <Animated.View style={[splashStyles.iris, irisStyle]} />
      </View>

      {/* Lens flash — on top of everything */}
      <Animated.View style={[splashStyles.flash, flashStyle]} pointerEvents="none" />
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
    alignItems: "center",
    marginBottom: 32,
  },
  apertureRing: {
    position: "absolute",
    width: LOGO_SIZE + 28,
    height: LOGO_SIZE + 28,
    borderRadius: (LOGO_SIZE + 28) / 2,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.5)",
    top: -14,
    left: -14,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#2D1B69",
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  pinWrap: {
    marginTop: 10,
    alignItems: "center",
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
  irisContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  iris: {
    width: IRIS_SIZE,
    height: IRIS_SIZE,
    borderRadius: IRIS_SIZE / 2,
    backgroundColor: "#0A0F1C",
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
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
