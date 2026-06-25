import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import type { Notification } from "@/lib/types";
import {
  BLACK_A03,
  BLACK_A05,
  BLUE,
  BLUE_A10,
  GRASS,
  GRASS_A10,
  GRAY_105,
  GRAY_170,
  GRAY_450,
  GRAY_600,
  GRAY_850,
  PURPLE,
  ROSE,
  ROSE_A10,
  SKY_A03,
  SKY_A10,
  WHITE,
} from "@/constants/colors";

function getNotifIcon(type: Notification["type"]): {
  name: string;
  color: string;
  bg: string;
} {
  switch (type) {
    case "accepted":
      return { name: "checkmark-circle", color: PURPLE, bg: SKY_A10 };
    case "submitted":
      return { name: "cloud-upload", color: BLUE, bg: BLUE_A10 };
    case "completed":
      return { name: "cash", color: GRASS, bg: GRASS_A10 };
    case "new_request":
      return { name: "location", color: ROSE, bg: ROSE_A10 };
    default:
      return { name: "notifications", color: GRAY_600, bg: BLACK_A05 };
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

function NotificationItem({ item, onPress }: { item: Notification; onPress: () => void }) {
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
        <Ionicons name={iconConfig.name as any} size={20} color={iconConfig.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const handlePress = useCallback(
    (item: Notification) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markNotificationRead(item.id);
      if (item.requestId) {
        router.push({ pathname: "/request-detail/[id]", params: { id: item.requestId } });
      }
    },
    [markNotificationRead],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={36} color={GRAY_170} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        {"You'll be notified when there's activity on your requests"}
      </Text>
    </View>
  );

  const canGoBack = router.canGoBack();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 + webInsetTop }]}>
        <View style={styles.headerLeft}>
          {canGoBack && (
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={8}
            >
              <Feather name="arrow-left" size={20} color={GRAY_850} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
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
    backgroundColor: GRAY_105,
  },
  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_170,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GRAY_105,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: GRAY_850,
    fontFamily: "Archivo_600SemiBold",
  },
  markAllRead: {
    fontSize: 13,
    color: PURPLE,
    fontFamily: "Archivo_500Medium",
    paddingBottom: 3,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BLACK_A03,
  },
  notifCardUnread: {
    backgroundColor: SKY_A03,
    borderColor: SKY_A10,
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
    fontSize: 14,
    fontWeight: "500",
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  notifTitleUnread: {
    fontWeight: "600",
    fontFamily: "Archivo_600SemiBold",
  },
  notifBody: {
    fontSize: 13,
    color: GRAY_600,
    lineHeight: 18,
    fontFamily: "Archivo_400Regular",
  },
  notifTime: {
    fontSize: 11,
    color: GRAY_450,
    marginTop: 3,
    fontFamily: "Archivo_400Regular",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  emptySubtitle: {
    fontSize: 14,
    color: GRAY_600,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Archivo_400Regular",
  },
});
