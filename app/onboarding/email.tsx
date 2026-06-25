import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import {
  BLACK,
  GRAY_105,
  GRAY_150,
  GRAY_380,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A08,
  RED,
  RED_50,
  WHITE,
} from "@/constants/colors";

import styles from "@/styles/onboarding/email";

export default function OnboardingEmail() {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleContinue = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await updateProfile({ email: email.trim() });
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60 + webInsetTop, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressDotDone} />
          <View style={styles.progressDotActive} />
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={32} color={PURPLE} />
        </View>

        <Text style={styles.title}>Add your email</Text>
        <Text style={styles.subtitle}>{"We'll use this for receipts and account recovery. You can also log in with it later."}</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={GRAY_380}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.spacer} />

        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.continueBtnText}>Get Started</Text>
          )}
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
