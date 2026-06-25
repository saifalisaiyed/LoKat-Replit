import React from "react";
import { useChangePasswordForm } from "@/hooks/useChangePasswordForm";
import { View, Text, Pressable, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import {
  BLACK,
  GRAY_100,
  GRAY_105,
  GRAY_125,
  GRAY_150,
  GRAY_380,
  GRAY_600,
  GRAY_850,
  GREEN_25,
  GREEN_500,
  PURPLE,
  PURPLE_50,
  RED,
  RED_50,
  WHITE,
} from "@/constants/colors";

import styles from "./change-password.styles";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { changePassword } = useApp();
  const {
    currentPwd, setCurrentPwd,
    newPwd, setNewPwd,
    confirmPwd, setConfirmPwd,
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    loading, setLoading,
    error, setError,
    success, setSuccess,
  } = useChangePasswordForm();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const canSubmit = currentPwd.length >= 6 && newPwd.length >= 6 && confirmPwd.length >= 6;

  const handleSave = async () => {
    setError("");
    if (newPwd !== confirmPwd) {
      setError("New passwords do not match");
      return;
    }
    if (newPwd.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPwd === currentPwd) {
      setError("New password must be different from current password");
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(currentPwd, newPwd);
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        setTimeout(() => router.back(), 1200);
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={GRAY_850} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconSection}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={28} color={PURPLE} />
          </View>
          <Text style={styles.description}>
            Enter your current password and choose a new one
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter current password"
                placeholderTextColor={GRAY_380}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={8}>
                <Ionicons name={showCurrent ? "eye-off" : "eye"} size={20} color={GRAY_380} />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="At least 6 characters"
                placeholderTextColor={GRAY_380}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowNew(!showNew)} hitSlop={8}>
                <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color={GRAY_380} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor={GRAY_380}
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={16} color={GREEN_500} />
            <Text style={styles.successText}>Password changed successfully</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            (!canSubmit || loading) && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
