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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "14" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 90,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 + webInsetTop }]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.light.tint} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.subtitle}>LoKate Member</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="images" label="Requests" value={profile.requestsCreated.toString()} color={Colors.light.tint} />
          <StatCard icon="camera" label="Fulfilled" value={profile.requestsFulfilled.toString()} color="#3B82F6" />
          <StatCard icon="sparkles" label="Score" value="98" color={Colors.light.accent} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balance</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsTop}>
            <Text style={styles.earningsAmount}>${profile.earnings.toFixed(2)}</Text>
            <Text style={styles.earningsLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsBottom}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsRowLabel}>Available to withdraw</Text>
              <Text style={styles.earningsRowValue}>${profile.earnings.toFixed(2)}</Text>
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
        <Pressable style={styles.menuItem}>
          <Ionicons name="card-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.menuItemText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.border} />
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons name="settings-outline" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.menuItemText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.border} />
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.border} />
        </Pressable>
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
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,174,239,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "Archivo_400Regular",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
    fontFamily: "Archivo_600SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  earningsTop: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,174,239,0.03)",
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  earningsLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "Archivo_400Regular",
  },
  earningsDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  earningsBottom: {
    padding: 16,
    gap: 12,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  earningsRowLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  earningsRowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
  },
});
