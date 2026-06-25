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
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useNavigation, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/lib/store";
import { getApiUrl } from "@/lib/query-client";
import NavigationMap from "@/components/NavigationMap";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  BLACK,
  BLACK_A40,
  BLACK_A55,
  DARK_MAP,
  GRASS,
  GRASS_A10,
  GRAY_105,
  GRAY_170,
  GRAY_600,
  GRAY_800,
  GRAY_850,
  GREEN_500,
  ORANGE,
  PURPLE,
  PURPLE_A06,
  PURPLE_A07,
  PURPLE_A12,
  PURPLE_A18,
  PURPLE_A25,
  PURPLE_A30,
  RED,
  RED_100,
  WHITE,
  WHITE_A50,
  WHITE_A92,
  WHITE_A95,
} from "@/constants/colors";

const { width: _SCREEN_WIDTH, height: _SCREEN_HEIGHT } = Dimensions.get("window");

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
  const toDeg = (radians: number) => (radians * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const bearingY = Math.sin(dLon) * Math.cos(toRad(lat2));
  const bearingX =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(bearingY, bearingX)) + 360) % 360;
}

function getDirectionLabel(bearing: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(bearing / 45) % 8;
  return dirs[idx];
}

function getNextRouteWaypoint(
  userLat: number,
  userLng: number,
  route: { latitude: number; longitude: number }[]
): { latitude: number; longitude: number } | null {
  if (route.length < 2) return null;
  let closestIdx = 0;
  let closestDist = Infinity;
  for (let routeIndex = 0; routeIndex < route.length; routeIndex++) {
    const dist = haversineDistance(userLat, userLng, route[routeIndex].latitude, route[routeIndex].longitude);
    if (dist < closestDist) { closestDist = dist; closestIdx = routeIndex; }
  }
  const lookAhead = Math.min(closestIdx + 5, route.length - 1);
  return route[lookAhead];
}

