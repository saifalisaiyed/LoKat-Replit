import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface MapWrapperProps {
  selectedPin: { latitude: number; longitude: number } | null;
  onPinSelect?: (lat: number, lng: number) => void;
  openRequests: any[];
  isSeeker: boolean;
  onMarkerPress: (id: string) => void;
  permissionStatus?: string | null;
  initialRegion?: any;
  mapRef?: any;
  onMapPress?: (e: any) => void;
}

export default function MapViewWrapper({
  selectedPin,
  onPinSelect,
  openRequests,
  isSeeker,
  onMarkerPress,
}: MapWrapperProps) {
  const handleTap = () => {
    if (!isSeeker || !onPinSelect) return;
    const lat = 40.758 + (Math.random() - 0.5) * 0.03;
    const lng = -73.9855 + (Math.random() - 0.5) * 0.03;
    onPinSelect(lat, lng);
  };

  return (
    <Pressable style={styles.webMap} onPress={handleTap}>
      <View style={styles.grid}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.lineH,
              { top: `${(i + 1) * 3.33}%` },
            ]}
          />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.lineV,
              { left: `${(i + 1) * 3.33}%` },
            ]}
          />
        ))}
      </View>

      <View style={styles.roadH1} />
      <View style={styles.roadH2} />
      <View style={styles.roadV1} />
      <View style={styles.roadV2} />
      <View style={styles.roadDiag} />

      <View style={styles.labelContainer}>
        <Text style={styles.areaLabel}>SOHO</Text>
      </View>
      <View style={[styles.labelContainer, { top: '25%', left: '30%' }]}>
        <Text style={styles.areaLabel}>LOWER MANHATTAN</Text>
      </View>
      <View style={[styles.labelContainer, { top: '42%', left: '20%' }]}>
        <Text style={styles.cityLabel}>New York</Text>
      </View>
      <View style={[styles.labelContainer, { top: '55%', left: '10%' }]}>
        <Text style={styles.areaLabel}>FINANCIAL DISTRICT</Text>
      </View>
      <View style={[styles.labelContainer, { top: '38%', left: '65%' }]}>
        <Text style={styles.areaLabel}>CHINATOWN</Text>
      </View>
      <View style={[styles.labelContainer, { bottom: '12%', left: '35%' }]}>
        <Text style={styles.areaLabel}>BROOKLYN HEIGHTS</Text>
      </View>

      {openRequests.slice(0, 4).map((req: any, i: number) => {
        const positions = [
          { top: '28%', left: '55%' },
          { top: '48%', left: '68%' },
          { top: '18%', left: '75%' },
          { top: '65%', left: '25%' },
        ];
        const pos = positions[i] || positions[0];
        return (
          <Pressable
            key={req.id}
            style={[styles.marker, pos as any]}
            onPress={(e) => {
              e.stopPropagation();
              onMarkerPress(req.id);
            }}
          >
            <View style={styles.markerDot}>
              <Ionicons name="location" size={14} color="#fff" />
            </View>
          </Pressable>
        );
      })}

      {selectedPin && isSeeker && (
        <View style={styles.selectedPin}>
          <Ionicons name="location" size={36} color={Colors.light.tint} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    backgroundColor: Colors.palette.mapDark,
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  lineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(100, 140, 180, 0.08)",
  },
  lineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(100, 140, 180, 0.08)",
  },
  roadH1: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0, 200, 220, 0.2)",
  },
  roadH2: {
    position: "absolute",
    top: "60%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(0, 200, 220, 0.15)",
  },
  roadV1: {
    position: "absolute",
    left: "45%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(0, 200, 220, 0.18)",
  },
  roadV2: {
    position: "absolute",
    left: "70%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(0, 200, 220, 0.12)",
  },
  roadDiag: {
    position: "absolute",
    top: "50%",
    left: "40%",
    width: 150,
    height: 2,
    backgroundColor: "rgba(0, 200, 220, 0.15)",
    transform: [{ rotate: "-35deg" }],
  },
  labelContainer: {
    position: "absolute",
    top: "15%",
    left: "55%",
  },
  areaLabel: {
    fontSize: 9,
    fontFamily: "Archivo_500Medium",
    color: "rgba(180, 200, 220, 0.4)",
    letterSpacing: 1.5,
  },
  cityLabel: {
    fontSize: 18,
    fontFamily: "Archivo_600SemiBold",
    color: "rgba(200, 220, 240, 0.35)",
    letterSpacing: 0.5,
  },
  marker: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
  },
  markerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  selectedPin: {
    position: "absolute",
    top: "45%",
    left: "48%",
    zIndex: 6,
  },
});
