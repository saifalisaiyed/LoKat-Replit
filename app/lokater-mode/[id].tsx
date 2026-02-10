import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import NavigationMap from "@/components/NavigationMap";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 100) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatETA(meters: number): string {
  const walkingSpeedMps = 1.4;
  const seconds = meters / walkingSpeedMps;
  const mins = Math.ceil(seconds / 60);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getDirectionLabel(bearing: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(bearing / 45) % 8;
  return dirs[idx];
}

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
        withTiming(0.5, { duration: 0 })
      ),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={navStyles.pulseContainer}>
      <Animated.View style={[navStyles.pulseRing, pulseStyle]} />
      <View style={navStyles.userDot} />
    </View>
  );
}

export default function LoKaterModeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, abandonRequest, activeRequestId } = useApp();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [menuVisible, setMenuVisible] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchRef = useRef<any>(null);

  const request = requests.find((r) => r.id === id);

  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = async () => {
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              setUserLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
              setIsTracking(true);
            },
            () => {
              setUserLocation({
                latitude: 40.748 + (Math.random() - 0.5) * 0.01,
                longitude: -73.986 + (Math.random() - 0.5) * 0.01,
              });
              setIsTracking(true);
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
          );
        } else {
          setUserLocation({ latitude: 40.748, longitude: -73.986 });
          setIsTracking(true);
        }
      } else {
        const Location = require("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError(true);
          return;
        }
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc: any) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            setIsTracking(true);
          }
        );
        watchRef.current = sub;
      }
    } catch (e) {
      console.log("Tracking error:", e);
      setUserLocation({ latitude: 40.748, longitude: -73.986 });
      setIsTracking(true);
    }
  };

  const stopTracking = () => {
    if (Platform.OS === "web") {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    } else {
      if (watchRef.current?.remove) {
        watchRef.current.remove();
      }
    }
  };

  const handleAbandon = useCallback(() => {
    setMenuVisible(false);
    if (Platform.OS === "web") {
      abandonRequest(id!);
      router.dismissAll();
      router.replace("/(tabs)");
    } else {
      Alert.alert(
        "Abandon Request",
        "Are you sure you want to abandon this request? It will become available for other LoKaters.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Abandon",
            style: "destructive",
            onPress: () => {
              abandonRequest(id!);
              router.dismissAll();
              router.replace("/(tabs)");
            },
          },
        ]
      );
    }
  }, [id, abandonRequest]);

  const handleTakePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({ pathname: "/camera/[id]", params: { id: id! } });
  }, [id]);

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

  const distance = userLocation
    ? haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        request.latitude,
        request.longitude
      )
    : null;

  const bearing = userLocation
    ? getBearing(
        userLocation.latitude,
        userLocation.longitude,
        request.latitude,
        request.longitude
      )
    : 0;

  const isCloseEnough = distance !== null && distance < 200;
  const isVeryClose = distance !== null && distance < 50;

  const mapHtml = userLocation
    ? `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}#map{width:100%;height:100vh}.leaflet-control-zoom,.leaflet-control-attribution{display:none}</style>
</head><body><div id="map"></div>
<script>
var uLat=${userLocation.latitude},uLng=${userLocation.longitude};
var dLat=${request.latitude},dLng=${request.longitude};
var midLat=(uLat+dLat)/2,midLng=(uLng+dLng)/2;
var map=L.map('map',{center:[midLat,midLng],zoom:15,zoomControl:false,attributionControl:false});
L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom:20}).addTo(map);
var bounds=L.latLngBounds([[uLat,uLng],[dLat,dLng]]);
map.fitBounds(bounds,{padding:[60,60]});
L.polyline([[uLat,uLng],[dLat,dLng]],{color:'${Colors.light.tint}',weight:4,opacity:0.7,dashArray:'8,12'}).addTo(map);
var userIcon=L.divIcon({html:'<div style="width:20px;height:20px;border-radius:10px;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.5)"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10]});
L.marker([uLat,uLng],{icon:userIcon}).addTo(map);
var destIcon=L.divIcon({html:'<div style="width:32px;height:32px;border-radius:16px;background:${Colors.light.tint};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',className:'',iconSize:[32,32],iconAnchor:[16,16]});
L.marker([dLat,dLng],{icon:destIcon}).addTo(map);
</script></body></html>`
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        {userLocation ? (
          Platform.OS === "web" ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Navigation"
            />
          ) : (
            <NavigationMap
              userLocation={userLocation}
              destination={{
                latitude: request.latitude,
                longitude: request.longitude,
              }}
            />
          )
        ) : (
          <View style={[styles.mapArea, styles.centered]}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}
      </View>

      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 + webInsetTop }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.topBtn}
          onPress={() =>
            router.push({
              pathname: "/request-detail/[id]",
              params: { id: id! },
            })
          }
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <View style={styles.navBadge}>
          <Ionicons name="navigate" size={14} color={Colors.light.tint} />
          <Text style={styles.navBadgeText}>LoKater Mode</Text>
        </View>

        <Pressable
          style={styles.topBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </Pressable>
      </View>

      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16 },
        ]}
      >
        <View style={styles.destinationRow}>
          <View style={styles.destIcon}>
            <Ionicons name="location" size={20} color={Colors.light.tint} />
          </View>
          <View style={styles.destInfo}>
            <Text style={styles.destName} numberOfLines={1}>
              {request.locationName}
            </Text>
            <Text style={styles.destAddr} numberOfLines={1}>
              {request.address}
            </Text>
          </View>
          <View style={styles.rewardChip}>
            <Text style={styles.rewardText}>${request.reward}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={Colors.light.tint}
            />
            <Text style={styles.statValue}>
              {distance !== null ? formatDistance(distance) : "--"}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="walk" size={18} color={Colors.light.tint} />
            <Text style={styles.statValue}>
              {distance !== null ? formatETA(distance) : "--"}
            </Text>
            <Text style={styles.statLabel}>Walking</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="compass"
              size={18}
              color={Colors.light.tint}
            />
            <Text style={styles.statValue}>
              {userLocation ? getDirectionLabel(bearing) : "--"}
            </Text>
            <Text style={styles.statLabel}>Direction</Text>
          </View>
        </View>

        {isVeryClose && (
          <View style={styles.arrivedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={Colors.light.accent}
            />
            <Text style={styles.arrivedText}>
              You've arrived at the location!
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.photoBtn,
            isCloseEnough && styles.photoBtnActive,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera" size={22} color="#fff" />
          <Text style={styles.photoBtnText}>
            {isCloseEnough ? "Take Photo" : "Take Photo"}
          </Text>
        </Pressable>

        {!isCloseEnough && distance !== null && (
          <Text style={styles.distanceHint}>
            Walk closer to the destination to get the best shot
          </Text>
        )}
      </View>

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
          <View
            style={[
              styles.menuSheet,
              {
                paddingBottom:
                  Platform.OS === "web" ? 34 + 16 : insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Options</Text>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: "#FEE2E2" },
              ]}
              onPress={handleAbandon}
            >
              <View style={styles.menuItemIconDanger}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemTextDanger}>Abandon Request</Text>
                <Text style={styles.menuItemSub}>
                  Release this request for other LoKaters
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuCancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const navStyles = StyleSheet.create({
  pulseContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59,130,246,0.3)",
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "#fff",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  backLink: {
    fontSize: 15,
    color: Colors.light.tint,
    marginTop: 12,
    fontFamily: "Archivo_500Medium",
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontFamily: "Archivo_400Regular",
  },
  mapArea: {
    flex: 1,
    backgroundColor: "#e5e3df",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  navBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  navBadgeText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontFamily: "Archivo_600SemiBold",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
    gap: 16,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  destIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.tint + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  destInfo: {
    flex: 1,
    gap: 2,
  },
  destName: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  destAddr: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  rewardChip: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Archivo_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  arrivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(123,192,67,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  arrivedText: {
    fontSize: 14,
    color: Colors.light.accent,
    fontFamily: "Archivo_600SemiBold",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.tint,
    paddingVertical: 18,
    borderRadius: 16,
  },
  photoBtnActive: {
    backgroundColor: Colors.light.accent,
  },
  photoBtnText: {
    fontSize: 17,
    color: "#fff",
    fontFamily: "Archivo_600SemiBold",
  },
  distanceHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  menuItemIconDanger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemInfo: {
    flex: 1,
    gap: 2,
  },
  menuItemTextDanger: {
    fontSize: 15,
    color: "#EF4444",
    fontFamily: "Archivo_600SemiBold",
  },
  menuItemSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
  },
  menuCancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    marginTop: 4,
  },
  menuCancelText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
});
