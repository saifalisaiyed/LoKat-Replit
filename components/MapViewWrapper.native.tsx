import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
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
}: MapWrapperProps) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion}
      showsUserLocation={permissionStatus === "granted"}
      showsMyLocationButton={false}
      onPress={onMapPress}
      mapType="standard"
    >
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