function normalizeAngle(a: number): number {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

function getTurnInfo(relAngle: number): { rotation: number; label: string; color: string } {
  if (relAngle < -45) return { rotation: -90, label: "Sharp Left", color: RED };
  if (relAngle < -20) return { rotation: -48, label: "Turn Left", color: ORANGE };
  if (relAngle <= 20)  return { rotation: 0,   label: "Head Straight", color: GREEN_500 };
  if (relAngle <= 45)  return { rotation: 48,  label: "Turn Right", color: ORANGE };
  return { rotation: 90, label: "Sharp Right", color: RED };
}

const ANGLE_CONFIG = {
  "looking-up": {
    icon: "arrow-up-circle-outline" as const,
    text: "Aim upward",
    hint: "Tilt the top of your phone away from you",
  },
  "eye-level": {
    icon: "remove-circle-outline" as const,
    text: "Hold at eye level",
    hint: "Keep the phone pointing straight ahead",
  },
  "looking-down": {
    icon: "arrow-down-circle-outline" as const,
    text: "Aim downward",
    hint: "Tilt the top of your phone toward you",
  },
};

export default function LoKaterModeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, abandonRequest } = useApp();
  const navigation = useNavigation();
  const webInsetTop = Platform.OS === "web" ? 67 : 0;
  const [menuVisible, setMenuVisible] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace({ pathname: "/request-detail/[id]", params: { id } });
      return true;
    });
    return () => sub.remove();
  }, [navigation, id]);
  const lokaterIframeRef = useRef<HTMLIFrameElement>(null);
  const navMapRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [_locationError, setLocationError] = useState(false);
  const [_isTracking, setIsTracking] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [routePolyline, setRoutePolyline] = useState<{ latitude: number; longitude: number }[]>([]);
  const magnetometerSubRef = useRef<any>(null);

  const arrowRotation = useSharedValue(0);
  const arrowOpacity = useSharedValue(0);
  const watchRef = useRef<any>(null);
  const lastFetchOriginRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [freshRequest, setFreshRequest] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const url = new URL(`/api/requests/${id}`, getApiUrl());
      fetch(url.toString(), { credentials: "include" })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setFreshRequest(data); })
        .catch(() => {});
    }, [id])
  );

  const request = freshRequest || requests.find((req) => req.id === id);

  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const { Magnetometer } = require("expo-sensors");
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
      const radian = Math.atan2(-data.x, data.y);
      let heading = radian * (180 / Math.PI);
      if (heading < 0) heading += 360;
      setDeviceHeading(Math.round(heading));
    });
    magnetometerSubRef.current = sub;
    return () => {
      sub.remove();
      magnetometerSubRef.current = null;
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
          { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 1000 },
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
    } catch (error) {
      console.log("Tracking error:", error);
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
    } catch (error) {
      console.log("Route fetch error:", error);
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

  const nextWaypoint =
    userLocation && routePolyline.length > 1
      ? getNextRouteWaypoint(userLocation.latitude, userLocation.longitude, routePolyline)
      : null;

  const turnInfo = (() => {
    if (!userLocation || isVeryClose) return null;
    const target = nextWaypoint ?? (request ? { latitude: request.latitude, longitude: request.longitude } : null);
    if (!target) return null;
    const bearingToTarget = getBearing(userLocation.latitude, userLocation.longitude, target.latitude, target.longitude);
    if (deviceHeading === null) {
      return { rotation: 0, label: getDirectionLabel(bearingToTarget) + " to destination", color: PURPLE };
    }
    return getTurnInfo(normalizeAngle(bearingToTarget - deviceHeading));
  })();

  useEffect(() => {
    if (turnInfo) {
      arrowRotation.value = withTiming(turnInfo.rotation, { duration: 180, easing: Easing.out(Easing.quad) });
      arrowOpacity.value = withTiming(1, { duration: 200 });
    } else {
      arrowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [turnInfo?.rotation, !!turnInfo]);

  const arrowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));
  const turnHudStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

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
var destIcon=L.divIcon({html:'<div style="width:32px;height:32px;border-radius:16px;background:${PURPLE};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',className:'',iconSize:[32,32],iconAnchor:[16,16]});
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
              ref={navMapRef}
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
            <ActivityIndicator size="large" color={PURPLE} />
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
          <Ionicons name="arrow-back" size={22} color={GRAY_800} />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable
          style={styles.topBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={GRAY_800} />
        </Pressable>
      </View>

      <View style={[styles.locationStrip, { top: insets.top + 60 + webInsetTop }]} pointerEvents="none">
        <View style={styles.locationStripInner}>
          <Text style={[styles.locationStripLabel, isVeryClose && styles.locationStripLabelArrived]}>
            {isVeryClose ? "YOU HAVE REACHED" : "GOING TO"}
          </Text>
          <View style={styles.locationStripRow}>
            <Ionicons name="location" size={18} color={PURPLE} />
            <Text style={styles.locationStripName} numberOfLines={1}>{request.locationName}</Text>
          </View>
          <View style={styles.locationStripMeta}>
            <Ionicons name="time-outline" size={14} color={GRAY_600} />
            <Text style={styles.locationStripEta}>
              {distance !== null ? formatETA(distance) : "--"}
            </Text>
            <View style={styles.locationStripDot} />
            <Ionicons name="navigate-outline" size={14} color={GRAY_600} />
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
          } else {
            navMapRef.current?.recenter();
          }
        }}
      >
        <Ionicons name="locate" size={20} color={WHITE} />
      </Pressable>

      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16 },
        ]}
      >
        {Platform.OS !== "web" && turnInfo && !isVeryClose && (
          <Animated.View style={[styles.navRow, turnHudStyle]}>
            <View style={[styles.navArrowBubble, { backgroundColor: turnInfo.color + "1A" }]}>
              <Animated.View style={arrowAnimStyle}>
                <Ionicons name="arrow-up" size={26} color={turnInfo.color} />
              </Animated.View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.navRowLabel, { color: turnInfo.color }]}>{turnInfo.label}</Text>
              {distance !== null && (
                <Text style={styles.navRowDist}>{formatDistance(distance)} to destination</Text>
              )}
            </View>
          </Animated.View>
        )}

        {isCloseEnough && (
          <View style={styles.arrivedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={GRASS}
            />
            <Text style={styles.arrivedText}>
              You're in range — find the perfect angle
            </Text>
          </View>
        )}

        {isCloseEnough && request.angle && (() => {
          const cfg = ANGLE_CONFIG[request.angle as keyof typeof ANGLE_CONFIG] ?? ANGLE_CONFIG["eye-level"];
          return (
            <View style={styles.angleBanner}>
              <View style={styles.angleBannerIcon}>
                <Ionicons name={cfg.icon} size={20} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.angleBannerTitle}>{cfg.text}</Text>
                <Text style={styles.angleBannerHint}>{cfg.hint}</Text>
              </View>
            </View>
          );
        })()}

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.chatFloatBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: id! } })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={PURPLE} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.instructionsBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setInstructionsVisible(true);
            }}
          >
            <Ionicons name="document-text-outline" size={20} color={PURPLE} />
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
              color={isCloseEnough ? WHITE : WHITE_A50}
            />
            <Text style={[styles.photoBtnText, !isCloseEnough && { color: WHITE_A50 }]}>
              {isCloseEnough ? "Take Photo" : "Get Closer"}
            </Text>
          </Pressable>
        </View>

        {!isCloseEnough && distance !== null && (
          <View style={styles.distanceHintRow}>
            <Ionicons name="navigate-circle-outline" size={14} color={GRAY_600} />
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
                pressed && { backgroundColor: RED_100 },
              ]}
              onPress={handleAbandon}
            >
              <View style={styles.menuItemIconDanger}>
                <Ionicons name="close-circle-outline" size={20} color={RED} />
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
                <Ionicons name="phone-portrait-outline" size={18} color={PURPLE} />
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
                  color={PURPLE}
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
                  <Ionicons name="document-text-outline" size={18} color={GRAY_600} />
                </View>
                <View style={styles.instructionInfo}>
                  <Text style={styles.instructionLabel}>Notes</Text>
                  <Text style={[styles.instructionValue, { color: GRAY_600 }]}>No additional notes</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_MAP },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: {
    fontSize: 16,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  backLink: {
    fontSize: 15,
    color: PURPLE,
    marginTop: 12,
    fontFamily: "Archivo_500Medium",
  },
  loadingText: {
    fontSize: 14,
    color: GRAY_600,
    marginTop: 8,
    fontFamily: "Archivo_400Regular",
  },
  mapArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK_MAP,
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
    backgroundColor: WHITE_A92,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLACK,
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
    color: PURPLE,
    fontFamily: "Archivo_700Bold",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  locationStripLabelArrived: {
    color: GRASS,
  },
  locationStripInner: {
    backgroundColor: WHITE_A95,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    shadowColor: BLACK,
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
    color: GRAY_850,
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
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  locationStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRAY_600,
  },
  locationStripDist: {
    fontSize: 14,
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  lokaterLocBtn: {
    position: "absolute",
    right: 16,
    zIndex: 15,
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: BLACK_A55,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: BLACK,
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
    backgroundColor: GRASS_A10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  arrivedText: {
    fontSize: 14,
    color: GRASS,
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
    borderColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE_A06,
  },
  instructionsBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE_A06,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PURPLE,
    paddingVertical: 18,
    borderRadius: 12,
  },
  photoBtnActive: {
    backgroundColor: GRASS,
    shadowColor: GRASS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  photoBtnLocked: {
    backgroundColor: PURPLE_A25,
    borderWidth: 1.5,
    borderColor: PURPLE_A30,
  },
  photoBtnText: {
    fontSize: 17,
    color: WHITE,
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
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    flex: 1,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  navArrowBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navRowLabel: {
    fontSize: 16,
    fontFamily: "Archivo_700Bold",
    letterSpacing: 0.1,
  },
  navRowDist: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    marginTop: 2,
  },
  angleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: PURPLE_A07,
    borderWidth: 1,
    borderColor: PURPLE_A18,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  angleBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: PURPLE_A12,
    alignItems: "center",
    justifyContent: "center",
  },
  angleBannerTitle: {
    fontSize: 14,
    color: PURPLE,
    fontFamily: "Archivo_600SemiBold",
  },
  angleBannerHint: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
    marginTop: 1,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: BLACK_A40,
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: WHITE,
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
    backgroundColor: GRAY_170,
    alignSelf: "center",
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 18,
    color: GRAY_850,
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
    backgroundColor: RED_100,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemInfo: {
    flex: 1,
    gap: 2,
  },
  menuItemTextDanger: {
    fontSize: 15,
    color: RED,
    fontFamily: "Archivo_600SemiBold",
  },
  menuItemSub: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_400Regular",
  },
  menuCancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: GRAY_105,
    marginTop: 4,
  },
  menuCancelText: {
    fontSize: 15,
    color: GRAY_850,
    fontFamily: "Archivo_500Medium",
  },
  instructionsSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  instructionsSheetTitle: {
    fontSize: 18,
    color: GRAY_850,
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
    backgroundColor: PURPLE + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionInfo: {
    flex: 1,
    gap: 2,
  },
  instructionLabel: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  instructionValue: {
    fontSize: 16,
    color: GRAY_850,
    fontFamily: "Archivo_600SemiBold",
  },
  instructionNoteCard: {
    backgroundColor: GRAY_105,
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  instructionNoteLabel: {
    fontSize: 12,
    color: GRAY_600,
    fontFamily: "Archivo_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  instructionNoteText: {
    fontSize: 15,
    color: GRAY_850,
    fontFamily: "Archivo_400Regular",
    lineHeight: 22,
  },
});
