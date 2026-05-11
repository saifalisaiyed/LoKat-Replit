import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface MiniMapProps {
  latitude: number;
  longitude: number;
  style?: ViewStyle;
}

export default function MiniMap({ latitude, longitude, style }: MiniMapProps) {
  const delta = 0.003;
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={{ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude, longitude }} pinColor="#7C3AED" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 130,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e5e5e5",
  },
});
