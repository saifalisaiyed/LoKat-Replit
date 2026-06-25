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
  GRAY_200,
  GRAY_380,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A08,
  RED,
  RED_50,
  WHITE,
} from "@/constants/colors";

import styles from "@/styles/onboarding/name";

export default function OnboardingName() {
  const insets = useSafeAreaInsets();
  const { updateProfile } = useApp();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleContinue = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await updateProfile({ displayName: name.trim() });
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/onboarding/email");
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
    router.replace("/onboarding/email");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60 + webInsetTop, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressDotActive} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name="person-outline" size={32} color={PURPLE} />
        </View>

        <Text style={styles.title}>{"What's your name?"}</Text>
        <Text style={styles.subtitle}>This is how other users will see you on LoKat</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={GRAY_380}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
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
            <Text style={styles.continueBtnText}>Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
