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
        <Ionicons name={icon as any} size={20} color={color} />
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

  const myRequests = requests.filter((r) => r.creatorId === "me");
  const fulfilledByMe = requests.filter(
    (r) => r.acceptedBy === "me" && r.status === "completed",
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 90,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.header, { paddingTop: insets.top + 16 + webInsetTop }]}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.palette.emerald} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.subtitle}>LoKate Member</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="images"
            label="Requests"
            value={profile.requestsCreated.toString()}
            color={Colors.palette.emerald}
          />
          <StatCard
            icon="camera"
            label="Fulfilled"
            value={profile.requestsFulfilled.toString()}
            color="#3B82F6"
          />
          <StatCard
            icon="cash"
            label="Earned"
            value={`$${profile.earnings.toFixed(0)}`}
            color={Colors.palette.amber}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings</Text>
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

      <View style={[styles.section, { marginTop: 8 }]}>
        <Pressable style={styles.menuItem}>
          <Ionicons
            name="help-circle-outline"
            size={22}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.light.border}
          />
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons
            name="settings-outline"
            size={22}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.light.border}
          />
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Ionicons
            name="card-outline"
            size={22}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.menuItemText}>Payment Methods</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.light.border}
          />
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
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.palette.emerald + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "DMSans_400Regular",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    fontFamily: "DMSans_600SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  earningsTop: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.palette.emerald + "0A",
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_700Bold",
  },
  earningsLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "DMSans_400Regular",
  },
  earningsDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
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
    fontFamily: "DMSans_400Regular",
  },
  earningsRowValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "DMSans_400Regular",
  },
});
