import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";
import {
  BLACK,
  BLACK_A50,
  GRAY_100,
  GRAY_200,
  GRAY_600,
  GRAY_850,
  PURPLE,
  WHITE,
} from "@/constants/colors";

import styles from "./AuthPromptModal.styles";

export type AuthPromptContext =
  | "create-request"
  | "claim-request"
  | "profile"
  | "general";

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  context?: AuthPromptContext;
}

const CONTEXT_CONFIG: Record<
  AuthPromptContext,
  { icon: string; title: string; subtitle: string; features: { icon: string; text: string }[] }
> = {
  "create-request": {
    icon: "camera-outline",
    title: "Request Photos Anywhere",
    subtitle: "Create an account to drop pins and request photos from LoKaters near your chosen location.",
    features: [
      { icon: "location-outline", text: "Pin any location on the map" },
      { icon: "images-outline", text: "Get photos with your exact specs" },
      { icon: "shield-checkmark-outline", text: "Secure payments & refunds" },
    ],
  },
  "claim-request": {
    icon: "walk-outline",
    title: "Start Earning as a LoKater",
    subtitle: "Sign up to claim photo requests near you and earn money for every completed shot.",
    features: [
      { icon: "cash-outline", text: "Earn rewards for each photo" },
      { icon: "navigate-outline", text: "Find requests near you" },
      { icon: "star-outline", text: "Build your reputation" },
    ],
  },
  profile: {
    icon: "person-outline",
    title: "Unlock Your Profile",
    subtitle: "Sign in to track your requests, earnings, and build your reputation.",
    features: [
      { icon: "wallet-outline", text: "Manage earnings & payments" },
      { icon: "stats-chart-outline", text: "Track your activity" },
      { icon: "notifications-outline", text: "Get real-time updates" },
    ],
  },
  general: {
    icon: "sparkles-outline",
    title: "Join LoKat",
    subtitle: "Create a free account to unlock all features and start requesting or taking photos.",
    features: [
      { icon: "camera-outline", text: "Request or take photos" },
      { icon: "cash-outline", text: "Earn or spend on your terms" },
      { icon: "people-outline", text: "Join our community" },
    ],
  },
};

export default function AuthPromptModal({
  visible,
  onClose,
  context = "general",
}: AuthPromptModalProps) {
  const config = CONTEXT_CONFIG[context];
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(400, { duration: 250 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => router.push("/auth"), 150);
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.iconCircle}>
            <Ionicons name={config.icon as any} size={28} color={WHITE} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          <View style={styles.featuresContainer}>
            {config.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon as any} size={18} color={PURPLE} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signUpBtn,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpBtnText}>Create Free Account</Text>
            <Ionicons name="arrow-forward" size={18} color={WHITE} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleSignUp}
          >
            <Text style={styles.loginBtnText}>Already have an account? <Text style={styles.loginBtnTextBold}>Log In</Text></Text>
          </Pressable>

          <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Continue browsing</Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </View>
    </Modal>
  );
}
