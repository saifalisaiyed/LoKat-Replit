import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/store";
import { BLACK, GRAY_100, GRAY_105, GRAY_125, GRAY_150, GRAY_280, GRAY_380, GREEN_25, GREEN_500, RED, RED_50, WHITE } from "@/constants/colors.js";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const [name, setName] = useState(profile.name === "Guest" ? "" : profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
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
          <Ionicons name="lock-closed-outline" size={18} color={Colors.light.tint} />
          <Text style={styles.changePwdText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={16} color={GRAY_280} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY_105,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GRAY_105,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    color: WHITE,
    fontFamily: "Archivo_700Bold",
  },
  formSection: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 20,
    gap: 18,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    marginLeft: 2,
  },
  input: {
    backgroundColor: GRAY_100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: GRAY_150,
    fontFamily: "Archivo_400Regular",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: RED_50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: RED,
    flex: 1,
    fontFamily: "Archivo_400Regular",
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: GREEN_25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successText: {
    fontSize: 13,
    color: GREEN_500,
    flex: 1,
    fontFamily: "Archivo_400Regular",
  },
  saveBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: WHITE,
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  changePwdBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 10,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  changePwdText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
});
