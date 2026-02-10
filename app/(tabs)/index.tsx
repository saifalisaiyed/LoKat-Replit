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
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={18} color={Colors.light.tint} />
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
            { paddingTop: insets.top + 16 + webInsetTop },
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
                  size={16}
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.tint,
    fontFamily: "Archivo_700Bold",
  },
  mapBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mapBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  mapBadgeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Archivo_400Regular",
  },
  categoriesSection: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: "Archivo_700Bold",
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(0, 174, 239, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
  },
  categoryPillTextActive: {
    color: "#fff",
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
    paddingTop: 20,
  },
  feedCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  requestCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.03)",
  },
  requestCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 174, 239, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  requestLocationInfo: {
    flex: 1,
  },
  requestLocationName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  requestAddress: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontFamily: "Archivo_400Regular",
  },
  requestReward: {
    backgroundColor: "rgba(123, 192, 67, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  requestRewardText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.accent,
    fontFamily: "Archivo_700Bold",
  },
  requestCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  requestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
  },
  requestTime: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
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
    fontFamily: "Archivo_400Regular",
  },
});
