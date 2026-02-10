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
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.line,
              { top: `${(i + 1) * 5}%`, left: 0, right: 0, height: 1 },
            ]}
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.line,
              { left: `${(i + 1) * 5}%`, top: 0, bottom: 0, width: 1 },
            ]}
          />
        ))}
      </View>

      {openRequests.map((req: any, i: number) => (
        <Pressable
          key={req.id}
          style={[
            styles.marker,
            { top: `${18 + i * 12}%`, left: `${10 + i * 17}%` },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onMarkerPress(req.id);
          }}
        >
          <View
            style={[
              styles.markerDot,
              {
                backgroundColor: isSeeker
                  ? Colors.palette.amber
                  : Colors.palette.emerald,
              },
            ]}
          >
            <Text style={styles.markerPrice}>${req.reward}</Text>
          </View>
          <Text style={styles.markerName} numberOfLines={1}>
            {req.locationName}
          </Text>
        </Pressable>
      ))}

      {selectedPin && isSeeker && (
        <View style={styles.selectedPin}>
          <Ionicons name="location" size={36} color={Colors.palette.emerald} />
        </View>
      )}

      <View style={styles.center}>
        <Ionicons name="map-outline" size={48} color={Colors.light.border} />
        <Text style={styles.centerText}>
          {isSeeker
            ? "Tap to place a pin"
            : `${openRequests.length} requests nearby`}
        </Text>
        <Text style={styles.subText}>Full interactive map on mobile</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    backgroundColor: "#E8F4E8",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  line: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  center: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  centerText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
    fontFamily: "DMSans_600SemiBold",
  },
  subText: {
    fontSize: 13,
    color: Colors.light.tabIconDefault,
    fontFamily: "DMSans_400Regular",
  },
  marker: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
  },
  markerDot: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  markerPrice: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "DMSans_700Bold",
  },
  markerName: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
    maxWidth: 80,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
  },
  selectedPin: {
    position: "absolute",
    top: "45%",
    left: "48%",
    zIndex: 6,
  },
});
