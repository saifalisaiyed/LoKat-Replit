import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import type { PhotoRequest } from "@/lib/types";

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getAngleIcon(angle: string) {
  switch (angle) {
    case "looking-up":
      return "arrow-up-circle-outline" as const;
    case "looking-down":
      return "arrow-down-circle-outline" as const;
    default:
      return "remove-circle-outline" as const;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return Colors.palette.emerald;
    case "claimed":
      return Colors.palette.amber;
    case "submitted":
      return "#3B82F6";
    case "completed":
      return Colors.palette.slateLight;
    default:
      return Colors.palette.silver;
  }
}

function RequestCard({ item, isSeeker }: { item: PhotoRequest; isSeeker: boolean }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/request-detail/[id]",
      params: { id: item.id },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
      onPress={handlePress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color={Colors.palette.emerald} />
          <Text style={styles.locationName} numberOfLines={1}>
            {item.locationName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "18" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Ionicons
            name={item.orientation === "portrait" ? "phone-portrait-outline" : "phone-landscape-outline"}
            size={14}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.tagText}>{item.orientation}</Text>
        </View>
        <View style={styles.tag}>
          <Ionicons
            name={getAngleIcon(item.angle)}
            size={14}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.tagText}>{item.angle.replace("-", " ")}</Text>
        </View>
        <View style={styles.tag}>
          <Ionicons
            name={item.timing === "now" ? "flash-outline" : "time-outline"}
            size={14}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.tagText}>{item.timing === "now" ? "ASAP" : "Scheduled"}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>${item.reward.toFixed(2)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ isSeeker }: { isSeeker: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={isSeeker ? "images-outline" : "camera-outline"}
        size={48}
        color={Colors.light.border}
      />
      <Text style={styles.emptyTitle}>
        {isSeeker ? "No requests yet" : "No available requests"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSeeker
          ? "Tap the map to drop a pin and create your first photo request"
          : "Check back soon for new photo requests near you"}
      </Text>
    </View>
  );
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { profile, requests } = useApp();
  const isSeeker = profile.role === "seeker";

  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const filteredRequests = useMemo(() => {
    if (isSeeker) {
      return requests.filter((r) => r.seekerId === "me");
    }
    return requests.filter((r) => r.status === "open" || r.claimedBy === "me");
  }, [requests, isSeeker]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <Text style={styles.headerTitle}>
          {isSeeker ? "My Requests" : "Available"}
        </Text>
        <Text style={styles.headerCount}>
          {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
        </Text>
      </View>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard item={item} isSeeker={isSeeker} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState isSeeker={isSeeker} />}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  headerCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "DMSans_400Regular",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
    fontFamily: "DMSans_600SemiBold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "capitalize" as const,
    fontFamily: "DMSans_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  rewardBadge: {
    backgroundColor: Colors.palette.emerald + "14",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_700Bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "DMSans_400Regular",
  },
});
