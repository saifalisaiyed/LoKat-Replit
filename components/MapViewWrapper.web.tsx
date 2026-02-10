import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface MapWrapperProps {
  selectedPin: { latitude: number; longitude: number } | null;
  onPinSelect?: (lat: number, lng: number) => void;
  openRequests: any[];
  isSeeker: boolean;
  onMarkerPress: (id: string) => void;
  permissionStatus?: string | null;
  initialRegion?: any;
  mapRef?: any;
  onMapPress?: (e: any) => void;
}

export default function MapViewWrapper({
  selectedPin,
  onPinSelect,
  openRequests,
  isSeeker,
  onMarkerPress,
  initialRegion,
}: MapWrapperProps) {
  const lat = initialRegion?.latitude ?? 40.758;
  const lng = initialRegion?.longitude ?? -73.9855;
  const zoom = 13;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .leaflet-control-zoom { display: none; }
        .leaflet-control-attribution { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          center: [${lat}, ${lng}],
          zoom: ${zoom},
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
        }).addTo(map);

        var markerIcon = L.divIcon({
          html: '<div style="width:28px;height:28px;border-radius:14px;background:${Colors.light.tint};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        var requests = ${JSON.stringify(openRequests.map(r => ({ id: r.id, lat: r.latitude, lng: r.longitude })))};
        requests.forEach(function(req) {
          L.marker([req.lat, req.lng], { icon: markerIcon }).addTo(map);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.webMap}>
      <iframe
        srcDoc={mapHtml}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Map"
      />

      {openRequests.slice(0, 4).map((req: any, i: number) => {
        const positions = [
          { top: "28%", left: "55%" },
          { top: "48%", left: "68%" },
          { top: "18%", left: "75%" },
          { top: "65%", left: "25%" },
        ];
        const pos = positions[i] || positions[0];
        return (
          <Pressable
            key={req.id}
            style={[styles.marker, pos as any]}
            onPress={(e) => {
              e.stopPropagation();
              onMarkerPress(req.id);
            }}
          >
            <View style={styles.markerDot}>
              <Ionicons name="location" size={14} color="#fff" />
            </View>
          </Pressable>
        );
      })}

      {selectedPin && isSeeker && (
        <View style={styles.selectedPin}>
          <Ionicons name="location" size={36} color={Colors.light.tint} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    backgroundColor: "#e5e3df",
    position: "relative",
    overflow: "hidden",
  },
  marker: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
  },
  markerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedPin: {
    position: "absolute",
    top: "45%",
    left: "48%",
    zIndex: 6,
  },
});
