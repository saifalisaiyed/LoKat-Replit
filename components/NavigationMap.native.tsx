import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  BLACK,
  GOOGLE_BLUE,
  PURPLE,
  WHITE,
  WHITE_A60,
} from "@/constants/colors";

export interface NavigationMapHandle {
  recenter: () => void;
}

interface NavigationMapProps {
  userLocation: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  routePolyline: { latitude: number; longitude: number }[];
  bearing: number;
}

const NavigationMap = forwardRef<NavigationMapHandle, NavigationMapProps>(
  function NavigationMap({ userLocation, destination, routePolyline, bearing }, ref) {
    const mapRef = useRef<MapView>(null);
    const isFirstRef = useRef(true);

    useImperativeHandle(ref, () => ({
      recenter() {
        if (!mapRef.current) return;
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
      },
    }));

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
              strokeColor={WHITE_A60}
              strokeWidth={10}
            />
            <Polyline
              coordinates={routePolyline}
              strokeColor={GOOGLE_BLUE}
              strokeWidth={6}
            />
          </>
        )}

        <Marker coordinate={destination}>
          <View style={styles.destOuter}>
            <View style={styles.destInner} />
          </View>
        </Marker>
      </MapView>
    );
  }
);

export default NavigationMap;

const styles = StyleSheet.create({
  destOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: WHITE,
  },
});
