import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.35;

function getCategoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.palette.emerald} />
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
  const { requests, acceptRequest, deleteRequest } = useApp();
  const mapRef = useRef<any>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const request = requests.find((r) => r.id === id);
  const isMyRequest = request?.creatorId === "me";

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptRequest(request.id);
    router.back();
  };

  const handleIgnore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleTakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/camera/[id]",
      params: { id: request.id },
    });
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
          selectedPin={{
            latitude: request.latitude,
            longitude: request.longitude,
          }}
          openRequests={[]}
          isSeeker={true}
          onMarkerPress={() => {}}
          permissionStatus={null}
          initialRegion={mapRegion}
          mapRef={mapRef}
          onMapPress={() => {}}
        />
        <Pressable
          style={[styles.backBtn, { top: insets.top + 8 + webInsetTop }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        {isMyRequest && request.status === "open" && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 8 + webInsetTop }]}
            onPress={handleDelete}
            hitSlop={12}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={Colors.palette.coral}
            />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 90,
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
            <View style={styles.chip}>
              <Ionicons
                name={
                  (CATEGORIES.find((c) => c.key === request.category)?.icon ??
                    "pricetag-outline") as any
                }
                size={14}
                color={Colors.palette.emerald}
              />
              <Text style={styles.chipText}>
                {getCategoryLabel(request.category)}
              </Text>
            </View>
            <View style={styles.chip}>
              <Ionicons
                name="navigate-outline"
                size={14}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.chipTextMuted}>{distanceKm} km away</Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="phone-portrait-outline"
              label="Orientation"
              value={
                request.orientation === "portrait" ? "Portrait" : "Landscape"
              }
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={
                request.angle === "looking-up"
                  ? "arrow-up-circle-outline"
                  : request.angle === "looking-down"
                    ? "arrow-down-circle-outline"
                    : "remove-circle-outline"
              }
              label="Angle"
              value={request.angle
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon="navigate-outline"
              label="Distance"
              value={`${distanceKm} km`}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={
                request.timing === "now" ? "flash-outline" : "time-outline"
              }
              label="Timing"
              value={
                request.timing === "now"
                  ? "As soon as possible"
                  : request.scheduledTime
                    ? new Date(request.scheduledTime).toLocaleString()
                    : "Scheduled"
              }
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
                <Image
                  source={{ uri: request.photoUri }}
                  style={styles.photo}
                  contentFit="cover"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {request.status === "open" && !isMyRequest && (
        <View
          style={[
            styles.actionBar,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 12,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.ignoreBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleIgnore}
          >
            <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
            <Text style={styles.ignoreBtnText}>Ignore</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.acceptBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleAccept}
          >
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </Pressable>
        </View>
      )}

      {request.status === "accepted" && request.acceptedBy === "me" && (
        <View
          style={[
            styles.actionBar,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 12,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.acceptBtn,
              { backgroundColor: "#3B82F6", flex: 1 },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.acceptBtnText}>Take Photo</Text>
          </Pressable>
        </View>
      )}

      {request.status === "completed" && (
        <View
          style={[
            styles.actionBar,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 12,
            },
          ]}
        >
          <View style={styles.completedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.palette.emerald}
            />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  backLink: {
    fontSize: 16,
    color: Colors.palette.emerald,
    marginTop: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  mapSection: {
    backgroundColor: "#E8F4E8",
    overflow: "hidden",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  deleteBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  address: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "DMSans_400Regular",
  },
  rewardBadge: {
    backgroundColor: Colors.palette.emerald,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  rewardText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "DMSans_700Bold",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 13,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_500Medium",
  },
  chipTextMuted: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.palette.emerald + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 1,
    fontFamily: "DMSans_600SemiBold",
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 14,
  },
  instructionsCard: {
    backgroundColor: Colors.palette.amber + "0A",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.palette.amber,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 6,
    fontFamily: "DMSans_600SemiBold",
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontFamily: "DMSans_400Regular",
  },
  photoSection: {
    gap: 8,
  },
  photoContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.border,
  },
  photo: {
    width: "100%",
    height: 300,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  ignoreBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  ignoreBtnText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_600SemiBold",
  },
  acceptBtn: {
    flex: 0.6,
    backgroundColor: Colors.palette.emerald,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  completedBanner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.palette.emerald + "14",
    borderRadius: 14,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_600SemiBold",
  },
});
