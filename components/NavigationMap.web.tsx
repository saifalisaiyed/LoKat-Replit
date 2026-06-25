import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { BLACK_A60, BLUE, DARK_MAP, WHITE } from "@/constants/colors";

interface NavigationMapProps {
  userLocation: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}

const NavigationMap = forwardRef<unknown, NavigationMapProps>(
  function NavigationMap({ userLocation, destination }, _ref) {
    const midLat = (userLocation.latitude + destination.latitude) / 2;
    const midLng = (userLocation.longitude + destination.longitude) / 2;
    return (
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: DARK_MAP, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "90%", aspectRatio: 1.6, borderRadius: 16, overflow: "hidden" }}>
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${midLng - 0.015},${midLat - 0.01},${midLng + 0.015},${midLat + 0.01}&layer=mapnik&marker=${destination.latitude},${destination.longitude}`}
              style={{ width: "100%", height: "100%", border: "none" } as any}
            />
          </View>
          <View style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: BLACK_A60, borderRadius: 12, padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: BLUE }} />
                <Text style={{ color: WHITE, fontSize: 12, fontFamily: "Archivo_400Regular" }}>You</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.tint }} />
                <Text style={{ color: WHITE, fontSize: 12, fontFamily: "Archivo_400Regular" }}>Destination</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

export default NavigationMap;
