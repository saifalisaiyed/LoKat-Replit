import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "14" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, requests } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 90,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.header, { paddingTop: insets.top + 24 + webInsetTop }]}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.light.tint} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.subtitle}>LoKate Member</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="images"
            label="Requests"
            value={profile.requestsCreated.toString()}
            color={Colors.light.tint}
          />
          <StatCard
            icon="camera"
            label="Fulfilled"
            value={profile.requestsFulfilled.toString()}
            color="#3B82F6"
          />
          <StatCard
            icon="sparkles"
            label="Score"
            value="98"
            color={Colors.light.accent}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balance</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsTop}>
            <Text style={styles.earningsAmount}>
              ${profile.earnings.toFixed(2)}
            </Text>
            <Text style={styles.earningsLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsBottom}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsRowLabel}>Available to withdraw</Text>
              <Text style={styles.earningsRowValue}>
                ${profile.earnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsRowLabel}>Pending</Text>
              <Text style={styles.earningsRowValue}>$0.00</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: "rgba(0, 174, 239, 0.08)" }]}>
              <Ionicons name="card-outline" size={20} color={Colors.light.tint} />
            </View>
            <Text style={styles.menuItemText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.border} />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: "rgba(123, 192, 67, 0.08)" }]}>
              <Ionicons name="settings-outline" size={20} color={Colors.light.accent} />
            </View>
            <Text style={styles.menuItemText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.border} />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: "rgba(244, 63, 94, 0.08)" }]}>
              <Ionicons name="help-circle-outline" size={20} color="#F43F5E" />
            </View>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.border} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0, 174, 239, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 174, 239, 0.1)",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "Archivo_400Regular",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    fontFamily: "Archivo_700Bold",
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  earningsTop: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "rgba(0, 174, 239, 0.03)",
  },
  earningsAmount: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.light.tint,
    fontFamily: "Archivo_700Bold",
  },
  earningsLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "Archivo_400Regular",
  },
  earningsDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  earningsBottom: {
    padding: 20,
    gap: 12,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  earningsRowLabel: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  earningsRowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
});
