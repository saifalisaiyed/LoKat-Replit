import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import Colors from "@/constants/colors";

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
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      showsUserLocation={permissionStatus === "granted"}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterest={true}
      onPress={onMapPress}
      onPoiClick={onPoiClick || onMapPress}
      mapType="standard"
    >
      {showHeatmap && openRequests.map((req: any) => (
        <React.Fragment key={`heat-${req.id}`}>
          <Circle
            center={{ latitude: req.latitude, longitude: req.longitude }}
            radius={500}
            fillColor="rgba(124, 58, 237, 0.12)"
            strokeColor="rgba(124, 58, 237, 0)"
          />
          <Circle
            center={{ latitude: req.latitude, longitude: req.longitude }}
            radius={250}
            fillColor="rgba(139, 92, 246, 0.2)"
            strokeColor="rgba(139, 92, 246, 0)"
          />
          <Circle
            center={{ latitude: req.latitude, longitude: req.longitude }}
            radius={100}
            fillColor="rgba(167, 139, 250, 0.3)"
            strokeColor="rgba(167, 139, 250, 0)"
          />
        </React.Fragment>
      ))}
      {selectedPin && isSeeker && (
        <Marker coordinate={selectedPin} pinColor={Colors.light.tint} />
      )}
      {openRequests.map((req: any) => (
        <Marker
          key={req.id}
          coordinate={{ latitude: req.latitude, longitude: req.longitude }}
          pinColor={Colors.light.tint}
          onPress={() => onMarkerPress(req.id)}
        />
      ))}
    </MapView>
  );
}
