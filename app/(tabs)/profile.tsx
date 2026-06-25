import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Platform, Linking, Alert } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import AuthPromptModal from "@/components/AuthPromptModal";
import {
  GRAY_100,
  GRAY_105,
  GRAY_125,
  GRAY_145,
  GRAY_150,
  GRAY_250,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A06,
  PURPLE_A08,
  PURPLE_A19,
  RED,
  RED_100,
  WHITE,
} from "@/constants/colors";

import styles from "./profile.styles";

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
            <Ionicons name="person-outline" size={28} color={GRAY_600} />
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
            <Feather name="settings" size={20} color={GRAY_850} />
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
            <Feather name="edit-2" size={14} color={PURPLE} />
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
          <Text style={[styles.statNumber, { color: PURPLE }]}>
            ${profile.earnings.toFixed(0)}
          </Text>
          <Text style={styles.statDesc}>Earned</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsIconWrap}>
              <Ionicons name="wallet-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.earningsHeaderText}>
              <Text style={styles.earningsTitle}>Wallet</Text>
              <Text style={styles.earningsSubtitle}>Available balance</Text>
            </View>
            <Text style={styles.earningsAmount}>${profile.earnings.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsActions}>
            <Pressable
              style={({ pressed }) => [styles.earningsActionBtn, pressed && { backgroundColor: GRAY_100 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/payment-methods");
              }}
            >
              <Feather name="download" size={16} color={PURPLE} />
              <Text style={styles.earningsActionText}>Withdraw</Text>
            </Pressable>
            <View style={styles.earningsActionDivider} />
            <Pressable
              style={({ pressed }) => [styles.earningsActionBtn, pressed && { backgroundColor: GRAY_100 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/transaction-history");
              }}
            >
              <Feather name="clock" size={16} color={GRAY_600} />
              <Text style={[styles.earningsActionText, { color: GRAY_600 }]}>History</Text>
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
                pressed && { backgroundColor: GRAY_100 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/admin");
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: PURPLE_A08 }]}>
                <Feather name="shield" size={18} color={PURPLE} />
              </View>
              <Text style={styles.menuItemText}>Admin Panel</Text>
              <Feather name="chevron-right" size={16} color={GRAY_250} />
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={16} color={RED} />
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
        pressed && { backgroundColor: GRAY_100 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.menuIconWrap}>
        <Feather name={icon as any} size={18} color={GRAY_600} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      <Feather name="chevron-right" size={16} color={GRAY_250} />
    </Pressable>
  );
}
