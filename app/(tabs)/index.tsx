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
const MAP_HEIGHT = SCREEN_HEIGHT * 0.38;

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
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
          </View>
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
              color={Colors.light.tint}
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
            size={12}
            color={Colors.light.textSecondary}
          />
          <View style={styles.metaDot} />
          <Text style={styles.requestTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.light.border}
        />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { getRequestsByCategory } = useApp();
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
      <View style={styles.mapContainer}>
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
            { paddingTop: insets.top + 14 + webInsetTop },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.glassHeader}>
            <Text style={styles.mapTitle}>LoKate</Text>
          </View>
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
                  size={15}
                  color={isActive ? "#fff" : Colors.light.tint}
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
        size={36}
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
    backgroundColor: "#D6EEF7",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  glassHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
    letterSpacing: 0.3,
  },
  mapBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  mapBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Archivo_600SemiBold",
  },
  mapBadgeLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Archivo_400Regular",
  },
  categoriesSection: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily: "Archivo_600SemiBold",
    letterSpacing: 0.2,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0, 174, 239, 0.12)",
  },
  categoryPillActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
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
    fontFamily: "Archivo_400Regular",
  },
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  requestCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 174, 239, 0.08)",
    alignItems: "center",
    justifyContent: "center",
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
    paddingTop: 2,
  },
  requestLocationName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  requestAddress: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "Archivo_400Regular",
  },
  requestReward: {
    backgroundColor: "rgba(123, 192, 67, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  requestRewardText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.accent,
    fontFamily: "Archivo_600SemiBold",
  },
  requestCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.04)",
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
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
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
    fontFamily: "Archivo_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
});
