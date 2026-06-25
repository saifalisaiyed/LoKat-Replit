import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  BLUE,
  BLUE_A08,
  EMERALD,
  EMERALD_A08,
  GRAY_100,
  GRAY_105,
  GRAY_125,
  GRAY_175,
  GRAY_250,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A08,
  RED,
  RED_25,
  RED_A08,
  WHITE,
} from "@/constants/colors";

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const [locationSharing, setLocationSharing] = useState(true);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.\n\nPlease contact support@lokat.app to request account deletion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          style: "destructive",
          onPress: () => Alert.alert("Support", "Please email support@lokat.app with the subject 'Account Deletion Request'."),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: GRAY_100 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/change-password");
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: PURPLE_A08 }]}>
                <Feather name="lock" size={18} color={PURPLE} />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <Feather name="chevron-right" size={16} color={GRAY_250} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <View style={[styles.iconWrap, { backgroundColor: EMERALD_A08 }]}>
                <Ionicons name="location-outline" size={18} color={EMERALD} />
              </View>
              <View style={styles.menuTextBlock}>
                <Text style={styles.menuText}>Location Sharing</Text>
                <Text style={styles.menuSub}>Required for request fulfillment</Text>
              </View>
              <Switch
                value={locationSharing}
                onValueChange={(v) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocationSharing(v);
                }}
                trackColor={{ false: GRAY_175, true: PURPLE }}
                thumbColor={WHITE}
              />
            </View>
            <View style={styles.menuDivider} />
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: GRAY_100 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Data & Privacy",
                  "LoKat collects your location, request history, and payment data solely to provide the service. We do not sell your data to third parties.\n\nFor full details, see our Terms & Conditions."
                );
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: BLUE_A08 }]}>
                <Feather name="eye" size={18} color={BLUE} />
              </View>
              <Text style={styles.menuText}>Data & Privacy Info</Text>
              <Feather name="chevron-right" size={16} color={GRAY_250} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: RED_25 }]}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.iconWrap, { backgroundColor: RED_A08 }]}>
                <Feather name="trash-2" size={18} color={RED} />
              </View>
              <Text style={[styles.menuText, { color: RED }]}>Delete Account</Text>
              <Feather name="chevron-right" size={16} color={GRAY_250} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Your account data is protected under our Privacy Policy. Last updated February 2026.
        </Text>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_125,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GRAY_105,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Archivo_600SemiBold",
    color: GRAY_850,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: WHITE,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextBlock: {
    flex: 1,
    gap: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Archivo_400Regular",
    color: GRAY_850,
  },
  menuSub: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  menuDivider: {
    height: 1,
    backgroundColor: GRAY_125,
    marginLeft: 60,
  },
  footerNote: {
    marginTop: 24,
    marginHorizontal: 24,
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
