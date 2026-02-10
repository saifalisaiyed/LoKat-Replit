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
        color: Colors.light.tint,
        bg: "rgba(0, 174, 239, 0.12)",
      };
    case "submitted":
      return {
        name: "cloud-upload",
        color: "#3B82F6",
        bg: "rgba(59, 130, 246, 0.12)",
      };
    case "completed":
      return {
        name: "cash",
        color: Colors.light.accent,
        bg: "rgba(123, 192, 67, 0.12)",
      };
    case "new_request":
      return {
        name: "location",
        color: "#F43F5E",
        bg: "rgba(244, 63, 94, 0.12)",
      };
    default:
      return {
        name: "notifications",
        color: Colors.light.textSecondary,
        bg: "rgba(0, 0, 0, 0.05)",
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
          size={22}
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
        style={[styles.header, { paddingTop: insets.top + 16 + webInsetTop }]}
      >
        <View style={styles.headerTitleRow}>
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
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: 12,
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
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  markAllRead: {
    fontSize: 14,
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: "rgba(0, 174, 239, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(0, 174, 239, 0.1)",
  },
  notifIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  notifTitleUnread: {
    fontWeight: "700",
    fontFamily: "Archivo_700Bold",
  },
  notifBody: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    fontFamily: "Archivo_400Regular",
  },
  notifTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "Archivo_400Regular",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 100,
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
