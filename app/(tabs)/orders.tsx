import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import { CATEGORIES, type Category, type RequestStatus } from "@/lib/types";

type Tab = "active" | "past";

function getStatusConfig(status: RequestStatus) {
  switch (status) {
    case "open":
      return { color: Colors.light.tint, label: "Open", icon: "radio-button-on" };
    case "accepted":
      return { color: "#F59E0B", label: "Accepted", icon: "time-outline" };
    case "submitted":
      return { color: Colors.light.tint, label: "Submitted", icon: "cloud-upload-outline" };
    case "completed":
      return { color: Colors.light.accent, label: "Completed", icon: "checkmark-circle" };
    default:
      return { color: Colors.light.textSecondary, label: status, icon: "ellipse" };
  }
}

function getCategoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function OrderCard({ item, onPress }: { item: any; onPress: () => void }) {
  const statusConfig = getStatusConfig(item.status);
  const isMyRequest = item.creatorId === "me";

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
          <View style={[styles.iconContainer, { backgroundColor: Colors.light.tint + "14" }]}>
            <Ionicons name="location" size={18} color={Colors.light.tint} />
          </View>
          <Text style={styles.orderLocationName} numberOfLines={1}>
            {item.locationName}
          </Text>
        </View>
        <Text style={styles.orderReward}>${item.reward}</Text>
      </View>
      <Text style={styles.orderAddress} numberOfLines={1}>
        {item.address}
      </Text>
      <View style={styles.orderBottom}>
        <View style={styles.orderMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "14" },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={12}
              color={statusConfig.color}
            />
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <View style={styles.roleTag}>
            <Ionicons
              name={isMyRequest ? "arrow-up-outline" : "arrow-down-outline"}
              size={11}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.roleTagText}>
              {isMyRequest ? "Requested" : "Fulfilling"}
            </Text>
          </View>
        </View>
        <Text style={styles.orderCategory}>{getCategoryLabel(item.category)}</Text>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { requests } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const myOrders = requests.filter(
    (r) => r.creatorId === "me" || r.acceptedBy === "me",
  );

  const activeOrders = myOrders.filter(
    (r) => r.status === "open" || r.status === "accepted" || r.status === "submitted",
  );
  const pastOrders = myOrders.filter((r) => r.status === "completed");

  const data = activeTab === "active" ? activeOrders : pastOrders;

  const handlePress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/request-detail/[id]", params: { id } });
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "active" ? "document-outline" : "archive-outline"}
        size={40}
        color={Colors.light.border}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === "active" ? "No active orders" : "No past orders"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "active"
          ? "Accept a request or create one to get started"
          : "Completed orders will appear here"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + 16 + webInsetTop }]}
      >
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.tabRow}>
          <Pressable
            style={[
              styles.tabBtn,
              activeTab === "active" && styles.tabBtnActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("active");
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "active" && styles.tabBtnTextActive,
              ]}
            >
              Active
            </Text>
            {activeOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[
              styles.tabBtn,
              activeTab === "past" && styles.tabBtnActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("past");
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "past" && styles.tabBtnTextActive,
              ]}
            >
              Past
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard item={item} onPress={() => handlePress(item.id)} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 20,
    fontFamily: "Archivo_700Bold",
  },
  tabRow: {
    flexDirection: "row",
    gap: 0,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: Colors.light.tint,
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
  },
  tabBtnTextActive: {
    color: Colors.light.tint,
  },
  tabBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  orderLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  orderLocationName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    flex: 1,
  },
  orderReward: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.tint,
    fontFamily: "Archivo_700Bold",
  },
  orderAddress: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginLeft: 42,
    fontFamily: "Archivo_400Regular",
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Archivo_600SemiBold",
  },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roleTagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  orderCategory: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Archivo_400Regular",
  },
});
