import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { GRAY_180 } from "@/constants/colors";

interface MiniMapProps {
  latitude: number;
  longitude: number;
  style?: ViewStyle;
}

export default function MiniMap({ latitude, longitude, style }: MiniMapProps) {
  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-zoom, .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${latitude}, ${longitude}],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
    var icon = L.divIcon({
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#7C3AED;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([${latitude}, ${longitude}], { icon: icon }).addTo(map);
  </script>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <iframe
        srcDoc={mapHtml}
        style={{ width: "100%", height: "100%", border: "none" } as any}
        title="Location preview"
        scrolling="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 130,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: GRAY_180,
  },
});
