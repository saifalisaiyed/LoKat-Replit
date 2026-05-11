import React, { useState } from "react";
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
import NativeMapPickerView from "@/components/NativeMapPickerView";

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
        }}
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

  return (
    <View style={styles.container}>
      <NativeMapPickerView
        initialLat={initialLat}
        initialLng={initialLng}
        onRegionChangeComplete={(lat, lng) => setCenterCoord({ lat, lng })}
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
  container: { flex: 1, backgroundColor: "#1A1B2E" },
  overlay: { justifyContent: "center", alignItems: "center", zIndex: 10 },
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
  cancelPillText: { color: "#fff", fontSize: 15, fontFamily: "Archivo_500Medium" },
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
  confirmPillText: { color: "#fff", fontSize: 15, fontFamily: "Archivo_600SemiBold" },
});
