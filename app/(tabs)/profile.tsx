import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import AuthPromptModal from "@/components/AuthPromptModal";

function GuestProfileView({ onSignUp }: { onSignUp: () => void }) {
  const insets = useSafeAreaInsets();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[guestStyles.container, { paddingTop: insets.top + 20 + webInsetTop }]}>
      <View style={guestStyles.content}>
        <View style={guestStyles.iconContainer}>
          <View style={guestStyles.iconCircle}>
            <Ionicons name="person-outline" size={32} color="#fff" />
          </View>
          <View style={guestStyles.iconGlow} />
        </View>

        <Text style={guestStyles.title}>Your LoKat Profile</Text>
        <Text style={guestStyles.subtitle}>
          Sign in to track your requests, manage earnings, and build your reputation as a Seeker or LoKater.
        </Text>

        <View style={guestStyles.featureCards}>
          <View style={guestStyles.featureCard}>
            <View style={[guestStyles.featureIcon, { backgroundColor: "rgba(124, 58, 237, 0.1)" }]}>
              <Ionicons name="camera-outline" size={20} color={Colors.light.tint} />
            </View>
            <View style={guestStyles.featureInfo}>
              <Text style={guestStyles.featureTitle}>Request Photos</Text>
              <Text style={guestStyles.featureDesc}>Drop pins and get photos from anywhere</Text>
            </View>
          </View>
          <View style={guestStyles.featureDivider} />
          <View style={guestStyles.featureCard}>
            <View style={[guestStyles.featureIcon, { backgroundColor: "rgba(249, 115, 22, 0.1)" }]}>
              <Ionicons name="wallet-outline" size={20} color={Colors.light.orange} />
            </View>
            <View style={guestStyles.featureInfo}>
              <Text style={guestStyles.featureTitle}>Earn Money</Text>
              <Text style={guestStyles.featureDesc}>Fulfill requests and get paid</Text>
            </View>
          </View>
          <View style={guestStyles.featureDivider} />
          <View style={guestStyles.featureCard}>
            <View style={[guestStyles.featureIcon, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
              <Ionicons name="star-outline" size={20} color="#22C55E" />
            </View>
            <View style={guestStyles.featureInfo}>
              <Text style={guestStyles.featureTitle}>Build Reputation</Text>
              <Text style={guestStyles.featureDesc}>Grow your ratings and unlock perks</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            guestStyles.signUpBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={onSignUp}
        >
          <Text style={guestStyles.signUpBtnText}>Create Free Account</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            guestStyles.loginBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={onSignUp}
        >
          <Text style={guestStyles.loginText}>
            Already have an account? <Text style={guestStyles.loginTextBold}>Log In</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, logout, isAuthenticated } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [authPromptVisible, setAuthPromptVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated) {
    return (
      <>
        <GuestProfileView onSignUp={() => router.push("/auth")} />
        <AuthPromptModal
          visible={authPromptVisible}
          onClose={() => setAuthPromptVisible(false)}
          context="profile"
        />
      </>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 94 + 34 : insets.bottom + 96,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 + webInsetTop }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.settingsBtn} hitSlop={8}>
            <Feather name="settings" size={20} color={Colors.light.text} />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.subtitle}>New York, NY</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Feather name="edit-2" size={14} color={Colors.light.tint} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.requestsCreated}</Text>
          <Text style={styles.statDesc}>Requests</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.requestsFulfilled}</Text>
          <Text style={styles.statDesc}>Fulfilled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors.light.tint }]}>
            ${profile.earnings.toFixed(0)}
          </Text>
          <Text style={styles.statDesc}>Earned</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsIconWrap}>
              <Ionicons name="wallet-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.earningsHeaderText}>
              <Text style={styles.earningsTitle}>Wallet</Text>
              <Text style={styles.earningsSubtitle}>Available balance</Text>
            </View>
            <Text style={styles.earningsAmount}>${profile.earnings.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsActions}>
            <Pressable style={styles.earningsActionBtn}>
              <Feather name="download" size={16} color={Colors.light.tint} />
              <Text style={styles.earningsActionText}>Withdraw</Text>
            </Pressable>
            <View style={styles.earningsActionDivider} />
            <Pressable style={styles.earningsActionBtn}>
              <Feather name="clock" size={16} color={Colors.light.textSecondary} />
              <Text style={[styles.earningsActionText, { color: Colors.light.textSecondary }]}>History</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="credit-card" label="Payment Methods" />
          <View style={styles.menuDivider} />
          <MenuItem icon="bell" label="Notifications" />
          <View style={styles.menuDivider} />
          <MenuItem icon="shield" label="Privacy & Security" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="help-circle" label="Help Center" />
          <View style={styles.menuDivider} />
          <MenuItem icon="message-circle" label="Contact Us" />
          <View style={styles.menuDivider} />
          <MenuItem icon="file-text" label="Terms & Conditions" />
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={16} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: "#F8F8FA" },
      ]}
    >
      <View style={styles.menuIconWrap}>
        <Feather name={icon as any} size={18} color={Colors.light.textSecondary} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      <Feather name="chevron-right" size={16} color="#D0D0D0" />
    </Pressable>
  );
}

const guestStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  iconContainer: {
    marginBottom: 24,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  iconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  featureCards: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 4,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  featureDivider: {
    height: 1,
    backgroundColor: "#F3F3F5",
    marginLeft: 56,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  signUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  loginBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  loginTextBold: {
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: "#fff",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.19)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  statDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EBEBEB",
    alignSelf: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  earningsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsHeaderText: {
    flex: 1,
    gap: 1,
  },
  earningsTitle: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  earningsSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  earningsAmount: {
    fontSize: 22,
    color: Colors.light.tint,
    fontFamily: "Archivo_700Bold",
  },
  earningsActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F2",
  },
  earningsActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  earningsActionText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
  earningsActionDivider: {
    width: 1,
    backgroundColor: "#F0F0F2",
  },
  menuGroup: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F2",
    marginLeft: 58,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 14,
    color: "#EF4444",
    fontFamily: "Archivo_500Medium",
  },
});
