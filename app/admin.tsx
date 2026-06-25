import React, { useEffect, useCallback } from "react";
import { useAdminData, type AdminStats } from "@/hooks/useAdminData";
import { View, Text, Pressable, FlatList, ActivityIndicator, Platform, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { apiRequest } from "@/lib/query-client";
import type { PhotoRequest } from "@/lib/types";
import {
  BLUE,
  GRAY_105,
  GRAY_125,
  GRAY_500,
  GRAY_600,
  GRAY_80,
  GRAY_850,
  GREEN_500,
  ORANGE,
  PURPLE,
  RED,
  WHITE,
} from "@/constants/colors";

import styles from "@/styles/admin";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "accepted", label: "Active" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
];

const STATUS_COLORS: Record<string, string> = {
  open: GREEN_500,
  accepted: ORANGE,
  submitted: BLUE,
  completed: PURPLE,
  abandoned: RED,
};


export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const {
    requests, setRequests,
    stats, setStats,
    statusFilter, setStatusFilter,
    loading, setLoading,
    refreshing, setRefreshing,
  } = useAdminData();

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, statsRes] = await Promise.all([
        apiRequest("GET", `/api/admin/requests?status=${statusFilter}`),
        apiRequest("GET", "/api/admin/stats"),
      ]);
      setRequests(await reqRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error("Admin fetch error:", error);
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
            } catch (_deleteError) {
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
          <Ionicons name="lock-closed-outline" size={48} color={GRAY_600} />
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
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || GRAY_500 }]} />
        <Text style={styles.requestStatus}>{item.status.toUpperCase()}</Text>
        <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.requestLocation} numberOfLines={1}>{item.locationName}</Text>
      <Text style={styles.requestAddress} numberOfLines={1}>{item.address}</Text>
      <View style={styles.requestMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="camera-outline" size={14} color={GRAY_600} />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="compass-outline" size={14} color={GRAY_600} />
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
          <Ionicons name="chevron-back" size={22} color={GRAY_850} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color={RED} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={WHITE} />
          </View>
        </View>
      </View>

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard label="Users" value={stats.totalUsers} icon="people-outline" color={BLUE} />
          <StatCard label="Requests" value={stats.totalRequests} icon="images-outline" color={PURPLE} />
          <StatCard label="Open" value={stats.openRequests} icon="radio-button-on-outline" color={GREEN_500} />
          <StatCard label="Completed" value={stats.completedRequests} icon="checkmark-circle-outline" color={ORANGE} />
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
          <ActivityIndicator size="large" color={PURPLE} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
          scrollEnabled={!!requests.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="file-tray-outline" size={40} color={GRAY_600} />
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
