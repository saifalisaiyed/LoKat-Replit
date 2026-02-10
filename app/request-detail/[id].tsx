import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";

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

export default function RequestDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, requests, claimRequest, acceptPhoto, deleteRequest } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const request = requests.find((r) => r.id === id);
  const isSeeker = profile.role === "seeker";
  const isMyRequest = request?.seekerId === "me";
  const isClaimed = request?.claimedBy === "me";

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

  const handleClaim = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    claimRequest(request.id);
  };

  const handleTakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/camera/[id]",
      params: { id: request.id },
    });
  };

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptPhoto(request.id);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteRequest(request.id);
    router.back();
  };

  const statusColor = getStatusColor(request.status);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 + webInsetTop }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Request</Text>
        {isMyRequest && request.status === "open" && (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color={Colors.palette.coral} />
          </Pressable>
        )}
        {!isMyRequest && <View style={{ width: 22 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "18" },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {request.status}
            </Text>
          </View>
          <View style={styles.rewardBox}>
            <Text style={styles.rewardAmount}>${request.reward.toFixed(2)}</Text>
            <Text style={styles.rewardLabel}>Reward</Text>
          </View>
        </View>

        <View style={styles.locationSection}>
          <Ionicons name="location" size={24} color={Colors.palette.emerald} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{request.locationName}</Text>
            <Text style={styles.locationCoords}>
              {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
            </Text>
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
            icon={
              request.angle === "looking-up"
                ? "arrow-up-circle-outline"
                : request.angle === "looking-down"
                  ? "arrow-down-circle-outline"
                  : "remove-circle-outline"
            }
            label="Angle"
            value={request.angle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          />
          <View style={styles.detailDivider} />
          <DetailRow
            icon={request.timing === "now" ? "flash-outline" : "time-outline"}
            label="Timing"
            value={
              request.timing === "now"
                ? "As soon as possible"
                : request.scheduledTime
                  ? new Date(request.scheduledTime).toLocaleString()
                  : "Scheduled"
            }
          />
          <View style={styles.detailDivider} />
          <DetailRow
            icon="calendar-outline"
            label="Posted"
            value={new Date(request.createdAt).toLocaleDateString()}
          />
        </View>

        {request.note && (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>Notes from Seeker</Text>
            <Text style={styles.noteText}>{request.note}</Text>
          </View>
        )}

        {request.photoUri && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Submitted Photo</Text>
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: request.photoUri }}
                style={styles.photo}
                contentFit="cover"
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 },
        ]}
      >
        {!isSeeker && request.status === "open" && (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClaim}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Claim Request</Text>
          </Pressable>
        )}

        {!isSeeker && request.status === "claimed" && isClaimed && (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: "#3B82F6" },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Take Photo</Text>
          </Pressable>
        )}

        {isSeeker && isMyRequest && request.status === "submitted" && (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleAccept}
          >
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Accept & Pay</Text>
          </Pressable>
        )}

        {request.status === "completed" && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.palette.emerald} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  rewardBox: {
    alignItems: "flex-end",
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_700Bold",
  },
  rewardLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  locationCoords: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
  noteCard: {
    backgroundColor: Colors.palette.amber + "0A",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.palette.amber,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.palette.amber,
    marginBottom: 6,
    fontFamily: "DMSans_600SemiBold",
  },
  noteText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontFamily: "DMSans_400Regular",
  },
  photoSection: {
    gap: 8,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionBtn: {
    backgroundColor: Colors.palette.emerald,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  completedBanner: {
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
