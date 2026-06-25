import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { PhotoRequest } from "@/lib/types";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "accepted", label: "Active" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
];

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  accepted: "#F97316",
  submitted: "#3B82F6",
  completed: Colors.light.tint,
  abandoned: "#EF4444",
};

interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  openRequests: number;
  acceptedRequests: number;
  completedRequests: number;
  totalEarnings: number;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, statsRes] = await Promise.all([
        apiRequest("GET", `/api/admin/requests?status=${statusFilter}`),
        apiRequest("GET", "/api/admin/stats"),
      ]);
      setRequests(await reqRes.json());
      setStats(await statsRes.json());
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Clear All Requests",
      "This will permanently delete every request in the database. Use this to reset for fresh testing. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("DELETE", "/api/admin/requests");
              setRequests([]);
              setStats((s) => s ? { ...s, totalRequests: 0, openRequests: 0, acceptedRequests: 0, completedRequests: 0 } : s);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert("Error", "Failed to delete requests.");
            }
          },
        },
      ]
    );
  };

  if (!user?.isAdmin) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 + webInsetTop }]}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.light.textSecondary} />
          <Text style={styles.accessDenied}>Admin access required</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const renderRequest = ({ item }: { item: PhotoRequest }) => (
    <Pressable
      style={({ pressed }) => [styles.requestCard, pressed && { opacity: 0.9 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/request-detail/${item.id}`);
      }}
    >
      <View style={styles.requestHeader}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || "#999" }]} />
        <Text style={styles.requestStatus}>{item.status.toUpperCase()}</Text>
        <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.requestLocation} numberOfLines={1}>{item.locationName}</Text>
      <Text style={styles.requestAddress} numberOfLines={1}>{item.address}</Text>
      <View style={styles.requestMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="camera-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="compass-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{item.orientation}</Text>
        </View>
        <Text style={styles.requestReward}>${item.reward}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        </View>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard label="Users" value={stats.totalUsers} icon="people-outline" color="#3B82F6" />
          <StatCard label="Requests" value={stats.totalRequests} icon="images-outline" color={Colors.light.tint} />
          <StatCard label="Open" value={stats.openRequests} icon="radio-button-on-outline" color="#22C55E" />
          <StatCard label="Completed" value={stats.completedRequests} icon="checkmark-circle-outline" color="#F97316" />
        </View>
      )}

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                statusFilter === item.key && styles.filterChipActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusFilter(item.key);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />}
          scrollEnabled={!!requests.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={40} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No requests found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  accessDenied: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Archivo_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 10,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Archivo_600SemiBold",
    color: Colors.light.text,
  },
  adminBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  clearBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Archivo_600SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F2",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Archivo_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Archivo_400Regular",
    color: Colors.light.textSecondary,
  },
  filterRow: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F2",
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F0F0F2",
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Archivo_500Medium",
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  list: {
    padding: 16,
    gap: 10,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestStatus: {
    fontSize: 11,
    fontFamily: "Archivo_700Bold",
    letterSpacing: 0.6,
  },
  requestDate: {
    fontSize: 11,
    fontFamily: "Archivo_400Regular",
    color: Colors.light.textSecondary,
    marginLeft: "auto",
  },
  requestLocation: {
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
    color: Colors.light.text,
  },
  requestAddress: {
    fontSize: 12,
    fontFamily: "Archivo_400Regular",
    color: Colors.light.textSecondary,
  },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Archivo_400Regular",
    color: Colors.light.textSecondary,
  },
  requestReward: {
    fontSize: 14,
    fontFamily: "Archivo_700Bold",
    color: Colors.light.tint,
    marginLeft: "auto",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Archivo_400Regular",
    color: Colors.light.textSecondary,
  },
});
