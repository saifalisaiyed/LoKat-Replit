import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/store";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { changePassword } = useApp();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
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
            <Ionicons name="lock-closed" size={28} color={Colors.light.tint} />
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
                placeholderTextColor="#B0B0B0"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={8}>
                <Ionicons name={showCurrent ? "eye-off" : "eye"} size={20} color="#B0B0B0" />
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
                placeholderTextColor="#B0B0B0"
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowNew(!showNew)} hitSlop={8}>
                <Ionicons name={showNew ? "eye-off" : "eye"} size={20} color="#B0B0B0" />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#B0B0B0"
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
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
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
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F2",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, color: Colors.light.text, fontFamily: "Archivo_600SemiBold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  iconSection: { alignItems: "center", marginBottom: 28, gap: 12 },
  lockCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#F3EEFF", alignItems: "center", justifyContent: "center",
  },
  description: {
    fontSize: 14, color: Colors.light.textSecondary, textAlign: "center",
    fontFamily: "Archivo_400Regular", maxWidth: 260,
  },
  formSection: {
    backgroundColor: "#fff", borderRadius: 18, padding: 20, gap: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13, color: Colors.light.textSecondary, fontFamily: "Archivo_500Medium", marginLeft: 2,
  },
  input: {
    backgroundColor: "#F8F8FA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: Colors.light.text, borderWidth: 1, borderColor: "#EBEBEB",
    fontFamily: "Archivo_400Regular",
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8F8FA", borderRadius: 12, borderWidth: 1, borderColor: "#EBEBEB",
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15,
    color: Colors.light.text, fontFamily: "Archivo_400Regular",
  },
  divider: { height: 1, backgroundColor: "#F0F0F2" },
  errorRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  errorText: { fontSize: 13, color: "#EF4444", flex: 1, fontFamily: "Archivo_400Regular" },
  successRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16,
    backgroundColor: "#F0FDF4", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  successText: { fontSize: 13, color: "#22C55E", flex: 1, fontFamily: "Archivo_400Regular" },
  saveBtn: {
    backgroundColor: Colors.light.tint, paddingVertical: 16, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 24,
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Archivo_600SemiBold" },
});
