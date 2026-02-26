import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { PhotoRequest } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  landmarks: "Landmarks",
  nature: "Nature",
  markets: "Markets",
  beaches: "Beaches",
  cityscapes: "Cityscapes",
  food: "Food & Drink",
  "hidden-gems": "Hidden Gems",
  events: "Events",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [requests, setRequests] = useState<PhotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/requests/mine");
        const data = await res.json();
        const completed = (data as PhotoRequest[]).filter((r) => r.status === "completed");
        completed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(completed);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const totalEarned = requests
    .filter((r) => r.acceptedBy === user?.id)
    .reduce((sum, r) => sum + r.reward, 0);

  const totalSpent = requests
    .filter((r) => r.creatorId === user?.id && r.acceptedBy !== user?.id)
    .reduce((sum, r) => sum + r.reward, 0);

  function renderItem({ item }: { item: PhotoRequest }) {
    const isEarned = item.acceptedBy === user?.id;
    const isCreated = item.creatorId === user?.id;

    return (
      <View style={styles.item}>
        <View style={[styles.itemIcon, { backgroundColor: isEarned ? "rgba(16,185,129,0.08)" : "rgba(124,58,237,0.08)" }]}>
          <Ionicons
            name={isEarned ? "arrow-down-outline" : "arrow-up-outline"}
            size={18}
            color={isEarned ? "#10B981" : Colors.light.tint}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemLocation} numberOfLines={1}>{item.locationName}</Text>
          <Text style={styles.itemMeta}>
            {CATEGORY_LABELS[item.category] || item.category}  ·  {formatDate(item.createdAt)}
          </Text>
          {isEarned && isCreated && (
            <Text style={styles.itemBadge}>Self-fulfilled</Text>
          )}
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.itemAmount, { color: isEarned ? "#10B981" : Colors.light.text }]}>
            {isEarned ? "+" : "-"}${item.reward.toFixed(2)}
          </Text>
          <Text style={styles.itemType}>{isEarned ? "Earned" : "Paid"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webInsetTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 36 }} />
      </View>

      {!loading && requests.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryAmount, { color: "#10B981" }]}>+${totalEarned.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryAmount, { color: Colors.light.tint }]}>-${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color="#C8C8D0" />
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyText}>Completed requests will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#F0F0F2",
  },
  summaryAmount: {
    fontSize: 20,
    fontFamily: "Archivo_700Bold",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  list: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemLocation: {
    fontSize: 14,
    fontFamily: "Archivo_500Medium",
    color: Colors.light.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  itemBadge: {
    fontSize: 11,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontFamily: "Archivo_700Bold",
  },
  itemType: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  separator: {
    height: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Archivo_600SemiBold",
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
});
