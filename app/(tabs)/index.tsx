import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMapFilters } from "@/hooks/useMapFilters";
import { useHomeSearch } from "@/hooks/useHomeSearch";
import { View, Pressable, Text, ScrollView, FlatList, Platform, Dimensions, TextInput, Modal, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import { CATEGORIES, type Category } from "@/lib/types";
import MapViewWrapper from "@/components/MapViewWrapper";
import AuthPromptModal, { type AuthPromptContext } from "@/components/AuthPromptModal";
import {
  BLACK,
  BLACK_A05,
  BLACK_A15,
  BLACK_A55,
  BLUE,
  DARK_GLASS,
  DARK_MAP,
  GOLD,
  GRASS,
  GRAY_105,
  GRAY_110,
  GRAY_130,
  GRAY_170,
  GRAY_450,
  GRAY_600,
  GRAY_850,
  GRAY_90,
  GREEN_500,
  ORANGE,
  PINK,
  PURPLE,
  PURPLE_LIGHT,
  RED,
  TEAL,
  WHITE,
  WHITE_A25,
  WHITE_A70,
  WHITE_A95,
} from "@/constants/colors";

import styles from "./index.styles";

const LOCATION_FILTERS = [
  { key: "anywhere", label: "Anywhere", icon: "globe-outline" },
  { key: "near-me", label: "Near Me", icon: "navigate-outline" },
] as const;

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CATEGORY_COLORS: Record<string, string> = {
  landmarks: GOLD,
  nature: GREEN_500,
  markets: PINK,
  beaches: ORANGE,
  cityscapes: BLUE,
  food: RED,
  "hidden-gems": PURPLE_LIGHT,
  events: TEAL,
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
  return CATEGORY_COLORS[key] || PURPLE;
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

function getDistanceMi(lat: number, lng: number, userCoords: { latitude: number; longitude: number } | null): string {
  const userLat = userCoords?.latitude ?? 40.758;
  const userLng = userCoords?.longitude ?? -73.9855;
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

function RequestCard({ item, onPress, userCoords }: { item: any; onPress: () => void; userCoords: { latitude: number; longitude: number } | null }) {
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
          <Ionicons name="navigate-circle-outline" size={13} color={GRAY_600} />
          <Text style={styles.cardDistance}>
            {getDistanceMi(item.latitude, item.longitude, userCoords)}
          </Text>
          <Ionicons name="time-outline" size={13} color={ORANGE} />
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
  const params = useLocalSearchParams<{ abandoned?: string }>();
  const { getRequestsByCategory, activeRequestId, isAuthenticated, user, abandonRequest } = useApp();
  const mapRef = useRef<any>(null);
  const {
    selectedCategory, setSelectedCategory,
    permissionStatus, setPermissionStatus,
    locationFilter, setLocationFilter,
    locationFilterVisible, setLocationFilterVisible,
    myCoords, setMyCoords,
    heatmapEnabled, setHeatmapEnabled,
  } = useMapFilters();
  const {
    searchVisible, setSearchVisible,
    searchQuery, setSearchQuery,
    remoteResults, setRemoteResults,
    isSearching, setIsSearching,
  } = useHomeSearch();
  const searchInputRef = useRef<TextInput>(null);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [authPromptContext, setAuthPromptContext] = useState<AuthPromptContext>("create-request");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [menuVisible, setMenuVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity]);

  useEffect(() => {
    if (params.abandoned === "1") {
      showToast("Request abandoned");
    }
  }, [params.abandoned]);

  const [activeRequestPrompt, setActiveRequestPrompt] = useState(true);

  useEffect(() => {
    setActiveRequestPrompt(true);
  }, [activeRequestId]);

  const initialRegion = {
    latitude: 40.758,
    longitude: -73.9855,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setMyCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: true }
        );
      }
    } else {
      requestLocation();
    }
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch (error) {
      console.log("Location error:", error);
    }
  };

  const categoryFiltered = getRequestsByCategory(selectedCategory);

  const openRequests = useMemo(() => {
    let filtered = categoryFiltered;
    
    // For admins, show everything. For users, show only open.
    if (user && !user.isAdmin) {
      filtered = filtered.filter((req) => req.status === "open");
    }

    if (locationFilter === "anywhere") return filtered;
    if (locationFilter === "near-me") {
      if (!myCoords) return filtered;
      return filtered.filter((req) =>
        getDistanceKm(myCoords.latitude, myCoords.longitude, req.latitude, req.longitude) <= 25
      );
    }
    return filtered;
  }, [categoryFiltered, locationFilter, myCoords, user]);

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

  const handleMapPress = useCallback((event: any) => {
    if (!event?.nativeEvent?.coordinate) return;
    if (!isAuthenticated) { setAuthPromptContext("create-request"); setAuthPromptVisible(true); return; }
    const { latitude, longitude } = event.nativeEvent.coordinate;
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
          cat: "landmarks",
        },
      });
    }
  }, []);

  const handlePoiClick = useCallback((event: any) => {
    const poi = event?.nativeEvent;
    if (!poi?.coordinate) return;
    if (!isAuthenticated) { setAuthPromptContext("create-request"); setAuthPromptVisible(true); return; }
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
        addr: closest.dist < 0.005 ? closest.loc.address : "",
        cat,
      },
    });
  }, []);

  const myCoordsRef = useRef(myCoords);
  useEffect(() => { myCoordsRef.current = myCoords; }, [myCoords]);

  const animateMapToCoords = useCallback((latitude: number, longitude: number) => {
    if (!mapRef.current) return;
    if (mapRef.current.animateCamera) {
      mapRef.current.animateCamera(
        { center: { latitude, longitude }, zoom: 15, altitude: 1000, pitch: 0, heading: 0 },
        { duration: 600 }
      );
    } else if (mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
    } else if (mapRef.current.centerToLocation) {
      mapRef.current.centerToLocation(latitude, longitude);
    }
  }, []);

  const handleCenterLocation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => animateMapToCoords(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: false, timeout: 3000 }
          );
        }
      } else {
        if (myCoordsRef.current) {
          animateMapToCoords(myCoordsRef.current.latitude, myCoordsRef.current.longitude);
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            animateMapToCoords(last.coords.latitude, last.coords.longitude);
            setMyCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
            return;
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          animateMapToCoords(loc.coords.latitude, loc.coords.longitude);
          setMyCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      }
    } catch (error) {
      console.log("Location center error:", error);
    }
  }, [animateMapToCoords]);

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
            types: (item.types || []) as string[],
          };
        });
        setRemoteResults(mapped);
      } catch (error) {
        console.log("Search error:", error);
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
    const dedupedRemote = remoteResults.filter(result => !localNames.has(result.name.toLowerCase()));
    return [...localResults, ...dedupedRemote];
  }, [searchQuery, localResults, remoteResults]);

  const handleLocationSelect = (loc: typeof POPULAR_LOCATIONS[0] & { types?: string[] }) => {
    if (!isAuthenticated) { setSearchVisible(false); setAuthPromptContext("create-request"); setAuthPromptVisible(true); return; }
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
        placeTypes: loc.types ? JSON.stringify(loc.types) : "[]",
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
          showHeatmap={heatmapEnabled}
        />
        <View
          style={[
            styles.mapOverlay,
            { paddingTop: insets.top + 10 + webInsetTop },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.searchRow}>
            <Pressable
              style={styles.searchBar}
              onPress={() => setSearchVisible(true)}
            >
              <Ionicons name="search" size={18} color={GRAY_450} style={{ marginLeft: 10 }} />
              <Text style={styles.searchPlaceholder}>Want to see something?</Text>
            </Pressable>
            <View>
              <Pressable
                style={styles.menuBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMenuVisible(!menuVisible);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={GRAY_600} />
              </Pressable>
              {menuVisible && (
                <View style={styles.menuDropdown}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setHeatmapEnabled(!heatmapEnabled);
                      setMenuVisible(false);
                    }}
                  >
                    <Ionicons
                      name={heatmapEnabled ? "flame" : "flame-outline"}
                      size={16}
                      color={heatmapEnabled ? PURPLE : GRAY_600}
                    />
                    <Text style={[styles.menuItemText, heatmapEnabled && { color: PURPLE }]}>
                      Heatmap
                    </Text>
                    <View style={[styles.menuToggle, heatmapEnabled && styles.menuToggleOn]}>
                      <View style={[styles.menuToggleThumb, heatmapEnabled && styles.menuToggleThumbOn]} />
                    </View>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={styles.mapBottomRow} pointerEvents="box-none">
            <View />
            <Pressable style={styles.locationBtn} onPress={handleCenterLocation}>
              <Ionicons name="locate" size={20} color={WHITE} />
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
                    isActive && { backgroundColor: PURPLE, borderColor: PURPLE },
                  ]}
                  onPress={() => handleCategoryPress(cat.key)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={15}
                    color={isActive ? WHITE : catColor}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && { color: WHITE },
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
          <Text style={[styles.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>
            Incoming Requests ({openRequests.length})
          </Text>
          <Pressable
            style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationFilterVisible(!locationFilterVisible);
            }}
          >
            <Ionicons
              name={locationFilter === "anywhere" ? "funnel-outline" : "funnel"}
              size={13}
              color={locationFilter === "anywhere" ? GRAY_600 : PURPLE}
            />
            <Text style={[
              styles.filterBtnText,
              locationFilter !== "anywhere" && { color: PURPLE },
            ]}>
              {LOCATION_FILTERS.find((f) => f.key === locationFilter)?.label || "Anywhere"}
            </Text>
            <Ionicons name="chevron-down" size={12} color={GRAY_600} />
          </Pressable>
        </View>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={36} color={GRAY_170} />
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
            userCoords={myCoords}
          />
        )}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 94 + 34 : insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      />

      {locationFilterVisible && (
        <Modal transparent animationType="fade" onRequestClose={() => setLocationFilterVisible(false)}>
          <Pressable
            style={styles.filterOverlay}
            onPress={() => setLocationFilterVisible(false)}
          >
            <View style={styles.filterDropdown}>
              {LOCATION_FILTERS.map((f) => {
                const isActive = locationFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.dropdownOption, isActive && styles.dropdownOptionActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLocationFilter(f.key);
                      setLocationFilterVisible(false);
                    }}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={16}
                      color={isActive ? PURPLE : GRAY_600}
                    />
                    <Text style={[styles.dropdownLabel, isActive && styles.dropdownLabelActive]}>
                      {f.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={14} color={PURPLE} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}

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
              <Ionicons name="search" size={18} color={GRAY_450} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchModalInput}
                placeholder="Search for a location..."
                placeholderTextColor={GRAY_450}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={GRAY_450} />
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
              <Ionicons name="star" size={14} color={ORANGE} />
              <Text style={styles.searchSectionTitle}>Popular Locations</Text>
            </View>
          )}
          {searchQuery.trim().length > 0 && (filteredLocations.length > 0 || isSearching) && (
            <View style={styles.searchSectionHeader}>
              <Ionicons name="search" size={14} color={PURPLE} />
              <Text style={styles.searchSectionTitle}>
                {isSearching && filteredLocations.length === 0 ? "Searching..." : `${filteredLocations.length} result${filteredLocations.length !== 1 ? "s" : ""}`}
              </Text>
              {isSearching && <ActivityIndicator size="small" color={PURPLE} style={{ marginLeft: 6 }} />}
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
                  <ActivityIndicator size="large" color={PURPLE} />
                  <Text style={styles.searchEmptyText}>Searching worldwide...</Text>
                </View>
              ) : searchQuery.trim().length > 0 ? (
                <View style={styles.searchEmpty}>
                  <Ionicons name="location-outline" size={28} color={GRAY_170} />
                  <Text style={styles.searchEmptyText}>{`No locations match "${searchQuery}"`}</Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>

      <AuthPromptModal
        visible={authPromptVisible}
        onClose={() => setAuthPromptVisible(false)}
        context={authPromptContext}
      />

      {activeRequestId && activeRequestPrompt && (
        <View
          style={[
            styles.activeRequestBanner,
            { top: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 },
          ]}
        >
          <Ionicons name="walk" size={18} color={WHITE} />
          <Text style={styles.activeRequestBannerText} numberOfLines={1}>
            You have an active request
          </Text>
          <Pressable
            style={styles.activeRequestBannerBtn}
            onPress={() =>
              router.push({ pathname: "/lokater-mode/[id]", params: { id: activeRequestId } })
            }
          >
            <Text style={styles.activeRequestBannerBtnText}>Continue</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={async () => {
              setActiveRequestPrompt(false);
              await abandonRequest(activeRequestId);
            }}
          >
            <Ionicons name="close" size={18} color={WHITE_A70} />
          </Pressable>
        </View>
      )}

      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              bottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 80,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={18} color={WHITE} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}
