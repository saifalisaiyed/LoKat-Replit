import React, { useEffect, useRef } from "react";
import { useEditProfileForm } from "@/hooks/useEditProfileForm";
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
  GRAY_280,
  GRAY_380,
  GRAY_600,
  GRAY_850,
  GREEN_25,
  GREEN_500,
  PURPLE,
  RED,
  RED_50,
  WHITE,
} from "@/constants/colors";

import styles from "./edit-profile.styles";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const {
    name, setName,
    email, setEmail,
    phone, setPhone,
    loading, setLoading,
    error, setError,
    success, setSuccess,
  } = useEditProfileForm({
    initialName: profile.name === "Guest" ? "" : profile.name,
    initialEmail: profile.email,
    initialPhone: profile.phone,
  });
  const initialized = useRef(false);

  // Sync profile into fields once the real user data loads (useState initializer
  // runs only once — if profile was still "Guest" on mount, fields stay empty)
  useEffect(() => {
    if (!initialized.current && profile.name !== "Guest") {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
      initialized.current = true;
    }
  }, [profile]);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const hasChanges =
    name.trim() !== (profile.name === "Guest" ? "" : profile.name) ||
    email.trim().toLowerCase() !== profile.email.toLowerCase() ||
    phone.trim() !== profile.phone;

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address");
        return;
      }
    }

    const updates: { displayName?: string; email?: string; phone?: string } = {};
    if (name.trim() !== profile.name) updates.displayName = name.trim();
    if (email.trim().toLowerCase() !== profile.email.toLowerCase()) updates.email = email.trim();
    if (phone.trim() !== profile.phone) updates.phone = phone.trim();

    if (Object.keys(updates).length === 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(updates);
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        setTimeout(() => router.back(), 800);
      } else {
        setError(result.error || "Failed to update profile");
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
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={GRAY_850} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={GRAY_380}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Add your email"
              placeholderTextColor={GRAY_380}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Add your phone number"
              placeholderTextColor={GRAY_380}
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9+\- ]/g, "");
                setPhone(cleaned);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
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
            <Text style={styles.successText}>Profile updated</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            (!hasChanges || loading) && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.changePwdBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push("/change-password")}
        >
          <Ionicons name="lock-closed-outline" size={18} color={PURPLE} />
          <Text style={styles.changePwdText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={16} color={GRAY_280} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
