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
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/store";

const lokatLogo = require("@/assets/images/lokat-logo.png");

function GoogleLogo() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "700" }}>
        <Text style={{ color: "#4285F4" }}>G</Text>
      </Text>
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleSubmit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (mode === "register" && password.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await login(username.trim(), password.trim());
      } else {
        result = await register(username.trim(), password.trim(), displayName.trim() || undefined);
      }
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError("Google sign-in coming soon");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24 + webInsetTop, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image source={lokatLogo} style={styles.logoImage} />
          </View>
          <Text style={styles.appName}>LoKat</Text>
          <Text style={styles.tagline}>
            {mode === "register" ? "Create your account" : "Welcome back"}
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => { setMode("register"); setError(""); }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Sign Up
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => { setMode("login"); setError(""); }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Log In
              </Text>
            </Pressable>
          </View>

          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="What should we call you?"
                placeholderTextColor="#B0B0B0"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor="#B0B0B0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={mode === "register" ? "Min 6 characters" : "Enter password"}
              placeholderTextColor="#B0B0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "register" ? "Create Account" : "Log In"}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleGoogleSignIn}
          >
            <GoogleLogo />
            <Text style={styles.googleBtnText}>
              {mode === "register" ? "Sign up with Google" : "Log in with Google"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.guestBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSkip}
          >
            <Ionicons name="eye-outline" size={18} color={Colors.light.textSecondary} />
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </Pressable>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  appName: {
    fontSize: 28,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "Archivo_400Regular",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    padding: 3,
    marginBottom: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  tabTextActive: {
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    fontFamily: "Archivo_400Regular",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
    fontFamily: "Archivo_400Regular",
  },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EBEBEB",
  },
  dividerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
  },
  googleBtnText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F7",
  },
  guestBtnText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  termsText: {
    fontSize: 11,
    color: "#B0B0B0",
    textAlign: "center",
    fontFamily: "Archivo_400Regular",
    lineHeight: 16,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  termsLink: {
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
});
