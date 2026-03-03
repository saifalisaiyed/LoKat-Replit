import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getApiUrl } from "@/lib/query-client";
import { setPickedLocation } from "@/lib/mapPickerStore";

const PURPLE = "#7C3AED";

function Crosshair() {
  const SIZE = 64;
  const GAP = 10;
  const THICKNESS = 2.5;
  const DOT = 8;

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      {/* Shadow lines for visibility on light maps */}
      <View style={{ position: "absolute", width: SIZE, height: THICKNESS + 2, backgroundColor: "rgba(0,0,0,0.25)" }} />
      <View style={{ position: "absolute", width: THICKNESS + 2, height: SIZE, backgroundColor: "rgba(0,0,0,0.25)" }} />
      {/* Gap cutout — left */}
      <View style={{ position: "absolute", left: 0, width: SIZE / 2 - GAP, height: THICKNESS, backgroundColor: PURPLE }} />
      {/* Gap cutout — right */}
      <View style={{ position: "absolute", right: 0, width: SIZE / 2 - GAP, height: THICKNESS, backgroundColor: PURPLE }} />
      {/* Gap cutout — top */}
      <View style={{ position: "absolute", top: 0, width: THICKNESS, height: SIZE / 2 - GAP, backgroundColor: PURPLE }} />
      {/* Gap cutout — bottom */}
      <View style={{ position: "absolute", bottom: 0, width: THICKNESS, height: SIZE / 2 - GAP, backgroundColor: PURPLE }} />
      {/* Center dot */}
      <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: PURPLE, borderWidth: 2, borderColor: "#fff" }} />
    </View>
  );
}

let NativeMapView: any = null;
if (Platform.OS !== "web") {
  NativeMapView = require("react-native-maps").default;
}

export default function MapPickerScreen() {
  const insets = useSafeAreaInsets();
  const { lat: paramLat, lng: paramLng } = useLocalSearchParams<{
    lat: string;
    lng: string;
  }>();

  const initialLat = parseFloat(paramLat || "40.7580");
  const initialLng = parseFloat(paramLng || "-73.9855");

  const [centerCoord, setCenterCoord] = useState({ lat: initialLat, lng: initialLng });
  const [confirming, setConfirming] = useState(false);
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "centerChange") {
          setCenterCoord({ lat: data.lat, lng: data.lng });
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleConfirm = async () => {
    setConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = new URL("/api/reverse-geocode", getApiUrl());
      url.searchParams.set("lat", centerCoord.lat.toString());
      url.searchParams.set("lng", centerCoord.lng.toString());
      const res = await fetch(url.toString());
      const data = await res.json();
      setPickedLocation({
        lat: centerCoord.lat,
        lng: centerCoord.lng,
        name: data.name || "Selected Location",
        address: data.address || "",
      });
    } catch {
      setPickedLocation({
        lat: centerCoord.lat,
        lng: centerCoord.lng,
        name: "Selected Location",
        address: "",
      });
    }
    setConfirming(false);
    router.back();
  };

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    #map { width: 100%; height: 100vh; }
    .leaflet-control-zoom { display: none; }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${initialLat}, ${initialLng}],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
    map.on('moveend', function() {
      var c = map.getCenter();
      window.parent.postMessage(JSON.stringify({ type: 'centerChange', lat: c.lat, lng: c.lng }), '*');
    });
  </script>
</body>
</html>`;

  const buttons = (
    <View style={[styles.buttonRow, { bottom: insets.bottom + 24 }]}>
      <Pressable style={styles.cancelPill} onPress={() => router.back()}>
        <Ionicons name="close" size={18} color="#fff" />
        <Text style={styles.cancelPillText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={[styles.confirmPill, confirming && { opacity: 0.7 }]}
        onPress={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.confirmPillText}>Set Location</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  const overlay = (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
      <Crosshair />
      <Text style={styles.hintText}>Move map to select spot</Text>
    </View>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{ width: "100%", height: "100%", border: "none" } as any}
          title="Pick location"
        />
        {overlay}
        {buttons}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NativeMapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={true}
        onRegionChangeComplete={(region: any) => {
          setCenterCoord({ lat: region.latitude, lng: region.longitude });
        }}
      />
      {overlay}
      {buttons}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1B2E",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  hintText: {
    marginTop: 14,
    fontSize: 12,
    color: "#fff",
    fontFamily: "Archivo_500Medium",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonRow: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
    zIndex: 20,
  },
  cancelPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  cancelPillText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_500Medium",
  },
  confirmPill: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: 25,
    backgroundColor: PURPLE,
  },
  confirmPillText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Archivo_600SemiBold",
  },
});
