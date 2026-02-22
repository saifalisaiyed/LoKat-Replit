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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleSubmit = async () => {
    setError("");
    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Please enter your full name");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
      if (!password.trim() || password.trim().length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields");
        return;
      }
    }
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await login(email.trim(), password.trim());
      } else {
        result = await register(fullName.trim(), phone.trim(), email.trim(), password.trim());
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

  const switchMode = () => {
    setMode(mode === "register" ? "login" : "register");
    setError("");
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
          <Image source={lokatLogo} style={styles.logoImage} />
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            {mode === "register" ? "Create Your Account" : "Log In"}
          </Text>
          <Pressable onPress={switchMode} hitSlop={8}>
            <Text style={styles.headerSubtext}>
              {mode === "register" ? (
                <>Already have an account? <Text style={styles.headerLink}>Log in</Text></>
              ) : (
                <>Don't have an account? <Text style={styles.headerLink}>Sign up</Text></>
              )}
            </Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#B0B0B0"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          )}

          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#B0B0B0"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#B0B0B0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={mode === "register" ? "Min 6 characters" : "Enter your password"}
              placeholderTextColor="#B0B0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === "register" ? "new-password" : "current-password"}
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
        </View>

        <View style={styles.bottomSection}>
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

          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
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
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  headerSection: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  headerLink: {
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
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
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#F8F8FA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    paddingVertical: 16,
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
  bottomSection: {
    marginTop: 24,
    gap: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDDDE0",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: "rgba(0, 0, 0, 0.03)",
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
    paddingHorizontal: 16,
    marginTop: 4,
  },
  termsLink: {
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
});
