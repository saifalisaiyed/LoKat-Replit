import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  FlatList,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import { CATEGORIES, type Category } from "@/lib/types";
import MapViewWrapper from "@/components/MapViewWrapper";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4;

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

function getCategoryLabel(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function getCategoryIcon(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.icon ?? "pricetag-outline";
}

function RequestCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.requestCard,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
      onPress={onPress}
    >
      <View style={styles.requestCardTop}>
        <View style={styles.requestLocationRow}>
          <Ionicons name="location" size={18} color={Colors.palette.emerald} />
          <View style={styles.requestLocationInfo}>
            <Text style={styles.requestLocationName} numberOfLines={1}>
              {item.locationName}
            </Text>
            <Text style={styles.requestAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
        <View style={styles.requestReward}>
          <Text style={styles.requestRewardText}>${item.reward}</Text>
        </View>
      </View>
      <View style={styles.requestCardBottom}>
        <View style={styles.requestMeta}>
          <View style={styles.categoryChip}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={12}
              color={Colors.palette.emerald}
            />
            <Text style={styles.categoryChipText}>
              {getCategoryLabel(item.category)}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Ionicons
            name={
              item.orientation === "portrait"
                ? "phone-portrait-outline"
                : "phone-landscape-outline"
            }
            size={13}
            color={Colors.light.textSecondary}
          />
          <View style={styles.metaDot} />
          <Text style={styles.requestTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.light.border}
        />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { requests, getRequestsByCategory } = useApp();
  const mapRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  const initialRegion = {
    latitude: 40.758,
    longitude: -73.9855,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      requestLocation();
    }
  }, []);

  const requestLocation = async () => {
    try {
      const Location = require("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch (e) {
      console.log("Location error:", e);
    }
  };

  const openRequests = getRequestsByCategory(selectedCategory);

  const handleMarkerPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/request-detail/[id]", params: { id } });
  }, []);

  const handleRequestPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/request-detail/[id]", params: { id } });
  }, []);

  const handleCategoryPress = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(selectedCategory === cat ? null : cat);
  };

  const renderHeader = () => (
    <>
      <View style={[styles.mapContainer, { marginTop: 0 }]}>
        <MapViewWrapper
          selectedPin={null}
          openRequests={openRequests}
          isSeeker={false}
          onMarkerPress={handleMarkerPress}
          permissionStatus={permissionStatus}
          initialRegion={initialRegion}
          mapRef={mapRef}
          onMapPress={() => {}}
        />
        <View
          style={[
            styles.mapOverlay,
            { paddingTop: insets.top + 12 + webInsetTop },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.mapTitle}>LoKate</Text>
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>{openRequests.length}</Text>
            <Text style={styles.mapBadgeLabel}>nearby</Text>
          </View>
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Explore by Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => handleCategoryPress(cat.key)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isActive ? "#fff" : Colors.palette.emerald}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        <Text style={styles.feedCount}>{openRequests.length} available</Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="search-outline"
        size={40}
        color={Colors.light.border}
      />
      <Text style={styles.emptyTitle}>No requests found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory
          ? "Try a different category"
          : "Check back later for new requests"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={openRequests}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
        contentContainerStyle={{
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
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: "#E8F4E8",
    overflow: "hidden",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mapTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "DMSans_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  mapBadge: {
    backgroundColor: Colors.palette.emerald,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  mapBadgeText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "DMSans_700Bold",
  },
  mapBadgeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "DMSans_400Regular",
  },
  categoriesSection: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily: "DMSans_700Bold",
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.palette.emerald + "10",
    borderWidth: 1.5,
    borderColor: Colors.palette.emerald + "30",
  },
  categoryPillActive: {
    backgroundColor: Colors.palette.emerald,
    borderColor: Colors.palette.emerald,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_600SemiBold",
  },
  categoryPillTextActive: {
    color: "#fff",
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
    paddingTop: 16,
  },
  feedCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  requestCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  requestLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  requestLocationInfo: {
    flex: 1,
  },
  requestLocationName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  requestAddress: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "DMSans_400Regular",
  },
  requestReward: {
    backgroundColor: Colors.palette.emerald + "14",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  requestRewardText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_700Bold",
  },
  requestCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border + "60",
  },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.palette.emerald,
    fontFamily: "DMSans_500Medium",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.light.border,
  },
  requestTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
    fontFamily: "DMSans_400Regular",
  },
});
