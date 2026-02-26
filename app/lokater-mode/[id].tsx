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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
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
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const lokaterIframeRef = useRef<HTMLIFrameElement>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);
  const watchRef = useRef<any>(null);
  const lastFetchOriginRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const request = requests.find((r) => r.id === id);

  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (userLocation && request) {
      fetchRoute(userLocation, { latitude: request.latitude, longitude: request.longitude });
    }
  }, [userLocation, request?.id]);

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

  const fetchRoute = useCallback(async (
    origin: { latitude: number; longitude: number },
    dest: { latitude: number; longitude: number }
  ) => {
    if (lastFetchOriginRef.current) {
      const dx = origin.latitude - lastFetchOriginRef.current.latitude;
      const dy = origin.longitude - lastFetchOriginRef.current.longitude;
      const distDeg = Math.sqrt(dx * dx + dy * dy);
      if (distDeg < 0.0009) return;
    }
    lastFetchOriginRef.current = origin;
    try {
      const base = getApiUrl();
      const url = `${base}api/directions?originLat=${origin.latitude}&originLng=${origin.longitude}&destLat=${dest.latitude}&destLng=${dest.longitude}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.polyline && data.polyline.length > 1) {
        setRoutePolyline(data.polyline);
      }
    } catch (e) {
      console.log("Route fetch error:", e);
    }
  }, []);

  const navigateHomeAbandoned = useCallback(() => {
    router.replace({ pathname: "/(tabs)", params: { abandoned: "1" } });
  }, []);

  const handleAbandon = useCallback(() => {
    setMenuVisible(false);
    if (Platform.OS === "web") {
      abandonRequest(id!);
      navigateHomeAbandoned();
    } else {
      Alert.alert(
        "Abandon Request",
        "Are you sure you want to abandon this request? It will become available for other LoKaters.",
        [
          { text: "Keep Going", style: "cancel" },
          {
            text: "Abandon",
            style: "destructive",
            onPress: () => {
              abandonRequest(id!);
              navigateHomeAbandoned();
            },
          },
        ]
      );
    }
  }, [id, abandonRequest, navigateHomeAbandoned]);

  const distance =
    userLocation && request
      ? haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          request.latitude,
          request.longitude
        )
      : null;

  const bearing =
    userLocation && request
      ? getBearing(
          userLocation.latitude,
          userLocation.longitude,
          request.latitude,
          request.longitude
        )
      : 0;

  const isCloseEnough = distance !== null && distance < 100;
  const isVeryClose = distance !== null && distance < 50;

  const handleTakePhoto = useCallback(() => {
    if (!isCloseEnough) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/camera/[id]",
      params: {
        id: id!,
        userLat: String(userLocation?.latitude ?? ""),
        userLng: String(userLocation?.longitude ?? ""),
      },
    });
  }, [id, isCloseEnough, userLocation]);

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

  const routeJson = JSON.stringify(routePolyline.map((p) => [p.latitude, p.longitude]));
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
var route=${routeJson};
var map=L.map('map',{center:[uLat,uLng],zoom:16,zoomControl:false,attributionControl:false});
L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom:20}).addTo(map);
var bounds=L.latLngBounds([[uLat,uLng],[dLat,dLng]]);
map.fitBounds(bounds,{padding:[80,80]});
if(route.length>1){
  L.polyline(route,{color:'#fff',weight:10,opacity:0.5}).addTo(map);
  L.polyline(route,{color:'#4285F4',weight:6,opacity:1,lineJoin:'round',lineCap:'round'}).addTo(map);
  map.fitBounds(L.polyline(route).getBounds(),{padding:[80,80]});
}
var userIcon=L.divIcon({html:'<div style="width:20px;height:20px;border-radius:10px;background:#4285F4;border:3px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>',className:'',iconSize:[20,20],iconAnchor:[10,10]});
L.marker([uLat,uLng],{icon:userIcon}).addTo(map);
var destIcon=L.divIcon({html:'<div style="width:32px;height:32px;border-radius:16px;background:${Colors.light.tint};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',className:'',iconSize:[32,32],iconAnchor:[16,16]});
L.marker([dLat,dLng],{icon:destIcon}).addTo(map);
window.addEventListener('message',function(event){try{var data=typeof event.data==='string'?JSON.parse(event.data):event.data;if(data.type==='centerLocation'){map.setView([data.lat,data.lng],16,{animate:true});}if(data.type==='updateRoute'&&data.route.length>1){map.eachLayer(function(l){if(l instanceof L.Polyline)map.removeLayer(l);});L.polyline(data.route,{color:'#fff',weight:10,opacity:0.5}).addTo(map);L.polyline(data.route,{color:'#4285F4',weight:6,opacity:1}).addTo(map);}}catch(e){}});
</script></body></html>`
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        {userLocation ? (
          Platform.OS === "web" ? (
            <iframe
              ref={lokaterIframeRef as any}
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
              routePolyline={routePolyline}
              bearing={bearing}
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
            router.replace({
              pathname: "/request-detail/[id]",
              params: { id: id! },
            })
          }
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          style={styles.topBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </Pressable>
      </View>

      <View style={[styles.locationStrip, { top: insets.top + 60 + webInsetTop }]} pointerEvents="none">
        <View style={styles.locationStripInner}>
          <Text style={[styles.locationStripLabel, isVeryClose && styles.locationStripLabelArrived]}>
            {isVeryClose ? "YOU HAVE REACHED" : "GOING TO"}
          </Text>
          <View style={styles.locationStripRow}>
            <Ionicons name="location" size={18} color={Colors.light.tint} />
            <Text style={styles.locationStripName} numberOfLines={1}>{request.locationName}</Text>
          </View>
          <View style={styles.locationStripMeta}>
            <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.locationStripEta}>
              {distance !== null ? formatETA(distance) : "--"}
            </Text>
            <View style={styles.locationStripDot} />
            <Ionicons name="navigate-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.locationStripDist}>
              {distance !== null ? formatDistance(distance) : "--"}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.lokaterLocBtn, { bottom: Platform.OS === "web" ? 34 + 16 + 160 : insets.bottom + 16 + 160 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (Platform.OS === "web") {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const iframe = lokaterIframeRef.current;
                  if (iframe && (iframe as any).contentWindow) {
                    (iframe as any).contentWindow.postMessage(
                      JSON.stringify({ type: "centerLocation", lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      "*"
                    );
                  }
                },
                () => {},
                { enableHighAccuracy: true }
              );
            }
          } else if (userLocation) {
            // native handled by NavigationMap
          }
        }}
      >
        <Ionicons name="locate" size={20} color="#fff" />
      </Pressable>

      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16 },
        ]}
      >
        {isVeryClose && (
          <View style={styles.arrivedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={Colors.light.accent}
            />
            <Text style={styles.arrivedText}>
              You're in range — find the perfect angle
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.chatFloatBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: id! } })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.light.tint} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.instructionsBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setInstructionsVisible(true);
            }}
          >
            <Ionicons name="document-text-outline" size={20} color={Colors.light.tint} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.photoBtn,
              { flex: 1 },
              isCloseEnough ? styles.photoBtnActive : styles.photoBtnLocked,
              isCloseEnough && pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleTakePhoto}
            disabled={!isCloseEnough}
          >
            <Ionicons
              name={isCloseEnough ? "camera" : "lock-closed"}
              size={22}
              color={isCloseEnough ? "#fff" : "rgba(255,255,255,0.5)"}
            />
            <Text style={[styles.photoBtnText, !isCloseEnough && { color: "rgba(255,255,255,0.5)" }]}>
              {isCloseEnough ? "Take Photo" : "Get Closer"}
            </Text>
          </Pressable>
        </View>

        {!isCloseEnough && distance !== null && (
          <View style={styles.distanceHintRow}>
            <Ionicons name="navigate-circle-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.distanceHint}>
              {distance < 500
                ? `${Math.round(distance)}m away — walk to the spot to unlock camera`
                : `${(distance / 1000).toFixed(1)}km away — navigate to the destination`}
            </Text>
          </View>
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

      <Modal
        visible={instructionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInstructionsVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setInstructionsVisible(false)}
        >
          <View
            style={[
              styles.instructionsSheet,
              {
                paddingBottom:
                  Platform.OS === "web" ? 34 + 16 : insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.menuHandle} />
            <Text style={styles.instructionsSheetTitle}>Instructions Given</Text>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIconWrap}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.instructionInfo}>
                <Text style={styles.instructionLabel}>Orientation</Text>
                <Text style={styles.instructionValue}>
                  {request.orientation === "portrait" ? "Portrait" : "Landscape"}
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIconWrap}>
                <Ionicons
                  name={request.angle === "looking-up" ? "arrow-up-circle-outline" : request.angle === "looking-down" ? "arrow-down-circle-outline" : "eye-outline"}
                  size={18}
                  color={Colors.light.tint}
                />
              </View>
              <View style={styles.instructionInfo}>
                <Text style={styles.instructionLabel}>Angle</Text>
                <Text style={styles.instructionValue}>
                  {request.angle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </View>
            </View>

            {request.note ? (
              <View style={styles.instructionNoteCard}>
                <Text style={styles.instructionNoteLabel}>Notes</Text>
                <Text style={styles.instructionNoteText}>{request.note}</Text>
              </View>
            ) : (
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconWrap}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.light.textSecondary} />
                </View>
                <View style={styles.instructionInfo}>
                  <Text style={styles.instructionLabel}>Notes</Text>
                  <Text style={[styles.instructionValue, { color: Colors.light.textSecondary }]}>No additional notes</Text>
                </View>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.menuCancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setInstructionsVisible(false)}
            >
              <Text style={styles.menuCancelText}>Close</Text>
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
    borderRadius: 12,
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
  container: { flex: 1, backgroundColor: "#1A1B2E" },
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A1B2E",
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
  locationStrip: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
  },
  locationStripLabel: {
    fontSize: 11,
    color: Colors.light.tint,
    fontFamily: "Archivo_700Bold",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  locationStripLabelArrived: {
    color: Colors.light.accent,
  },
  locationStripInner: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationStripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationStripName: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  locationStripMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 26,
  },
  locationStripEta: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  locationStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textSecondary,
  },
  locationStripDist: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  lokaterLocBtn: {
    position: "absolute",
    right: 16,
    zIndex: 15,
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
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
  arrivedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(123,192,67,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  arrivedText: {
    fontSize: 14,
    color: Colors.light.accent,
    fontFamily: "Archivo_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatFloatBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.06)",
  },
  instructionsBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.06)",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.light.tint,
    paddingVertical: 18,
    borderRadius: 12,
  },
  photoBtnActive: {
    backgroundColor: Colors.light.accent,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  photoBtnLocked: {
    backgroundColor: "rgba(124,58,237,0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.3)",
  },
  photoBtnText: {
    fontSize: 17,
    color: "#fff",
    fontFamily: "Archivo_600SemiBold",
  },
  distanceHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 4,
  },
  distanceHint: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_400Regular",
    flex: 1,
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
    borderRadius: 10,
  },
  menuItemIconDanger: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    marginTop: 4,
  },
  menuCancelText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_500Medium",
  },
  instructionsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  instructionsSheetTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Archivo_700Bold",
    marginBottom: 4,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  instructionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.light.tint + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionInfo: {
    flex: 1,
    gap: 2,
  },
  instructionLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  instructionValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Archivo_600SemiBold",
  },
  instructionNoteCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  instructionNoteLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: "Archivo_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  instructionNoteText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Archivo_400Regular",
    lineHeight: 22,
  },
});
