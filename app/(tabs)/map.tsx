import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/lib/store";
import Colors from "@/constants/colors";
import MapViewWrapper from "@/components/MapViewWrapper";

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const DEFAULT_REGION: Region = {
  latitude: 40.7580,
  longitude: -73.9855,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { profile, requests } = useApp();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedPin, setSelectedPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const isSeeker = profile.role === "seeker";
  const colors = Colors.light;

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
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const newRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    } catch (e) {
      console.log("Location error:", e);
    }
  };

  const handleMapPress = useCallback(
    (e: any) => {
      if (!isSeeker) return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setSelectedPin({ latitude, longitude });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [isSeeker],
  );

  const handleWebPinSelect = useCallback(
    (lat: number, lng: number) => {
      if (!isSeeker) return;
      setSelectedPin({ latitude: lat, longitude: lng });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [isSeeker],
  );

  const handleCreateRequest = () => {
    if (!selectedPin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/create-request",
      params: {
        lat: selectedPin.latitude.toString(),
        lng: selectedPin.longitude.toString(),
      },
    });
  };

  const handleMarkerPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/request-detail/[id]",
      params: { id },
    });
  }, []);

  const goToMyLocation = async () => {
    if (Platform.OS === "web") return;
    try {
      const Location = require("expo-location");
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
    } catch (e) {
      console.log(e);
    }
  };

  const openRequests = requests.filter((r) => r.status === "open");
  const webInsetTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <MapViewWrapper
        selectedPin={selectedPin}
        onPinSelect={handleWebPinSelect}
        openRequests={openRequests}
        isSeeker={isSeeker}
        onMarkerPress={handleMarkerPress}
        permissionStatus={permissionStatus}
        initialRegion={region}
        mapRef={mapRef}
        onMapPress={handleMapPress}
      />

      <View style={[styles.topBar, { top: insets.top + 8 + webInsetTop }]}>
        <View style={styles.roleIndicator}>
          <Ionicons
            name={isSeeker ? "search" : "camera"}
            size={16}
            color={colors.tint}
          />
          <Text style={styles.roleText}>
            {isSeeker ? "Seeker Mode" : "LoKater Mode"}
          </Text>
        </View>

        {!isSeeker && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{openRequests.length}</Text>
            <Text style={styles.countLabel}>nearby</Text>
          </View>
        )}
      </View>

      {Platform.OS !== "web" && (
        <View style={[styles.controlsRight, { top: insets.top + 70 + webInsetTop }]}>
          <Pressable
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.controlBtnPressed,
            ]}
            onPress={goToMyLocation}
          >
            <Ionicons name="locate" size={22} color={colors.text} />
          </Pressable>
        </View>
      )}

      {isSeeker && selectedPin && (
        <View
          style={[
            styles.bottomSheet,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 : insets.bottom + 90,
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Pin dropped</Text>
          <Text style={styles.sheetSubtitle}>
            {selectedPin.latitude.toFixed(4)},{" "}
            {selectedPin.longitude.toFixed(4)}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleCreateRequest}
          >
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Photo Request</Text>
          </Pressable>
        </View>
      )}

      {isSeeker && !selectedPin && (
        <View
          style={[
            styles.hintBar,
            {
              bottom:
                Platform.OS === "web" ? 34 + 84 + 16 : insets.bottom + 100,
            },
          ]}
        >
          <Ionicons
            name="hand-left-outline"
            size={16}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.hintText}>
            Tap anywhere on the map to drop a pin
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_600SemiBold",
  },
  countBadge: {
    backgroundColor: Colors.palette.emerald,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "DMSans_700Bold",
  },
  countLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "DMSans_400Regular",
  },
  controlsRight: {
    position: "absolute",
    right: 16,
    gap: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  controlBtnPressed: {
    backgroundColor: "rgba(240,240,240,0.95)",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    fontFamily: "DMSans_700Bold",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontFamily: "DMSans_400Regular",
  },
  createBtn: {
    marginTop: 16,
    backgroundColor: Colors.palette.emerald,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "DMSans_600SemiBold",
  },
  hintBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hintText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_400Regular",
  },
});
