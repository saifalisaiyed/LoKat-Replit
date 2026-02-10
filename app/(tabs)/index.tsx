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
  TextInput,
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

function getCategoryColor(key: string): string {
  return CATEGORY_COLORS[key] || Colors.light.tint;
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

function getCategoryIcon(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.icon ?? "pricetag-outline";
}

function getDistanceMi(lat: number, lng: number): string {
  const userLat = 40.758;
  const userLng = -73.9855;
  const R = 3958.8;
  const dLat = ((lat - userLat) * Math.PI) / 180;
  const dLng = ((lng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${(d * 5280).toFixed(0)}ft` : `${d.toFixed(1)}mi`;
}

function RequestCard({ item, onPress }: { item: any; onPress: () => void }) {
  const catColor = getCategoryColor(item.category);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.requestCard,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardIconCircle, { backgroundColor: catColor + "18" }]}>
        <Ionicons
          name={getCategoryIcon(item.category) as any}
          size={20}
          color={catColor}
        />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardLocationName} numberOfLines={1}>
          {item.locationName}, {item.address}
        </Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="navigate-circle-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.cardDistance}>
            {getDistanceMi(item.latitude, item.longitude)}
          </Text>
          <Ionicons name="time-outline" size={13} color={Colors.light.orange} />
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>

      <Pressable
        style={styles.cardArrowBtn}
        onPress={onPress}
      >
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { getRequestsByCategory } = useApp();
  const mapRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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
            { paddingTop: insets.top + 10 + webInsetTop },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.searchBar}>
            <View style={styles.searchLogoCircle}>
              <Ionicons name="scan-outline" size={16} color={Colors.light.tint} />
            </View>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Want to see something?"
              placeholderTextColor="#9CA3AF"
              editable={false}
            />
          </View>

          <View style={styles.mapBottomRow} pointerEvents="box-none">
            <View />
            <Pressable style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.contentSheet}>
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Explore by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const catColor = getCategoryColor(cat.key);
              return (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
                  ]}
                  onPress={() => handleCategoryPress(cat.key)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={15}
                    color={isActive ? "#fff" : catColor}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && { color: "#fff" },
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
          <Text style={styles.sectionTitle}>
            Incoming Requests ({openRequests.length})
          </Text>
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={36} color={Colors.light.border} />
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
    backgroundColor: Colors.palette.mapDark,
    overflow: "hidden",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  searchLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
    marginLeft: 8,
    paddingVertical: 0,
  },
  mapBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 4,
  },
  categoriesSection: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 14,
    paddingHorizontal: 16,
    fontFamily: "Archivo_600SemiBold",
    letterSpacing: 0.1,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  feedHeader: {
    paddingTop: 18,
    paddingBottom: 4,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
  },
  cardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardLocationName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDistance: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    marginRight: 6,
  },
  cardTime: {
    fontSize: 12,
    color: Colors.light.orange,
    fontFamily: "Archivo_500Medium",
  },
  cardArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
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
