import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Platform } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { apiRequest } from "@/lib/query-client";
import type { PhotoRequest } from "@/lib/types";
import {
  EMERALD,
  EMERALD_A08,
  GRAY_105,
  GRAY_125,
  GRAY_290,
  GRAY_600,
  GRAY_850,
  PURPLE,
  PURPLE_A08,
  WHITE,
} from "@/constants/colors";

import styles from "./transaction-history.styles";

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
        const completed = (data as PhotoRequest[]).filter((req) => req.status === "completed");
        completed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(completed);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const totalEarned = requests
    .filter((req) => req.acceptedBy === user?.id)
    .reduce((sum, req) => sum + req.reward, 0);

  const totalSpent = requests
    .filter((req) => req.creatorId === user?.id && req.acceptedBy !== user?.id)
    .reduce((sum, req) => sum + req.reward, 0);

  function renderItem({ item }: { item: PhotoRequest }) {
    const isEarned = item.acceptedBy === user?.id;
    const isCreated = item.creatorId === user?.id;

    return (
      <View style={styles.item}>
        <View style={[styles.itemIcon, { backgroundColor: isEarned ? EMERALD_A08 : PURPLE_A08 }]}>
          <Ionicons
            name={isEarned ? "arrow-down-outline" : "arrow-up-outline"}
            size={18}
            color={isEarned ? EMERALD : PURPLE}
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
          <Text style={[styles.itemAmount, { color: isEarned ? EMERALD : GRAY_850 }]}>
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
          <Feather name="arrow-left" size={20} color={GRAY_850} />
        </Pressable>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 36 }} />
      </View>

      {!loading && requests.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryAmount, { color: EMERALD }]}>+${totalEarned.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryAmount, { color: PURPLE }]}>-${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color={GRAY_290} />
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
