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
import Colors from "@/constants/colors";

function Crosshair() {
  return (
    <View style={ch.root} pointerEvents="none">
      <View style={ch.lineH} />
      <View style={ch.lineV} />
      <View style={ch.circle} />
    </View>
  );
}

const CROSSHAIR_SIZE = 56;
const ch = StyleSheet.create({
  root: {
    width: CROSSHAIR_SIZE,
    height: CROSSHAIR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  lineH: {
    position: "absolute",
    width: CROSSHAIR_SIZE,
    height: 1.5,
    backgroundColor: Colors.light.primary,
  },
  lineV: {
    position: "absolute",
    width: 1.5,
    height: CROSSHAIR_SIZE,
    backgroundColor: Colors.light.primary,
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

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

  const [centerCoord, setCenterCoord] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [confirming, setConfirming] = useState(false);
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
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

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{ width: "100%", height: "100%", border: "none" } as any}
          title="Pick location"
        />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <Crosshair />
          <Text style={styles.hintText}>Move map to select spot</Text>
        </View>
        <Pressable
          style={[styles.cancelBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Confirm Location</Text>
            )}
          </Pressable>
        </View>
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

      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
        <Crosshair />
        <Text style={styles.hintText}>Move map to select spot</Text>
      </View>

      <Pressable
        style={[styles.cancelBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Confirm Location</Text>
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
    marginTop: 12,
    fontSize: 13,
    color: "#fff",
    fontFamily: "Archivo_500Medium",
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  cancelBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Archivo_600SemiBold",
  },
});
