import React, { useRef, useEffect } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Colors from "@/constants/colors";

interface NavigationMapProps {
  userLocation: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}

export default function NavigationMap({ userLocation, destination }: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      const coords = [userLocation, destination];
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 200, left: 60 },
        animated: true,
      });
    }
  }, [userLocation.latitude, userLocation.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: (userLocation.latitude + destination.latitude) / 2,
        longitude: (userLocation.longitude + destination.longitude) / 2,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      showsUserLocation
      showsMyLocationButton={false}
    >
      <Polyline
        coordinates={[userLocation, destination]}
        strokeColor={Colors.light.tint}
        strokeWidth={4}
        lineDashPattern={[8, 12]}
      />
      <Marker coordinate={destination} pinColor={Colors.light.tint} />
    </MapView>
  );
}
