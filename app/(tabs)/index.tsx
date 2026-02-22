import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import Colors from "@/constants/colors";
import { CATEGORIES, type Category } from "@/lib/types";
import MapViewWrapper from "@/components/MapViewWrapper";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.5;

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

const POPULAR_LOCATIONS = [
  { name: "Empire State Building", address: "350 5th Ave, New York, NY", lat: 40.7484, lng: -73.9857, category: "landmarks" },
  { name: "Central Park", address: "Central Park, New York, NY", lat: 40.7829, lng: -73.9654, category: "nature" },
  { name: "Brooklyn Bridge", address: "Brooklyn Bridge, New York, NY", lat: 40.7061, lng: -73.9969, category: "landmarks" },
  { name: "Times Square", address: "Times Square, Manhattan, NY", lat: 40.758, lng: -73.9855, category: "cityscapes" },
  { name: "Statue of Liberty", address: "Liberty Island, New York, NY", lat: 40.6892, lng: -74.0445, category: "landmarks" },
  { name: "Grand Central Terminal", address: "89 E 42nd St, New York, NY", lat: 40.7527, lng: -73.9772, category: "landmarks" },
  { name: "High Line", address: "New York, NY 10011", lat: 40.748, lng: -74.0048, category: "nature" },
  { name: "One World Trade Center", address: "285 Fulton St, New York, NY", lat: 40.7127, lng: -74.0134, category: "landmarks" },
  { name: "Rockefeller Center", address: "45 Rockefeller Plaza, New York, NY", lat: 40.7587, lng: -73.9787, category: "landmarks" },
  { name: "Washington Square Park", address: "Washington Sq, New York, NY", lat: 40.7308, lng: -73.9973, category: "nature" },
  { name: "DUMBO", address: "DUMBO, Brooklyn, NY", lat: 40.7033, lng: -73.9883, category: "hidden-gems" },
  { name: "Flatiron Building", address: "175 5th Ave, New York, NY", lat: 40.7411, lng: -73.9897, category: "landmarks" },
  { name: "Chelsea Market", address: "75 9th Ave, New York, NY", lat: 40.7425, lng: -74.0061, category: "markets" },
  { name: "SoHo", address: "SoHo, Manhattan, NY", lat: 40.7233, lng: -73.9985, category: "hidden-gems" },
  { name: "Williamsburg", address: "Williamsburg, Brooklyn, NY", lat: 40.7081, lng: -73.9571, category: "hidden-gems" },
  { name: "Bryant Park", address: "Bryant Park, New York, NY", lat: 40.7536, lng: -73.9832, category: "nature" },
  { name: "Metropolitan Museum of Art", address: "1000 5th Ave, New York, NY", lat: 40.7794, lng: -73.9632, category: "landmarks" },
  { name: "Battery Park", address: "Battery Park, New York, NY", lat: 40.7033, lng: -74.0170, category: "nature" },
  { name: "Union Square", address: "Union Square, New York, NY", lat: 40.7359, lng: -73.9911, category: "cityscapes" },
  { name: "Madison Square Garden", address: "4 Pennsylvania Plaza, New York, NY", lat: 40.7505, lng: -73.9934, category: "events" },
  { name: "Brooklyn Botanic Garden", address: "990 Washington Ave, Brooklyn, NY", lat: 40.6694, lng: -73.9625, category: "nature" },
  { name: "Coney Island Beach", address: "Coney Island, Brooklyn, NY", lat: 40.5749, lng: -73.9859, category: "beaches" },
  { name: "Smorgasburg", address: "90 Kent Ave, Brooklyn, NY", lat: 40.7216, lng: -73.9614, category: "markets" },
  { name: "Little Italy", address: "Little Italy, Manhattan, NY", lat: 40.7191, lng: -73.9973, category: "food" },
  { name: "Chinatown", address: "Chinatown, Manhattan, NY", lat: 40.7158, lng: -73.9970, category: "food" },
  { name: "Prospect Park", address: "Prospect Park, Brooklyn, NY", lat: 40.6602, lng: -73.9690, category: "nature" },
  { name: "Wall Street", address: "Wall St, New York, NY", lat: 40.7074, lng: -74.0113, category: "cityscapes" },
  { name: "Radio City Music Hall", address: "1260 6th Ave, New York, NY", lat: 40.7600, lng: -73.9800, category: "events" },
  { name: "Brooklyn Flea", address: "80 Pearl St, Brooklyn, NY", lat: 40.7024, lng: -73.9870, category: "markets" },
  { name: "Governors Island", address: "Governors Island, New York, NY", lat: 40.6892, lng: -74.0167, category: "hidden-gems" },
  { name: "East Village", address: "East Village, Manhattan, NY", lat: 40.7265, lng: -73.9815, category: "food" },
  { name: "Hudson Yards", address: "Hudson Yards, New York, NY", lat: 40.7539, lng: -74.0014, category: "cityscapes" },
  { name: "The Vessel", address: "20 Hudson Yards, New York, NY", lat: 40.7542, lng: -74.0021, category: "landmarks" },
  { name: "St. Patrick's Cathedral", address: "5th Ave, New York, NY", lat: 40.7585, lng: -73.9760, category: "landmarks" },
  { name: "Yankee Stadium", address: "1 E 161st St, Bronx, NY", lat: 40.8296, lng: -73.9262, category: "events" },
  { name: "Roosevelt Island", address: "Roosevelt Island, New York, NY", lat: 40.7620, lng: -73.9510, category: "hidden-gems" },
  { name: "Bushwick", address: "Bushwick, Brooklyn, NY", lat: 40.6944, lng: -73.9213, category: "hidden-gems" },
  { name: "Rockaway Beach", address: "Rockaway Beach, Queens, NY", lat: 40.5834, lng: -73.8163, category: "beaches" },
  { name: "Arthur Avenue", address: "Arthur Ave, Bronx, NY", lat: 40.8554, lng: -73.8876, category: "food" },
  { name: "The Cloisters", address: "99 Margaret Corbin Dr, New York, NY", lat: 40.8649, lng: -73.9318, category: "landmarks" },
];

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
          {item.locationName}
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

      <View style={styles.cardReward}>
        <Text style={styles.cardRewardText}>${item.reward}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { getRequestsByCategory, activeRequestId, isAuthenticated, user } = useApp();
  const mapRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    if (activeRequestId) {
      router.replace({ pathname: "/lokater-mode/[id]", params: { id: activeRequestId } });
    }
  }, [activeRequestId]);

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

  const handleMapPress = useCallback((e: any) => {
    if (!e?.nativeEvent?.coordinate) return;
    if (!isAuthenticated) { router.push("/auth"); return; }
    const { latitude, longitude } = e.nativeEvent.coordinate;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const closest = POPULAR_LOCATIONS.reduce((best, loc) => {
      const d = Math.sqrt((loc.lat - latitude) ** 2 + (loc.lng - longitude) ** 2);
      return d < best.dist ? { loc, dist: d } : best;
    }, { loc: POPULAR_LOCATIONS[0], dist: Infinity });
    if (closest.dist < 0.008) {
      router.push({
        pathname: "/create-request",
        params: {
          lat: closest.loc.lat.toString(),
          lng: closest.loc.lng.toString(),
          name: closest.loc.name,
          addr: closest.loc.address,
          cat: closest.loc.category,
        },
      });
    } else {
      router.push({
        pathname: "/create-request",
        params: {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          name: "Custom Location",
          addr: "New York, NY",
          cat: "landmarks",
        },
      });
    }
  }, []);

  const handlePoiClick = useCallback((e: any) => {
    const poi = e?.nativeEvent;
    if (!poi?.coordinate) return;
    if (!isAuthenticated) { router.push("/auth"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = poi.name || "Selected Location";
    const { latitude, longitude } = poi.coordinate;
    const closest = POPULAR_LOCATIONS.reduce((best, loc) => {
      const d = Math.sqrt((loc.lat - latitude) ** 2 + (loc.lng - longitude) ** 2);
      return d < best.dist ? { loc, dist: d } : best;
    }, { loc: POPULAR_LOCATIONS[0], dist: Infinity });
    const cat = closest.dist < 0.005 ? closest.loc.category : "landmarks";
    router.push({
      pathname: "/create-request",
      params: {
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6),
        name,
        addr: closest.dist < 0.005 ? closest.loc.address : "New York, NY",
        cat,
      },
    });
  }, []);

  const handleCenterLocation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              // Web map is an iframe so we can't pan it easily, but we store for future
            },
            () => {},
            { enableHighAccuracy: true }
          );
        }
      } else {
        const Location = require("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 500);
          }
        }
      }
    } catch (e) {
      console.log("Location center error:", e);
    }
  }, []);

  const [remoteResults, setRemoteResults] = useState<typeof POPULAR_LOCATIONS>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return POPULAR_LOCATIONS.slice(0, 15);
    return POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q) ||
        (CATEGORIES.find(c => c.key === loc.category)?.label ?? "").toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const baseUrl = getApiUrl();
        const url = new URL(`/api/places/autocomplete?q=${encodeURIComponent(q)}`, baseUrl);
        const res = await fetch(url.toString());
        const data = await res.json();
        const mapped = (data.results || []).map((item: any) => {
          let cat: string = "landmarks";
          const types = (item.types || []).map((t: string) => t.toLowerCase());
          if (types.some((t: string) => ["park", "garden", "natural_feature", "campground"].includes(t))) cat = "nature";
          else if (types.some((t: string) => ["beach"].includes(t))) cat = "beaches";
          else if (types.some((t: string) => ["restaurant", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery", "food", "fast_food"].includes(t))) cat = "food";
          else if (types.some((t: string) => ["shopping_mall", "store", "supermarket", "marketplace", "shop", "clothing_store", "grocery_or_supermarket"].includes(t))) cat = "markets";
          else if (types.some((t: string) => ["stadium", "movie_theater", "night_club", "amusement_park", "festival", "theatre"].includes(t))) cat = "events";
          else if (types.some((t: string) => ["museum", "church", "synagogue", "mosque", "hindu_temple", "tourist_attraction", "point_of_interest", "monument", "memorial", "castle", "attraction", "viewpoint"].includes(t))) cat = "landmarks";
          else if (types.some((t: string) => ["locality", "administrative_area_level_1", "administrative_area_level_2", "political", "city", "town", "village", "suburb", "neighbourhood", "administrative"].includes(t))) cat = "cityscapes";
          return {
            name: item.name || q,
            address: item.address || "",
            lat: item.lat,
            lng: item.lng,
            category: cat,
          };
        });
        setRemoteResults(mapped);
      } catch (e) {
        console.log("Search error:", e);
        setRemoteResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return POPULAR_LOCATIONS.slice(0, 15);
    const localNames = new Set(localResults.map(l => l.name.toLowerCase()));
    const dedupedRemote = remoteResults.filter(r => !localNames.has(r.name.toLowerCase()));
    return [...localResults, ...dedupedRemote];
  }, [searchQuery, localResults, remoteResults]);

  const handleLocationSelect = (loc: typeof POPULAR_LOCATIONS[0]) => {
    if (!isAuthenticated) { setSearchVisible(false); router.push("/auth"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchVisible(false);
    setSearchQuery("");
    router.push({
      pathname: "/create-request",
      params: {
        lat: loc.lat.toString(),
        lng: loc.lng.toString(),
        name: loc.name,
        addr: loc.address,
        cat: loc.category,
      },
    });
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
          onMapPress={handleMapPress}
          onPoiClick={handlePoiClick}
        />
        <View
          style={[
            styles.mapOverlay,
            { paddingTop: insets.top + 10 + webInsetTop },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.searchBar}
            onPress={() => setSearchVisible(true)}
          >
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginLeft: 10 }} />
            <Text style={styles.searchPlaceholder}>Want to see something?</Text>
          </Pressable>

          <View style={styles.mapBottomRow} pointerEvents="box-none">
            <View />
            <Pressable style={styles.locationBtn} onPress={handleCenterLocation}>
              <Ionicons name="locate" size={20} color="#fff" />
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
          paddingBottom: Platform.OS === "web" ? 94 + 34 : insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={searchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSearchVisible(false);
          setSearchQuery("");
        }}
      >
        <View style={[styles.searchModal, { paddingTop: insets.top + 12 + webInsetTop }]}>
          <View style={styles.searchModalHeader}>
            <View style={styles.searchModalBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchModalInput}
                placeholder="Search for a location..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                setSearchVisible(false);
                setSearchQuery("");
              }}
              style={styles.searchCancelBtn}
            >
              <Text style={styles.searchCancelText}>Cancel</Text>
            </Pressable>
          </View>

          {!searchQuery.trim() && (
            <View style={styles.searchSectionHeader}>
              <Ionicons name="star" size={14} color={Colors.light.orange} />
              <Text style={styles.searchSectionTitle}>Popular Locations</Text>
            </View>
          )}
          {searchQuery.trim().length > 0 && (filteredLocations.length > 0 || isSearching) && (
            <View style={styles.searchSectionHeader}>
              <Ionicons name="search" size={14} color={Colors.light.tint} />
              <Text style={styles.searchSectionTitle}>
                {isSearching && filteredLocations.length === 0 ? "Searching..." : `${filteredLocations.length} result${filteredLocations.length !== 1 ? "s" : ""}`}
              </Text>
              {isSearching && <ActivityIndicator size="small" color={Colors.light.tint} style={{ marginLeft: 6 }} />}
            </View>
          )}
          <FlatList
            data={filteredLocations}
            keyExtractor={(item, index) => `${item.name}-${item.lat}-${index}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const catColor = getCategoryColor(item.category);
              const isRemote = !POPULAR_LOCATIONS.some(p => p.name === item.name);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.searchResult,
                    pressed && { backgroundColor: catColor + "08" },
                  ]}
                  onPress={() => handleLocationSelect(item)}
                >
                  <View style={[styles.searchResultIcon, { backgroundColor: catColor + "14" }]}>
                    <Ionicons
                      name={isRemote ? "globe-outline" : ((CATEGORIES.find(c => c.key === item.category)?.icon ?? "location") as any)}
                      size={16}
                      color={catColor}
                    />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.searchResultAddr} numberOfLines={1}>{item.address}</Text>
                  </View>
                  <View style={[styles.searchResultCatDot, { backgroundColor: catColor + "18" }]}>
                    <Text style={[styles.searchResultCatLabel, { color: catColor }]}>
                      {CATEGORIES.find(c => c.key === item.category)?.label ?? item.category}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.searchEmpty}>
                  <ActivityIndicator size="large" color={Colors.light.tint} />
                  <Text style={styles.searchEmptyText}>Searching worldwide...</Text>
                </View>
              ) : searchQuery.trim().length > 0 ? (
                <View style={styles.searchEmpty}>
                  <Ionicons name="location-outline" size={28} color={Colors.light.border} />
                  <Text style={styles.searchEmptyText}>No locations match "{searchQuery}"</Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
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
    paddingBottom: 36,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Archivo_400Regular",
    marginLeft: 10,
  },
  mapBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  locationBtn: {
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
    marginTop: -24,
    paddingTop: 4,
    marginHorizontal: 0,
  },
  categoriesSection: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 14,
    paddingHorizontal: 20,
    fontFamily: "Archivo_600SemiBold",
    letterSpacing: 0.1,
  },
  categoriesList: {
    paddingHorizontal: 20,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardLocationName: {
    fontSize: 14,
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
  cardReward: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardRewardText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Archivo_600SemiBold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  searchModal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchModalBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
    paddingVertical: 0,
  },
  searchCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  searchCancelText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontFamily: "Archivo_500Medium",
  },
  searchSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchSectionTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchResult: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  searchResultIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultInfo: {
    flex: 1,
    gap: 2,
  },
  searchResultName: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  searchResultAddr: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  searchResultCatDot: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchResultCatLabel: {
    fontSize: 10,
    fontFamily: "Archivo_600SemiBold",
  },
  searchEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  searchEmptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
});
