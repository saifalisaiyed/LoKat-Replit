import React from "react";
import { StyleSheet } from "react-native";
import MapView from "react-native-maps";

interface Props {
  initialLat: number;
  initialLng: number;
  onRegionChangeComplete: (lat: number, lng: number) => void;
}

export default function NativeMapPickerView({ initialLat, initialLng, onRegionChangeComplete }: Props) {
  return (
    <MapView
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
      onRegionChangeComplete={(region) => {
        onRegionChangeComplete(region.latitude, region.longitude);
      }}
    />
  );
}
