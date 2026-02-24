import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import { CATEGORIES, type Category } from "@/lib/types";
import MapViewWrapper from "@/components/MapViewWrapper";
import AuthPromptModal from "@/components/AuthPromptModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.32;

const CATEGORY_COLORS: Record<string, string> = {
  landmarks: "#D4A017",
  nature: "#22C55E",
  markets: "#EC4899",
  beaches: "#F97316",
  cityscapes: "#3B82F6",
  food: "#EF4444",
  "hidden-gems": "#8B5CF6",
  events: "#14B8A6",
};

function getCatColor(key: string): string {
  return CATEGORY_COLORS[key] || Colors.light.tint;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCategoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.light.tint} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function RequestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, acceptRequest, abandonRequest, deleteRequest, activeRequestId, user, isAuthenticated } = useApp();
  const mapRef = useRef<any>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [menuVisible, setMenuVisible] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);

  const request = requests.find((r) => r.id === id);
  const userId = user?.id;
  const isMyRequest = request?.creatorId === userId;
  const isActiveLoKater = request?.status === "accepted" && request?.acceptedBy === userId;
  const safeCategory = request?.category || "landmarks";
  const categoryData = CATEGORIES.find((c) => c.key === safeCategory) || CATEGORIES[0];

  if (!request) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.notFoundText}>Request not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const mapRegion = {
    latitude: request.latitude,
    longitude: request.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleAccept = () => {
    if (!isAuthenticated) { setAuthPromptVisible(true); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptRequest(request.id);
    router.replace({ pathname: "/lokater-mode/[id]", params: { id: request.id } });
  };

  const handleIgnore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: "/lokater-mode/[id]", params: { id: request.id } });
  };

  const handleAbandon = () => {
    setMenuVisible(false);
    if (Platform.OS === "web") {
      abandonRequest(request.id);
      router.dismissAll();
      router.replace("/(tabs)");
    } else {
      Alert.alert(
        "Abandon Request",
        "Are you sure? The request will become available for other LoKaters.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Abandon",
            style: "destructive",
            onPress: () => {
              abandonRequest(request.id);
              router.dismissAll();
              router.replace("/(tabs)");
            },
          },
        ]
      );
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteRequest(request.id);
    router.back();
  };

  const distanceKm = (2 + Math.random() * 5).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={[styles.mapSection, { height: MAP_HEIGHT }]}>
        <MapViewWrapper
          selectedPin={{ latitude: request.latitude, longitude: request.longitude }}
          openRequests={[]}
          isSeeker={true}
          onMarkerPress={() => {}}
          permissionStatus={null}
          initialRegion={mapRegion}
          mapRef={mapRef}
          onMapPress={() => {}}
        />
        <Pressable
          style={[styles.backBtn, { top: insets.top + 12 + webInsetTop }]}
          onPress={() => {
            if (isActiveLoKater) {
              router.replace({ pathname: "/lokater-mode/[id]", params: { id: request.id } });
            } else {
              router.back();
            }
          }}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        {isMyRequest && request.status === "open" && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 12 + webInsetTop }]}
            onPress={handleDelete}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
          </Pressable>
        )}
        {isActiveLoKater && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 12 + webInsetTop }]}
            onPress={() => setMenuVisible(true)}
            hitSlop={12}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.light.text} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 90 : insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={styles.locationName}>{request.locationName}</Text>
              <Text style={styles.address}>{request.address}</Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>${request.reward}</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.categoryPill, { backgroundColor: hexToRgba(getCatColor(safeCategory), 0.12), borderColor: hexToRgba(getCatColor(safeCategory), 0.3) }]}>
              <Ionicons
                name={categoryData.icon as any}
                size={15}
                color={getCatColor(safeCategory)}
              />
              <Text style={[styles.categoryPillText, { color: getCatColor(safeCategory) }]}>
                {categoryData.label}
              </Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="navigate-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.chipTextMuted}>{distanceKm} km away</Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="phone-portrait-outline"
              label="Orientation"
              value={request.orientation === "portrait" ? "Portrait" : "Landscape"}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={request.angle === "looking-up" ? "arrow-up-circle-outline" : request.angle === "looking-down" ? "arrow-down-circle-outline" : "remove-circle-outline"}
              label="Angle"
              value={request.angle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={request.timing === "now" ? "flash-outline" : "time-outline"}
              label="Timing"
              value={request.timing === "now" ? "As soon as possible" : request.scheduledTime ? new Date(request.scheduledTime).toLocaleString() : "Scheduled"}
            />
          </View>

          {request.note && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>{request.note}</Text>
            </View>
          )}

          {request.photoUri && (
            <View style={styles.photoSection}>
              <Text style={styles.instructionsTitle}>Submitted Photo</Text>
              <View style={styles.photoContainer}>
                <Image source={{ uri: request.photoUri }} style={styles.photo} contentFit="cover" />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {request.status === "open" && !isMyRequest && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.ignoreBtn, pressed && { opacity: 0.7 }]}
            onPress={handleIgnore}
          >
            <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.ignoreBtnText}>Ignore</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleAccept}
          >
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </Pressable>
        </View>
      )}

      {isActiveLoKater && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: request.id } })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.light.tint} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptBtn, { flex: 1 }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleNavigate}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.acceptBtnText}>Enter LoKater Mode</Text>
          </Pressable>
        </View>
      )}

      {request.status === "accepted" && isMyRequest && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: request.id } })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.light.tint} />
          </Pressable>
          <View style={styles.activeBanner}>
            <Ionicons name="walk-outline" size={20} color={Colors.light.tint} />
            <Text style={styles.activeText}>LoKater is on the way</Text>
          </View>
        </View>
      )}

      {request.status === "completed" && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.light.accent} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        </View>
      )}

      {request.status === "submitted" && (
        <View style={[styles.actionBar, { paddingBottom: Platform.OS === "web" ? 34 + 8 : insets.bottom + 12 }]}>
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-done" size={22} color={Colors.light.tint} />
            <Text style={[styles.completedText, { color: Colors.light.tint }]}>Photo Sent</Text>
          </View>
        </View>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuSheet, { paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16 }]}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Options</Text>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: "#FEE2E2" }]}
              onPress={handleAbandon}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemText}>Abandon Request</Text>
                <Text style={styles.menuItemSub}>Release for other LoKaters</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuCancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <AuthPromptModal
        visible={authPromptVisible}
        onClose={() => setAuthPromptVisible(false)}
        context="claim-request"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  backLink: { fontSize: 15, color: Colors.light.tint, marginTop: 12, fontFamily: "Archivo_500Medium" },
  mapSection: { backgroundColor: "#D6EEF7", overflow: "hidden", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: {
    position: "absolute", left: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center",
  },
  deleteBtn: {
    position: "absolute", right: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center",
  },
  detailsScroll: { flex: 1 },
  detailsContent: { padding: 16, gap: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleInfo: { flex: 1, marginRight: 12 },
  locationName: { fontSize: 20, color: Colors.light.text, fontFamily: "Archivo_600SemiBold" },
  address: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4, fontFamily: "Archivo_400Regular" },
  rewardBadge: { backgroundColor: Colors.light.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  rewardText: { fontSize: 18, color: "#fff", fontFamily: "Archivo_600SemiBold" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  categoryPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
  },
  categoryPillText: { fontSize: 13, fontFamily: "Archivo_500Medium" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  chipText: { fontSize: 13, color: Colors.light.tint, fontFamily: "Archivo_500Medium" },
  chipTextMuted: { fontSize: 13, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  detailsCard: { backgroundColor: "#fff", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  detailIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(0,174,239,0.08)", alignItems: "center", justifyContent: "center" },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: 12, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  detailValue: { fontSize: 15, color: Colors.light.text, marginTop: 1, fontFamily: "Archivo_500Medium" },
  detailDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.04)", marginHorizontal: 14 },
  instructionsCard: { backgroundColor: "rgba(123,192,67,0.06)", borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: Colors.light.accent },
  instructionsTitle: { fontSize: 14, color: Colors.light.text, marginBottom: 6, fontFamily: "Archivo_600SemiBold" },
  instructionsText: { fontSize: 14, color: Colors.light.text, lineHeight: 20, fontFamily: "Archivo_400Regular" },
  photoSection: { gap: 8 },
  photoContainer: { borderRadius: 12, overflow: "hidden", backgroundColor: Colors.light.border },
  photo: { width: "100%", height: 300 },
  actionBar: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.light.border,
  },
  ignoreBtn: {
    flex: 0.4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.light.border,
  },
  ignoreBtnText: { fontSize: 15, color: Colors.light.textSecondary, fontFamily: "Archivo_500Medium" },
  acceptBtn: {
    flex: 0.6, backgroundColor: Colors.light.tint, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 12,
  },
  acceptBtnText: { color: "#fff", fontSize: 16, fontFamily: "Archivo_600SemiBold" },
  completedBanner: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, backgroundColor: "rgba(123,192,67,0.1)", borderRadius: 12,
  },
  completedText: { fontSize: 15, color: Colors.light.accent, fontFamily: "Archivo_600SemiBold" },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" as const },
  menuSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, gap: 12,
  },
  menuHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center" as const, marginBottom: 4 },
  menuTitle: { fontSize: 18, color: Colors.light.text, fontFamily: "Archivo_600SemiBold", marginBottom: 4 },
  menuItem: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 14,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10,
  },
  menuItemIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "#FEE2E2",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  menuItemInfo: { flex: 1, gap: 2 },
  menuItemText: { fontSize: 15, color: "#EF4444", fontFamily: "Archivo_600SemiBold" },
  menuItemSub: { fontSize: 12, color: Colors.light.textSecondary, fontFamily: "Archivo_400Regular" },
  menuCancelBtn: {
    alignItems: "center" as const, paddingVertical: 16, borderRadius: 10,
    backgroundColor: Colors.light.background, marginTop: 4,
  },
  menuCancelText: { fontSize: 15, color: Colors.light.text, fontFamily: "Archivo_500Medium" },
  chatBtn: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.light.tint,
    alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "rgba(124,58,237,0.06)",
  },
  activeBanner: {
    flex: 1, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
    paddingVertical: 14, backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 12,
  },
  activeText: { fontSize: 15, color: Colors.light.tint, fontFamily: "Archivo_600SemiBold" },
});
