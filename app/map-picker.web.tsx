import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getApiUrl } from "@/lib/query-client";
import { setPickedLocation } from "@/lib/mapPickerStore";

const PURPLE = "#7C3AED";
const PIN_SIZE = 48;

function CenterPin() {
  return (
    <View style={{ alignItems: "center", transform: [{ translateY: -PIN_SIZE / 2 }] }}>
      <Ionicons
        name="location-sharp"
        size={PIN_SIZE}
        color={PURPLE}
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        } as any}
      />
    </View>
  );
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

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        style={{ width: "100%", height: "100%", border: "none" } as any}
        title="Pick location"
      />

      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
        <CenterPin />
        <Text style={styles.hintText}>Move map to select spot</Text>
      </View>

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
