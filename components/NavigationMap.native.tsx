import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Colors from "@/constants/colors";

interface NavigationMapProps {
  userLocation: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  routePolyline: { latitude: number; longitude: number }[];
  bearing: number;
}

export default function NavigationMap({
  userLocation,
  destination,
  routePolyline,
  bearing,
}: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (!mapRef.current) return;
    if (isFirstRef.current) {
      isFirstRef.current = false;
      mapRef.current.animateCamera(
        {
          center: userLocation,
          heading: bearing,
          pitch: 40,
          zoom: 17,
          altitude: 400,
        },
        { duration: 800 }
      );
    } else {
      mapRef.current.animateCamera(
        {
          center: userLocation,
          heading: bearing,
          pitch: 40,
          zoom: 17,
          altitude: 400,
        },
        { duration: 600 }
      );
    }
  }, [userLocation.latitude, userLocation.longitude, bearing]);

  const hasRoute = routePolyline.length > 1;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialCamera={{
        center: userLocation,
        heading: bearing,
        pitch: 40,
        zoom: 17,
        altitude: 400,
      }}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      showsTraffic={false}
      followsUserLocation={false}
    >
      {hasRoute && (
        <>
          <Polyline
            coordinates={routePolyline}
            strokeColor="rgba(255,255,255,0.6)"
            strokeWidth={10}
          />
          <Polyline
            coordinates={routePolyline}
            strokeColor="#4285F4"
            strokeWidth={6}
          />
        </>
      )}

      {!hasRoute && (
        <Polyline
          coordinates={[userLocation, destination]}
          strokeColor={Colors.light.tint}
          strokeWidth={4}
          lineDashPattern={[8, 12]}
        />
      )}

      <Marker coordinate={destination}>
        <View style={styles.destOuter}>
          <View style={styles.destInner} />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  destOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
