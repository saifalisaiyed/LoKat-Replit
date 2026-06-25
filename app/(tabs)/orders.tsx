import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { CATEGORIES, type Category, type RequestStatus } from "@/lib/types";
import {
  AMBER,
  AMBER_A10,
  BLACK_A04,
  BLUE,
  BLUE_A10,
  EMERALD,
  EMERALD_A10,
  GRAY_105,
  GRAY_170,
  GRAY_175,
  GRAY_600,
  GRAY_850,
  ORANGE,
  ORANGE_A08,
  PURPLE,
  PURPLE_A08,
  PURPLE_A10,
  WHITE,
} from "@/constants/colors";

type Tab = "active" | "history";
type ActiveFilter = "all" | "requested";
type HistoryFilter = "all" | "requested" | "fulfilled";

function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case "open":
      return { color: PURPLE, bg: PURPLE_A10, label: "Waiting", icon: "radio-button-on" };
    case "accepted":
      return { color: AMBER, bg: AMBER_A10, label: "In Progress", icon: "time-outline" };
    case "submitted":
      return { color: BLUE, bg: BLUE_A10, label: "Photo Sent", icon: "cloud-upload-outline" };
    case "completed":
      return { color: EMERALD, bg: EMERALD_A10, label: "Completed", icon: "checkmark-circle" };
    default:
      return { color: GRAY_600, bg: GRAY_105, label: status, icon: "ellipse" };
  }
}

function getRoleConfig(isRequested: boolean, isActive: boolean) {
  if (isRequested) {
    return { label: "Requested", color: PURPLE, bg: PURPLE_A08, icon: "arrow-up-outline" };
  }
  return {
    label: isActive ? "Fulfilling" : "Fulfilled",
    color: ORANGE,
    bg: ORANGE_A08,
    icon: isActive ? "walk-outline" : "checkmark-done-outline",
  };
}

function getCategoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function OrderCard({ item, onPress, userId }: { item: any; onPress: () => void; userId?: string }) {
  const statusConfig = getStatusConfig(item.status);
  const isRequested = item.creatorId === userId;
  const isActive = item.status !== "completed";
  const roleConfig = getRoleConfig(isRequested, isActive);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.orderCard,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
      onPress={onPress}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderLocationRow}>
          <Ionicons name="location" size={16} color={PURPLE} />
          <Text style={styles.orderLocationName} numberOfLines={1}>
            {item.locationName}
          </Text>
        </View>
        <Text style={styles.orderReward}>${item.reward}</Text>
      </View>

      <Text style={styles.orderAddress} numberOfLines={1}>{item.address}</Text>

      <View style={styles.orderBottom}>
        <View style={styles.orderMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={11} color={statusConfig.color} />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
            <Ionicons name={roleConfig.icon as any} size={11} color={roleConfig.color} />
            <Text style={[styles.roleLabel, { color: roleConfig.color }]}>
              {roleConfig.label}
            </Text>
          </View>
        </View>
        <Text style={styles.orderCategory}>{getCategoryLabel(item.category)}</Text>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterChipCount, active && styles.filterChipCountActive]}>
          <Text style={[styles.filterChipCountText, active && styles.filterChipCountTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { requests, user } = useApp();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const myOrders = useMemo(
    () => requests.filter((req) => req.creatorId === userId || req.acceptedBy === userId),
    [requests, userId]
  );

  const activeOrders = useMemo(
    () => myOrders.filter((req) => ["open", "accepted", "submitted"].includes(req.status)),
    [myOrders]
  );

  const historyOrders = useMemo(
    () => myOrders.filter((req) => req.status === "completed"),
    [myOrders]
  );

  const requestedActive = useMemo(
    () => activeOrders.filter((req) => req.creatorId === userId),
    [activeOrders, userId]
  );
  const requestedHistory = useMemo(
    () => historyOrders.filter((req) => req.creatorId === userId),
    [historyOrders, userId]
  );
  const fulfilledHistory = useMemo(
    () => historyOrders.filter((req) => req.acceptedBy === userId && req.creatorId !== userId),
    [historyOrders, userId]
  );

  const filteredData = useMemo(() => {
    if (activeTab === "active") {
      if (activeFilter === "requested") return requestedActive;
      return activeOrders;
    } else {
      if (historyFilter === "requested") return requestedHistory;
      if (historyFilter === "fulfilled") return fulfilledHistory;
      return historyOrders;
    }
  }, [activeTab, activeFilter, historyFilter, activeOrders, historyOrders, requestedActive, requestedHistory, fulfilledHistory]);

  const handlePress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/request-detail/[id]", params: { id } });
  }, []);

  const handleTabChange = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (tab === "active") setActiveFilter("all");
    else setHistoryFilter("all");
  };

  const emptyLabel =
    activeTab === "active"
      ? activeFilter === "requested"
        ? "No active requests"
        : "No active orders"
      : historyFilter === "requested"
      ? "No completed requests yet"
      : historyFilter === "fulfilled"
      ? "No fulfilled requests yet"
      : "No history yet";

  const emptySubtitle =
    activeTab === "active"
      ? "Create a request or accept one from the map to get started"
      : "Completed requests will appear here";

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "active" ? "document-outline" : "archive-outline"}
        size={36}
        color={GRAY_170}
      />
      <Text style={styles.emptyTitle}>{emptyLabel}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 + webInsetTop }]}>
        <Text style={styles.headerTitle}>Orders</Text>

        <View style={styles.tabRow}>
          {(["active", "history"] as Tab[]).map((tab) => {
            const count = tab === "active" ? activeOrders.length : 0;
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => handleTabChange(tab)}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab === "active" ? "Active" : "History"}
                </Text>
                {tab === "active" && count > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {activeTab === "active" ? (
            <>
              <FilterChip
                label="All"
                active={activeFilter === "all"}
                count={activeOrders.length}
                onPress={() => setActiveFilter("all")}
              />
              <FilterChip
                label="Requested"
                active={activeFilter === "requested"}
                count={requestedActive.length}
                onPress={() => setActiveFilter("requested")}
              />
            </>
          ) : (
            <>
              <FilterChip
                label="All"
                active={historyFilter === "all"}
                count={historyOrders.length}
                onPress={() => setHistoryFilter("all")}
              />
              <FilterChip
                label="Requested"
                active={historyFilter === "requested"}
                count={requestedHistory.length}
                onPress={() => setHistoryFilter("requested")}
              />
              <FilterChip
                label="Fulfilled"
                active={historyFilter === "fulfilled"}
                count={fulfilledHistory.length}
                onPress={() => setHistoryFilter("fulfilled")}
              />
            </>
          )}
        </ScrollView>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard item={item} onPress={() => handlePress(item.id)} userId={userId} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Platform.OS === "web" ? 94 + 34 : insets.bottom + 96,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY_105 },
  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_170,
  },
  headerTitle: {
    fontSize: 22,
    color: GRAY_850,
    marginBottom: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  tabRow: { flexDirection: "row" },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: PURPLE },
  tabBtnText: {
    fontSize: 14,
    color: GRAY_600,
    fontFamily: "Archivo_500Medium",
  },
  tabBtnTextActive: {
    color: PURPLE,
    fontFamily: "Archivo_600SemiBold",
  },
  tabBadge: {
    backgroundColor: PURPLE,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 11,
    color: WHITE,
    fontFamily: "Archivo_600SemiBold",
  },
  filterBar: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_170,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: GRAY_105,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: PURPLE_A08,
    borderColor: PURPLE,
  },
  filterChipText: {
    fontSize: 13,
    color: GRAY_600,
    fontFamily: "Archivo_500Medium",
  },
  filterChipTextActive: {
    color: PURPLE,
    fontFamily: "Archivo_600SemiBold",
  },
  filterChipCount: {
    backgroundColor: GRAY_175,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  filterChipCountActive: {
    backgroundColor: PURPLE,
  },
  filterChipCountText: {
    fontSize: 10,
    color: GRAY_600,
    fontFamily: "Archivo_600SemiBold",
  },
  filterChipCountTextActive: {
    color: WHITE,
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BLACK_A04,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  orderLocationName: {
    fontSize: 15,
    color: GRAY_850,
    fontFamily: "Archivo_600SemiBold",
    flex: 1,
  },
  orderReward: {
    fontSize: 16,
    color: PURPLE,
    fontFamily: "Archivo_700Bold",
  },
  orderAddress: {
    fontSize: 13,
    color: GRAY_600,
    marginTop: 3,
    marginLeft: 24,
    fontFamily: "Archivo_400Regular",
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BLACK_A04,
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "Archivo_500Medium",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: "Archivo_600SemiBold",
  },
  orderCategory: {
    fontSize: 11,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  emptySubtitle: {
    fontSize: 14,
    color: GRAY_600,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Archivo_400Regular",
    lineHeight: 20,
  },
});
