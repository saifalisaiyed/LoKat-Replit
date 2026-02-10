import React, { useCallback } from "react";
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
import type { Notification } from "@/lib/types";

function getNotifIcon(type: Notification["type"]): {
  name: string;
  color: string;
  bg: string;
} {
  switch (type) {
    case "accepted":
      return {
        name: "checkmark-circle",
        color: Colors.palette.emerald,
        bg: Colors.palette.emerald + "14",
      };
    case "submitted":
      return {
        name: "cloud-upload",
        color: "#3B82F6",
        bg: "#3B82F614",
      };
    case "completed":
      return {
        name: "cash",
        color: Colors.palette.amber,
        bg: Colors.palette.amber + "14",
      };
    case "new_request":
      return {
        name: "location",
        color: Colors.palette.coral,
        bg: Colors.palette.coral + "14",
      };
    default:
      return {
        name: "notifications",
        color: Colors.light.textSecondary,
        bg: Colors.light.border + "40",
      };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: () => void;
}) {
  const iconConfig = getNotifIcon(item.type);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notifCard,
        !item.read && styles.notifCardUnread,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.notifIconBg, { backgroundColor: iconConfig.bg }]}>
        <Ionicons
          name={iconConfig.name as any}
          size={20}
          color={iconConfig.color}
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } =
    useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handlePress = useCallback(
    (item: Notification) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markNotificationRead(item.id);
      if (item.requestId) {
        router.push({
          pathname: "/request-detail/[id]",
          params: { id: item.requestId },
        });
      }
    },
    [markNotificationRead],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={40}
        color={Colors.light.border}
      />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        You'll be notified when there's activity on your requests
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12 + webInsetTop }]}
      >
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              markAllNotificationsRead();
            }}
            hitSlop={12}
          >
            <Text style={styles.markAllRead}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: 8,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  markAllRead: {
    fontSize: 14,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_600SemiBold",
    paddingBottom: 4,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
  },
  notifCardUnread: {
    backgroundColor: Colors.palette.emerald + "08",
    borderWidth: 1,
    borderColor: Colors.palette.emerald + "20",
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_500Medium",
  },
  notifTitleUnread: {
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  notifBody: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    fontFamily: "DMSans_400Regular",
  },
  notifTime: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    fontFamily: "DMSans_400Regular",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.palette.emerald,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "DMSans_400Regular",
  },
});
