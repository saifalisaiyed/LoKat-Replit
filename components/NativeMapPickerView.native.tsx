import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import { PURPLE, PURPLE_A25, PURPLE_A75 } from "@/constants/colors.js";

interface Props {
  initialLat: number;
  initialLng: number;
  onRegionChangeComplete: (lat: number, lng: number) => void;
  locked?: boolean;
  lockedLat?: number;
  lockedLng?: number;
  facingDirection?: string | null;
}

const DIR_BEARING: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

function destPoint(lat: number, lng: number, bearingDeg: number, radiusM: number) {
  const R = 6371000;
  const d = radiusM / R;
  const b = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI };
}

function coneSector(
  lat: number,
  lng: number,
  bearing: number,
  radiusM: number,
  halfAngle: number,
  steps: number
) {
  const pts: { latitude: number; longitude: number }[] = [{ latitude: lat, longitude: lng }];
  for (let stepIndex = 0; stepIndex <= steps; stepIndex++) {
    const angle = bearing - halfAngle + (stepIndex * 2 * halfAngle) / steps;
    pts.push(destPoint(lat, lng, angle, radiusM));
  }
  return pts;
}

export default function NativeMapPickerView({
  initialLat,
  initialLng,
  onRegionChangeComplete,
  locked,
  lockedLat,
  lockedLng,
  facingDirection,
}: Props) {
  const bearing = facingDirection != null ? (DIR_BEARING[facingDirection] ?? 0) : 0;

  const coneCoords = useMemo(() => {
    if (locked && lockedLat != null && lockedLng != null && facingDirection) {
      return coneSector(lockedLat, lockedLng, bearing, 110, 38, 24);
    }
    return [];
  }, [locked, lockedLat, lockedLng, bearing, facingDirection]);

  if (locked && lockedLat != null && lockedLng != null) {
    // Shift center southward so the pin appears above the direction sheet,
    // not hidden behind it. 0.0008° ≈ bottom-quarter offset for a 0.003° delta.
    return (
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: lockedLat - 0.0008,
          longitude: lockedLng,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={true}
      >
        {facingDirection && coneCoords.length > 0 && (
          <Polygon
            coordinates={coneCoords}
            fillColor={PURPLE_A25}
            strokeColor={PURPLE_A75}
            strokeWidth={2}
          />
        )}
        <Marker
          coordinate={{ latitude: lockedLat, longitude: lockedLng }}
          pinColor={PURPLE}
        />
      </MapView>
    );
  }

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
