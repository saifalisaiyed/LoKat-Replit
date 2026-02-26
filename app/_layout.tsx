import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, Platform, Animated as RNAnimated } from "react-native";
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

const SPLASH_DURATION = 3800;
const STAGE_SIZE = 300;
const STAGE_CENTER = STAGE_SIZE / 2;
const LOGO_SIZE = 100;
const PARTICLE_COUNT = 32;

function BrandedSplash({ onFinish }: { onFinish: () => void }) {
  // Generate stable particle positions once
  const particleData = React.useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 80 + Math.random() * 110;
      const palette = ["#7C3AED", "#7C3AED", "#9B6EF8", "rgba(255,255,255,0.85)", "#C4B5FD", "#7C3AED"];
      return {
        startX: Math.cos(angle) * radius,
        startY: Math.sin(angle) * radius,
        size: 2.5 + Math.random() * 3.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: Math.floor(Math.random() * 220),
      };
    })
  ).current;

  // RN Animated values for particles (avoids hook-in-loop restriction)
  const particleAnims = React.useRef(
    particleData.map((p) => ({
      x: new RNAnimated.Value(p.startX),
      y: new RNAnimated.Value(p.startY),
      opacity: new RNAnimated.Value(0),
    }))
  ).current;

  // Reanimated for logo, burst, text, screen
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const burstScale = useSharedValue(0.3);
  const burstOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(22);
  const taglineOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. All particles drift inward from their start positions, converging to center
    const particleAnimations = particleData.map((p, i) => {
      const anim = particleAnims[i];
      return RNAnimated.parallel([
        // Position track
        RNAnimated.sequence([
          RNAnimated.delay(p.delay),
          RNAnimated.parallel([
            RNAnimated.timing(anim.x, {
              toValue: 0,
              duration: 1150,
              easing: Easing.out(Easing.quad) as any,
              useNativeDriver: true,
            }),
            RNAnimated.timing(anim.y, {
              toValue: 0,
              duration: 1150,
              easing: Easing.out(Easing.quad) as any,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Opacity track: appear → travel → fade as they arrive
        RNAnimated.sequence([
          RNAnimated.delay(p.delay),
          RNAnimated.timing(anim.opacity, { toValue: 0.9, duration: 200, useNativeDriver: true }),
          RNAnimated.delay(700),
          RNAnimated.timing(anim.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]);
    });

    RNAnimated.parallel(particleAnimations).start();

    // 2. Logo appears when particles converge
    logoOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(1100, withSpring(1, { damping: 10, stiffness: 130 }));

    // 3. Burst ring expands outward at convergence moment
    burstOpacity.value = withDelay(1100, withSequence(
      withTiming(0.9, { duration: 60 }),
      withTiming(0, { duration: 520, easing: Easing.out(Easing.ease) })
    ));
    burstScale.value = withDelay(1100, withTiming(2.4, {
      duration: 580,
      easing: Easing.out(Easing.ease),
    }));

    // 4. Text
    nameOpacity.value = withDelay(1400, withTiming(1, { duration: 450 }));
    nameY.value = withDelay(1400, withSpring(0, { damping: 14, stiffness: 120 }));
    taglineOpacity.value = withDelay(1650, withTiming(1, { duration: 450 }));

    // 5. Fade out
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(onFinish)();
      });
    }, SPLASH_DURATION - 500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [{ scale: burstScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <Animated.View style={[splashStyles.container, containerStyle]}>
      {/* Fixed-size stage — all particles and logo positioned absolutely within it */}
      <View style={splashStyles.stage}>

        {/* Particles — each starts at (STAGE_CENTER + startX/Y), animated to STAGE_CENTER */}
        {particleData.map((p, i) => {
          const anim = particleAnims[i];
          return (
            <RNAnimated.View
              key={i}
              style={{
                position: "absolute",
                left: STAGE_CENTER - p.size / 2,
                top: STAGE_CENTER - p.size / 2,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: anim.opacity,
                transform: [{ translateX: anim.x }, { translateY: anim.y }],
              }}
            />
          );
        })}

        {/* Burst ring — expands from logo size outward */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: STAGE_CENTER - (LOGO_SIZE + 14) / 2,
              top: STAGE_CENTER - (LOGO_SIZE + 14) / 2,
              width: LOGO_SIZE + 14,
              height: LOGO_SIZE + 14,
              borderRadius: (LOGO_SIZE + 14) / 2,
              borderWidth: 2,
              borderColor: "#7C3AED",
            },
            burstStyle,
          ]}
        />

        {/* Logo — revealed when particles converge */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: STAGE_CENTER - LOGO_SIZE / 2,
              top: STAGE_CENTER - LOGO_SIZE / 2,
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              borderRadius: LOGO_SIZE / 2,
              overflow: "hidden",
              backgroundColor: "#2D1B69",
            },
            logoStyle,
          ]}
        >
          <Image source={lokatLogo} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />
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
  stage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    marginBottom: 16,
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
