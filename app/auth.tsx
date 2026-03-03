import React, { useState, useRef } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";

const lokatLogo = require("@/assets/images/lokat-logo.png");

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
];

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
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const phoneInputRef = useRef<TextInput>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState<"email" | "code">("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpOTP, setFpOTP] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFpPassword, setShowFpPassword] = useState(false);

  const openForgot = () => {
    setFpStep("email");
    setFpEmail(email);
    setFpOTP("");
    setFpNewPassword("");
    setFpError("");
    setFpSuccess(false);
    setShowForgot(true);
  };

  const handleForgotSend = async () => {
    setFpError("");
    if (!fpEmail.trim()) { setFpError("Please enter your email."); return; }
    setFpLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFpError(d.message || "Something went wrong.");
      } else {
        setFpStep("code");
      }
    } catch {
      setFpError("Network error. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleForgotReset = async () => {
    setFpError("");
    if (!fpOTP.trim()) { setFpError("Enter the 6-digit code."); return; }
    if (!fpNewPassword.trim() || fpNewPassword.trim().length < 6) { setFpError("Password must be at least 6 characters."); return; }
    setFpLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase(), otp: fpOTP.trim(), newPassword: fpNewPassword.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFpError(d.message || "Something went wrong.");
      } else {
        setFpSuccess(true);
      }
    } catch {
      setFpError("Network error. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  const handleSubmit = async () => {
    setError("");
    if (mode === "register") {
      if (!phone.trim()) {
        setError("Please enter your phone number");
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
        const fullPhone = selectedCountry.code + phone.trim().replace(/^0+/, "");
        result = await register(fullPhone, password.trim());
      }
      if (result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (mode === "register") {
          router.replace("/onboarding/name");
        } else {
          router.replace("/(tabs)");
        }
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

  const selectCountry = (country: (typeof COUNTRY_CODES)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setCountrySearch("");
    setTimeout(() => phoneInputRef.current?.focus(), 100);
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
            {mode === "register" ? "Create Your Account" : "Welcome Back"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode === "register"
              ? "Sign up with your phone number to get started"
              : "Log in to your account"}
          </Text>
        </View>

        <View style={styles.formCard}>
          {mode === "register" ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.countryCodeBtn,
                    pressed && { backgroundColor: "#EFEFEF" },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCountryPicker(true);
                  }}
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                  <Ionicons name="chevron-down" size={14} color="#999" />
                </Pressable>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInput}
                  placeholder="555 123 4567"
                  placeholderTextColor="#B0B0B0"
                  value={phone}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9 ]/g, "");
                    setPhone(cleaned);
                  }}
                  keyboardType="number-pad"
                  autoComplete="tel"
                />
              </View>
            </View>
          ) : (
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
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={mode === "register" ? "Min 6 characters" : "Enter your password"}
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </Pressable>
            </View>
          </View>

          {mode === "login" && (
            <Pressable onPress={openForgot} hitSlop={8} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          )}

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
                {mode === "register" ? "Sign Up" : "Log In"}
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

          <Pressable onPress={switchMode} hitSlop={8} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === "register" ? (
                <>Already have an account? <Text style={styles.switchLink}>Log in</Text></>
              ) : (
                <>Don't have an account? <Text style={styles.switchLink}>Sign up</Text></>
              )}
            </Text>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCountryPicker(false);
          setCountrySearch("");
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setShowCountryPicker(false);
              setCountrySearch("");
            }}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Country</Text>

            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={18} color="#999" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="#B0B0B0"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
              style={styles.countryList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.countryRow,
                    pressed && { backgroundColor: "#F3F0FF" },
                    item.code === selectedCountry.code &&
                      item.name === selectedCountry.name &&
                      styles.countryRowSelected,
                  ]}
                  onPress={() => selectCountry(item)}
                >
                  <Text style={styles.countryRowFlag}>{item.flag}</Text>
                  <Text style={styles.countryRowName}>{item.name}</Text>
                  <Text style={styles.countryRowCode}>{item.code}</Text>
                  {item.code === selectedCountry.code &&
                    item.name === selectedCountry.name && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.light.tint} />
                    )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showForgot} animationType="slide" transparent onRequestClose={() => setShowForgot(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowForgot(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            {fpSuccess ? (
              <>
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(124,58,237,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Ionicons name="checkmark-circle" size={32} color={Colors.light.tint} />
                  </View>
                  <Text style={[styles.modalTitle, { marginBottom: 8 }]}>Password reset!</Text>
                  <Text style={{ color: "#888", textAlign: "center", fontSize: 14, fontFamily: "Archivo_400Regular" }}>
                    Your password has been updated. You can now log in.
                  </Text>
                </View>
                <Pressable style={[styles.submitBtn, { marginTop: 8 }]} onPress={() => setShowForgot(false)}>
                  <Text style={styles.submitBtnText}>Back to Login</Text>
                </Pressable>
              </>
            ) : fpStep === "email" ? (
              <>
                <Text style={styles.modalTitle}>Forgot password</Text>
                <Text style={{ color: "#888", fontSize: 14, fontFamily: "Archivo_400Regular", marginBottom: 20 }}>
                  Enter your email and we'll send you a reset code.
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#B0B0B0"
                    value={fpEmail}
                    onChangeText={setFpEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {fpError ? (
                  <View style={[styles.errorRow, { marginBottom: 8 }]}>
                    <Ionicons name="alert-circle" size={15} color="#EF4444" />
                    <Text style={styles.errorText}>{fpError}</Text>
                  </View>
                ) : null}
                <Pressable style={[styles.submitBtn, fpLoading && { opacity: 0.7 }]} onPress={handleForgotSend} disabled={fpLoading}>
                  {fpLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Send code</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Enter your code</Text>
                <Text style={{ color: "#888", fontSize: 14, fontFamily: "Archivo_400Regular", marginBottom: 20 }}>
                  We sent a 6-digit code to {fpEmail}. Enter it below along with your new password.
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reset code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="#B0B0B0"
                    value={fpOTP}
                    onChangeText={setFpOTP}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Min 6 characters"
                      placeholderTextColor="#B0B0B0"
                      value={fpNewPassword}
                      onChangeText={setFpNewPassword}
                      secureTextEntry={!showFpPassword}
                    />
                    <Pressable
                      onPress={() => setShowFpPassword((v) => !v)}
                      style={styles.eyeBtn}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showFpPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                      />
                    </Pressable>
                  </View>
                </View>
                {fpError ? (
                  <View style={[styles.errorRow, { marginBottom: 8 }]}>
                    <Ionicons name="alert-circle" size={15} color="#EF4444" />
                    <Text style={styles.errorText}>{fpError}</Text>
                  </View>
                ) : null}
                <Pressable style={[styles.submitBtn, fpLoading && { opacity: 0.7 }]} onPress={handleForgotReset} disabled={fpLoading}>
                  {fpLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Reset password</Text>}
                </Pressable>
                <Pressable onPress={() => setFpStep("email")} hitSlop={8} style={{ alignItems: "center", marginTop: 12 }}>
                  <Text style={styles.forgotText}>Resend code</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    ...(Platform.OS === "web" ? { maxWidth: 480, alignSelf: "center" as const, width: "100%" as any } : {}),
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
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
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    fontFamily: "Archivo_400Regular",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8F8FA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#F8F8FA",
    borderRadius: 10,
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
    borderRadius: 8,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  guestBtnText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  forgotRow: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
  switchRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  switchLink: {
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
    textAlign: "center",
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
  },
  countryList: {
    flex: 1,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  countryRowSelected: {
    backgroundColor: "rgba(124, 58, 237, 0.04)",
  },
  countryRowFlag: {
    fontSize: 22,
  },
  countryRowName: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
  },
  countryRowCode: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    marginRight: 4,
  },
});
