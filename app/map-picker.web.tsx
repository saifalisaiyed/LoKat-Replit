import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getApiUrl } from "@/lib/query-client";
import { setPickedLocation } from "@/lib/mapPickerStore";

const PURPLE = "#7C3AED";
const PIN_SIZE = 48;

const COMPASS_DIRS = [
  { label: "NW", angle: 315, row: 0, col: 0 },
  { label: "N",  angle: 0,   row: 0, col: 1 },
  { label: "NE", angle: 45,  row: 0, col: 2 },
  { label: "W",  angle: 270, row: 1, col: 0 },
  { label: "E",  angle: 90,  row: 1, col: 2 },
  { label: "SW", angle: 225, row: 2, col: 0 },
  { label: "S",  angle: 180, row: 2, col: 1 },
  { label: "SE", angle: 135, row: 2, col: 2 },
];

const DIR_FULL: Record<string, string> = {
  N: "North", NE: "Northeast", E: "East", SE: "Southeast",
  S: "South", SW: "Southwest", W: "West", NW: "Northwest",
};

const DIR_BEARING: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

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

function sendToIframe(iframeRef: React.MutableRefObject<any>, msg: object) {
  try {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  } catch {}
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
  const [step, setStep] = useState<"pick" | "direction">("pick");
  const [selectedDir, setSelectedDir] = useState("N");
  const [geocodedLocation, setGeocodedLocation] = useState<{ name: string; address: string } | null>(null);
  const slideAnim = useRef(new Animated.Value(500)).current;
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "centerChange" && step === "pick") {
          setCenterCoord({ lat: data.lat, lng: data.lng });
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [step]);

  // When direction step activates, zoom the map to the pin and draw cone
  useEffect(() => {
    if (step === "direction") {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
      // Small delay to ensure iframe is ready for postMessage
      setTimeout(() => {
        sendToIframe(iframeRef, {
          type: "lockLocation",
          lat: centerCoord.lat,
          lng: centerCoord.lng,
          bearing: DIR_BEARING[selectedDir] ?? 0,
        });
      }, 80);
    } else {
      slideAnim.setValue(500);
      sendToIframe(iframeRef, { type: "unlock" });
    }
  }, [step]);

  // Live-update cone as user taps direction cells
  useEffect(() => {
    if (step === "direction") {
      sendToIframe(iframeRef, {
        type: "setDirection",
        bearing: DIR_BEARING[selectedDir] ?? 0,
      });
    }
  }, [selectedDir, step]);

  const handleSetLocation = async () => {
    setConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = new URL("/api/reverse-geocode", getApiUrl());
      url.searchParams.set("lat", centerCoord.lat.toString());
      url.searchParams.set("lng", centerCoord.lng.toString());
      const res = await fetch(url.toString());
      const data = await res.json();
      setGeocodedLocation({
        name: data.name || "Selected Location",
        address: data.address || "",
      });
    } catch {
      setGeocodedLocation({ name: "Selected Location", address: "" });
    }
    setConfirming(false);
    setStep("direction");
  };

  const handleConfirmDirection = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPickedLocation({
      lat: centerCoord.lat,
      lng: centerCoord.lng,
      name: geocodedLocation?.name || "Selected Location",
      address: geocodedLocation?.address || "",
      facingDirection: selectedDir,
    });
    router.back();
  };

  const handleSkipDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickedLocation({
      lat: centerCoord.lat,
      lng: centerCoord.lng,
      name: geocodedLocation?.name || "Selected Location",
      address: geocodedLocation?.address || "",
    });
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

    // Cone / direction indicator
    var coneLayer = null;
    var pinMarker = null;
    var pinnedLat = null, pinnedLng = null;

    function destPoint(lat, lng, bearingDeg, radiusM) {
      var R = 6371000;
      var d = radiusM / R;
      var b = bearingDeg * Math.PI / 180;
      var lat1 = lat * Math.PI / 180;
      var lng1 = lng * Math.PI / 180;
      var lat2 = Math.asin(Math.sin(lat1)*Math.cos(d) + Math.cos(lat1)*Math.sin(d)*Math.cos(b));
      var lng2 = lng1 + Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(lat1), Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
      return [lat2*180/Math.PI, lng2*180/Math.PI];
    }

    function coneSector(lat, lng, bearing, radiusM, halfAngle, steps) {
      var pts = [[lat, lng]];
      for (var i = 0; i <= steps; i++) {
        var angle = bearing - halfAngle + (i * 2 * halfAngle / steps);
        pts.push(destPoint(lat, lng, angle, radiusM));
      }
      return pts;
    }

    function drawCone(bearing) {
      if (!pinnedLat) return;
      if (coneLayer) { map.removeLayer(coneLayer); coneLayer = null; }
      var pts = coneSector(pinnedLat, pinnedLng, bearing, 100, 38, 24);
      coneLayer = L.polygon(pts, {
        color: 'rgba(124,58,237,0.85)',
        fillColor: 'rgba(124,58,237,0.28)',
        fillOpacity: 1,
        weight: 2,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'lockLocation') {
          pinnedLat = data.lat;
          pinnedLng = data.lng;
          map.setView([data.lat, data.lng], 18, { animate: true, duration: 0.5 });
          map.dragging.disable();
          map.scrollWheelZoom.disable();
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.boxZoom.disable();
          if (pinMarker) { map.removeLayer(pinMarker); }
          var icon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:#7C3AED;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(124,58,237,0.6);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            className: '',
          });
          pinMarker = L.marker([data.lat, data.lng], { icon: icon }).addTo(map);
          if (data.bearing !== undefined) drawCone(data.bearing);
        }
        if (data.type === 'setDirection') {
          drawCone(data.bearing);
        }
        if (data.type === 'unlock') {
          if (coneLayer) { map.removeLayer(coneLayer); coneLayer = null; }
          if (pinMarker) { map.removeLayer(pinMarker); pinMarker = null; }
          pinnedLat = null; pinnedLng = null;
          map.dragging.enable();
          map.scrollWheelZoom.enable();
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.boxZoom.enable();
        }
      } catch(err) {}
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

      {step === "pick" && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <CenterPin />
          <Text style={styles.hintText}>Move map to select spot</Text>
        </View>
      )}

      {step === "pick" && (
        <View style={[styles.buttonRow, { bottom: insets.bottom + 24 }]}>
          <Pressable style={styles.cancelPill} onPress={() => router.back()}>
            <Ionicons name="close" size={18} color="#fff" />
            <Text style={styles.cancelPillText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmPill, confirming && { opacity: 0.7 }]}
            onPress={handleSetLocation}
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
      )}

      {step === "direction" && (
        <Animated.View
          style={[
            styles.directionSheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Pressable onPress={() => setStep("pick")} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#6B7280" />
            </Pressable>
            <View style={styles.sheetTitleWrap}>
              <Text style={styles.sheetTitle}>Which direction?</Text>
              <Text style={styles.sheetSub}>Which way will the camera face?</Text>
            </View>
            <Pressable onPress={handleSkipDirection} hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.gridRow}>
                {[0, 1, 2].map((col) => {
                  if (row === 1 && col === 1) {
                    return (
                      <View key="center" style={styles.centerCell}>
                        <Text style={styles.centerEmoji}>📷</Text>
                      </View>
                    );
                  }
                  const dir = COMPASS_DIRS.find((d) => d.row === row && d.col === col);
                  if (!dir) return null;
                  const isSelected = selectedDir === dir.label;
                  return (
                    <Pressable
                      key={dir.label}
                      style={[styles.dirCell, isSelected && styles.dirCellActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDir(dir.label);
                      }}
                    >
                      <Text
                        style={[
                          styles.dirArrow,
                          isSelected && styles.dirArrowActive,
                          { transform: [{ rotate: `${dir.angle}deg` }] },
                        ]}
                      >
                        ↑
                      </Text>
                      <Text style={[styles.dirLabel, isSelected && styles.dirLabelActive]}>
                        {dir.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.resultRow}>
            <Ionicons name="compass-outline" size={15} color={PURPLE} />
            <Text style={styles.resultText}>
              Camera will face{" "}
              <Text style={styles.resultDir}>{DIR_FULL[selectedDir]}</Text>
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.confirmDirBtn, pressed && { opacity: 0.88 }]}
            onPress={handleConfirmDirection}
          >
            <Text style={styles.confirmDirText}>Confirm Direction</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1B2E" },
  overlay: { justifyContent: "center", alignItems: "center", zIndex: 10 },
  hintText: {
    marginTop: 14, fontSize: 12, color: "#fff",
    fontFamily: "Archivo_500Medium",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, overflow: "hidden",
  },
  buttonRow: {
    position: "absolute", left: 20, right: 20,
    flexDirection: "row", gap: 12, zIndex: 20,
  },
  cancelPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, height: 50,
    borderRadius: 25, backgroundColor: "rgba(0,0,0,0.60)",
  },
  cancelPillText: { color: "#fff", fontSize: 15, fontFamily: "Archivo_500Medium" },
  confirmPill: {
    flex: 2, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, height: 50,
    borderRadius: 25, backgroundColor: PURPLE,
  },
  confirmPillText: { color: "#fff", fontSize: 15, fontFamily: "Archivo_600SemiBold" },

  directionSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 10,
    zIndex: 30,
    shadowColor: "#000", shadowOpacity: 0.18,
    shadowRadius: 24, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 20,
  },
  sheetTitleWrap: { flex: 1, alignItems: "center" },
  sheetTitle: { fontSize: 16, fontFamily: "Archivo_600SemiBold", color: "#111827" },
  sheetSub: { fontSize: 12, color: "#9CA3AF", fontFamily: "Archivo_400Regular", marginTop: 2 },
  skipText: { fontSize: 14, color: "#9CA3AF", fontFamily: "Archivo_500Medium" },

  grid: { gap: 8, marginBottom: 16 },
  gridRow: { flexDirection: "row", gap: 8 },
  dirCell: {
    flex: 1, aspectRatio: 1, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5, borderColor: "#E5E7EB",
    gap: 3,
  },
  dirCellActive: {
    backgroundColor: PURPLE, borderColor: PURPLE,
    shadowColor: PURPLE, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  centerCell: {
    flex: 1, aspectRatio: 1, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB",
  },
  centerEmoji: { fontSize: 22 },
  dirArrow: { fontSize: 17, color: "#9CA3AF", lineHeight: 20 },
  dirArrowActive: { color: "#fff" },
  dirLabel: { fontSize: 11, fontFamily: "Archivo_600SemiBold", color: "#374151" },
  dirLabelActive: { color: "#fff" },

  resultRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginBottom: 14,
  },
  resultText: { fontSize: 13, color: "#6B7280", fontFamily: "Archivo_400Regular" },
  resultDir: { fontFamily: "Archivo_600SemiBold", color: "#111827" },

  confirmDirBtn: {
    backgroundColor: PURPLE, borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
  },
  confirmDirText: { color: "#fff", fontSize: 15, fontFamily: "Archivo_600SemiBold" },
});
