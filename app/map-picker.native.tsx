import React, { useRef, useEffect } from "react";
import { useMapPickerState } from "@/hooks/useMapPickerState";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getApiUrl } from "@/lib/query-client";
import { setPickedLocation } from "@/lib/mapPickerStore";
import NativeMapPickerView from "@/components/NativeMapPickerView";
import { BLACK, BLACK_A55, BLACK_A60, DARK_MAP, GRAY_110, GRAY_170, GRAY_450, GRAY_600, GRAY_750, GRAY_90, GRAY_900, PURPLE, WHITE } from "@/constants/colors";

import styles from "@/styles/map-picker";

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

function CenterPin() {
  return (
    <View style={{ alignItems: "center", transform: [{ translateY: -PIN_SIZE / 2 }] }}>
      <Ionicons
        name="location-sharp"
        size={PIN_SIZE}
        color={PURPLE}
        style={{
          shadowColor: BLACK,
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

  const {
    centerCoord, setCenterCoord,
    confirming, setConfirming,
    step, setStep,
    selectedDir, setSelectedDir,
    geocodedLocation, setGeocodedLocation,
  } = useMapPickerState(initialLat, initialLng);
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (step === "direction") {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [step]);

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

  return (
    <View style={styles.container}>
      <NativeMapPickerView
        initialLat={initialLat}
        initialLng={initialLng}
        onRegionChangeComplete={(lat, lng) => {
          if (step === "pick") setCenterCoord({ lat, lng });
        }}
        locked={step === "direction"}
        lockedLat={centerCoord.lat}
        lockedLng={centerCoord.lng}
        facingDirection={step === "direction" ? selectedDir : null}
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
            <Ionicons name="close" size={18} color={WHITE} />
            <Text style={styles.cancelPillText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmPill, confirming && { opacity: 0.7 }]}
            onPress={handleSetLocation}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={WHITE} />
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
            { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Pressable onPress={() => setStep("pick")} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={GRAY_600} />
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
