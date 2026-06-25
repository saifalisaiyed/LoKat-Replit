import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import AuthPromptModal from "@/components/AuthPromptModal";

function formatMemberSince(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, logout, isAuthenticated, user } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [authPromptVisible, setAuthPromptVisible] = useState(false);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const handleContactUs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:support@lokat.app?subject=LoKat Support").catch(() => {
      Alert.alert("Contact Us", "Email us at support@lokat.app");
    });
  };

  const memberSince = formatMemberSince(profile.createdAt);

  if (!isAuthenticated) {
    return (
      <View style={[styles.guestContainer, { paddingTop: insets.top + 20 + webInsetTop }]}>
        <View style={styles.guestContent}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={28} color={Colors.light.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>Sign in to view your profile</Text>
          <Text style={styles.guestSubtitle}>Track requests, earnings, and manage your account</Text>
          <Pressable
            style={({ pressed }) => [
              styles.guestSignInBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.guestSignInText}>Sign In or Sign Up</Text>
          </Pressable>
        </View>
        <AuthPromptModal
          visible={authPromptVisible}
          onClose={() => setAuthPromptVisible(false)}
          context="profile"
        />
      </View>
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
          <Pressable
            style={styles.settingsBtn}
            hitSlop={8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/edit-profile");
            }}
          >
            <Feather name="settings" size={20} color={Colors.light.text} />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.subtitle}>{profile.email || profile.phone || "Add your details"}</Text>
            {memberSince && (
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            )}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/edit-profile");
            }}
          >
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
            <Pressable
              style={({ pressed }) => [styles.earningsActionBtn, pressed && { backgroundColor: "#F8F8FA" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/payment-methods");
              }}
            >
              <Feather name="download" size={16} color={Colors.light.tint} />
              <Text style={styles.earningsActionText}>Withdraw</Text>
            </Pressable>
            <View style={styles.earningsActionDivider} />
            <Pressable
              style={({ pressed }) => [styles.earningsActionBtn, pressed && { backgroundColor: "#F8F8FA" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/transaction-history");
              }}
            >
              <Feather name="clock" size={16} color={Colors.light.textSecondary} />
              <Text style={[styles.earningsActionText, { color: Colors.light.textSecondary }]}>History</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="credit-card"
            label="Payment Methods"
            onPress={() => router.push("/payment-methods")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="bell"
            label="Notifications"
            onPress={() => router.push("/(tabs)/notifications")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="shield"
            label="Privacy & Security"
            onPress={() => router.push("/privacy-security")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="message-square"
            label="Send Feedback"
            onPress={() => router.push("/feedback")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="message-circle"
            label="Contact Us"
            onPress={handleContactUs}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="file-text"
            label="Terms & Conditions"
            onPress={() => router.push("/terms")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
        </View>
      </View>

      {user?.isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Admin</Text>
          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: "#F8F8FA" },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin");
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "rgba(124, 58, 237, 0.08)" }]}>
                <Feather name="shield" size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.menuItemText}>Admin Panel</Text>
              <Feather name="chevron-right" size={16} color="#D0D0D0" />
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={16} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: "#F8F8FA" },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.menuIconWrap}>
        <Feather name={icon as any} size={18} color={Colors.light.textSecondary} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      <Feather name="chevron-right" size={16} color="#D0D0D0" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  guestContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#ECECEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
    textAlign: "center",
    marginBottom: 6,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  guestSignInBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  guestSignInText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_600SemiBold",
  },
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
    borderRadius: 12,
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
    borderRadius: 14,
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
  memberSince: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    marginTop: 1,
    opacity: 0.7,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
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
    borderRadius: 12,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
