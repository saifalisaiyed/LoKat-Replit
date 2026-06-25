import React, { useMemo } from "react";
import { StyleSheet, Platform } from "react-native";
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from "react-native-maps";
import {
  PURPLE,
  PURPLE_A00,
  PURPLE_LIGHT_A40,
  PURPLE_MED_A80,
  PURPLE_MID_A60,
  PURPLE_PALE_A100,
} from "@/constants/colors";

interface MapWrapperProps {
  selectedPin: { latitude: number; longitude: number } | null;
  openRequests: any[];
  isSeeker: boolean;
  onMarkerPress: (id: string) => void;
  permissionStatus: string | null;
  initialRegion: any;
  mapRef: any;
  onMapPress: (e: any) => void;
  onPoiClick?: (e: any) => void;
  showHeatmap?: boolean;
}

export default function MapViewWrapper({
  selectedPin,
  openRequests,
  isSeeker,
  onMarkerPress,
  permissionStatus,
  initialRegion,
  mapRef,
  onMapPress,
  onPoiClick,
  showHeatmap = false,
}: MapWrapperProps) {
  const heatmapPoints = useMemo(() => {
    return openRequests.map((req: any) => ({
      latitude: req.latitude,
      longitude: req.longitude,
      weight: 1,
    }));
  }, [openRequests]);

  const useGoogleMaps = Platform.OS === "android";

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={useGoogleMaps ? PROVIDER_GOOGLE : undefined}
      initialRegion={initialRegion}
      showsUserLocation={permissionStatus === "granted"}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterest={true}
      onPress={onMapPress}
      onPoiClick={onPoiClick || onMapPress}
      mapType="standard"
    >
      {showHeatmap && heatmapPoints.length > 0 && useGoogleMaps && (
        <Heatmap
          points={heatmapPoints}
          radius={40}
          opacity={0.6}
          gradient={{
            colors: [PURPLE_A00, PURPLE_LIGHT_A40, PURPLE_MID_A60, PURPLE_MED_A80, PURPLE_PALE_A100],
            startPoints: [0.0, 0.25, 0.5, 0.75, 1.0],
            colorMapSize: 256,
          }}
        />
      )}
      {selectedPin && isSeeker && (
        <Marker coordinate={selectedPin} pinColor={PURPLE} />
      )}
      {openRequests.map((req: any) => (
        <Marker
          key={req.id}
          coordinate={{ latitude: req.latitude, longitude: req.longitude }}
          pinColor={PURPLE}
          onPress={() => onMarkerPress(req.id)}
        />
      ))}
    </MapView>
  );
}
