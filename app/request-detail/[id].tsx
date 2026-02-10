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
        <Ionicons name={icon as any} size={20} color={Colors.light.tint} />
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
          style={[styles.backBtn, { top: insets.top + 16 + webInsetTop }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.tint} />
        </Pressable>
        {isMyRequest && request.status === "open" && (
          <Pressable
            style={[styles.deleteBtn, { top: insets.top + 16 + webInsetTop }]}
            onPress={handleDelete}
            hitSlop={12}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color="#F43F5E"
            />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 100 : insets.bottom + 110,
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
                size={16}
                color={Colors.light.tint}
              />
              <Text style={styles.chipText}>
                {getCategoryLabel(request.category)}
              </Text>
            </View>
            <View style={styles.chip}>
              <Ionicons
                name="navigate-outline"
                size={16}
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
                Platform.OS === "web" ? 34 + 12 : insets.bottom + 16,
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
            <Ionicons name="close" size={22} color={Colors.light.textSecondary} />
            <Text style={styles.ignoreBtnText}>Ignore</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.acceptBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleAccept}
          >
            <Feather name="check" size={22} color="#fff" />
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
                Platform.OS === "web" ? 34 + 12 : insets.bottom + 16,
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
            <Ionicons name="camera" size={22} color="#fff" />
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
                Platform.OS === "web" ? 34 + 12 : insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.completedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.light.accent}
            />
            <Text style={styles.completedText}>Task Completed</Text>
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
    fontSize: 18,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  backLink: {
    fontSize: 18,
    color: Colors.light.tint,
    marginTop: 16,
    fontFamily: "Archivo_600SemiBold",
  },
  mapSection: {
    backgroundColor: "#E8F4E8",
    overflow: "hidden",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  deleteBtn: {
    position: "absolute",
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 20,
    gap: 20,
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
    fontSize: 26,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  address: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 6,
    fontFamily: "Archivo_400Regular",
  },
  rewardBadge: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  chipRow: {
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  chipTextMuted: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0, 174, 239, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  detailValue: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 2,
    fontFamily: "Archivo_600SemiBold",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginHorizontal: 16,
  },
  instructionsCard: {
    backgroundColor: "rgba(123, 192, 67, 0.05)",
    borderRadius: 24,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.accent,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: "Archivo_700Bold",
  },
  instructionsText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    fontFamily: "Archivo_400Regular",
  },
  photoSection: {
    gap: 12,
  },
  photoContainer: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: {
    width: "100%",
    height: 400,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  ignoreBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  ignoreBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
  },
  acceptBtn: {
    flex: 0.6,
    backgroundColor: Colors.light.tint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Archivo_700Bold",
  },
  completedBanner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    backgroundColor: "rgba(123, 192, 67, 0.1)",
    borderRadius: 20,
  },
  completedText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.accent,
    fontFamily: "Archivo_700Bold",
  },
});
