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
import Colors from "@/constants/colors";

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
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: "#F8F8FA" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/change-password");
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: "rgba(124,58,237,0.08)" }]}>
                <Feather name="lock" size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <Feather name="chevron-right" size={16} color="#D0D0D0" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(16,185,129,0.08)" }]}>
                <Ionicons name="location-outline" size={18} color="#10B981" />
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
                trackColor={{ false: "#E5E5EA", true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.menuDivider} />
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: "#F8F8FA" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Data & Privacy",
                  "LoKat collects your location, request history, and payment data solely to provide the service. We do not sell your data to third parties.\n\nFor full details, see our Terms & Conditions."
                );
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: "rgba(59,130,246,0.08)" }]}>
                <Feather name="eye" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.menuText}>Data & Privacy Info</Text>
              <Feather name="chevron-right" size={16} color="#D0D0D0" />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: "#FFF5F5" }]}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.iconWrap, { backgroundColor: "rgba(239,68,68,0.08)" }]}>
                <Feather name="trash-2" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: "#EF4444" }]}>Delete Account</Text>
              <Feather name="chevron-right" size={16} color="#D0D0D0" />
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
    backgroundColor: "#F5F5F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F2",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Archivo_600SemiBold",
    color: Colors.light.text,
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
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: "#fff",
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
    color: Colors.light.text,
  },
  menuSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F2",
    marginLeft: 60,
  },
  footerNote: {
    marginTop: 24,
    marginHorizontal: 24,
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
