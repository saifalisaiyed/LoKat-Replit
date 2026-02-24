import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
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
  onPoiClick?: (e: any) => void;
  showHeatmap?: boolean;
}

function MapViewWrapperInner({
  selectedPin,
  openRequests,
  isSeeker,
  onMarkerPress,
  initialRegion,
  onMapPress,
  mapRef,
  showHeatmap = true,
}: MapWrapperProps) {
  const lat = initialRegion?.latitude ?? 40.758;
  const lng = initialRegion?.longitude ?? -73.9855;
  const zoom = 13;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "mapClick" && onMapPress) {
          onMapPress({
            nativeEvent: {
              coordinate: { latitude: data.lat, longitude: data.lng },
            },
          });
        }
        if (data.type === "markerClick" && data.id) {
          onMarkerPress(data.id);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMapPress, onMarkerPress]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; cursor: pointer; }
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
        
        var heatLayer = null;
        var showHeatmap = ${showHeatmap ? 'true' : 'false'};
        if (showHeatmap && requests.length > 0) {
          var heatPoints = requests.map(function(r) { return [r.lat, r.lng, 0.6]; });
          heatLayer = L.heatLayer(heatPoints, {
            radius: 30,
            blur: 22,
            maxZoom: 16,
            max: 1.0,
            minOpacity: 0.12,
            gradient: {
              0.0: 'rgba(124, 58, 237, 0)',
              0.2: 'rgba(124, 58, 237, 0.06)',
              0.4: 'rgba(139, 92, 246, 0.15)',
              0.6: 'rgba(167, 139, 250, 0.28)',
              0.8: 'rgba(196, 181, 253, 0.4)',
              1.0: 'rgba(237, 233, 254, 0.55)'
            }
          }).addTo(map);
        }

        requests.forEach(function(req) {
          var m = L.marker([req.lat, req.lng], { icon: markerIcon }).addTo(map);
          m.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.parent.postMessage(JSON.stringify({
              type: 'markerClick',
              id: req.id
            }), '*');
          });
        });

        map.on('click', function(e) {
          window.parent.postMessage(JSON.stringify({
            type: 'mapClick',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }), '*');
        });

        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'centerLocation') {
              map.setView([data.lat, data.lng], 16, { animate: true });
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        centerToLocation: (lat: number, lng: number) => {
          const iframe = iframeRef.current;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ type: "centerLocation", lat, lng }),
              "*"
            );
          }
        },
      };
    }
  }, [mapRef]);

  return (
    <View style={styles.webMap}>
      <iframe
        ref={iframeRef as any}
        srcDoc={mapHtml}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Map"
      />
    </View>
  );
}

export default function MapViewWrapper(props: MapWrapperProps) {
  return <MapViewWrapperInner {...props} />;
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    backgroundColor: "#1A1B2E",
    position: "relative",
    overflow: "hidden",
  },
});
